# =======================================================================
# NutriCare AI - Public Tunnel (+ Vercel sync)
# Exposes the web app (port 3000) on a public HTTPS URL. The PHP API is
# proxied through Next.js (/api/v1), so one tunnel serves the whole app.
#
# If this repo is linked to Vercel (.vercel/project.json exists), the new
# tunnel URL is written to Vercel's BACKEND_URL and production is redeployed,
# so the Vercel site keeps working after the tunnel URL changes.
#
#   .\tunnel.ps1                 # Cloudflare quick tunnel + Vercel sync
#   .\tunnel.ps1 -NoVercel       # tunnel only, leave Vercel untouched
#   .\tunnel.ps1 -Provider ngrok # ngrok (needs `ngrok config add-authtoken`)
# =======================================================================
param(
    [ValidateSet('cloudflared', 'ngrok')]
    [string]$Provider = 'cloudflared',
    [int]$Port = 3000,
    [switch]$NoVercel
)

$ErrorActionPreference = 'Continue'
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$urlFile = Join-Path $rootDir '.tunnel-url'
$pidFile = Join-Path $rootDir '.tunnel-pid'
$syncedFile = Join-Path $rootDir '.tunnel-vercel-url'

function Test-Url($url, $timeout = 2) {
    try { (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec $timeout).StatusCode -eq 200 } catch { $false }
}

# 1. Make sure the stack is running
if (-not (Test-Url "http://localhost:$Port")) {
    Write-Host "Web app not running on :$Port - starting services via start.ps1..." -ForegroundColor Yellow
    & "$rootDir\start.ps1"
    Set-Location $rootDir   # start.ps1 changes directory
}
if (-not (Test-Url "http://localhost:$Port")) {
    Write-Host "[ERROR] Web app still not reachable on http://localhost:$Port" -ForegroundColor Red
    exit 1
}

# 2. Stop a previous tunnel started by this script, then start a new one
if (Test-Path $pidFile) {
    $oldPid = (Get-Content $pidFile -Raw).Trim()
    if ($oldPid -and (Get-Process -Id $oldPid -ErrorAction SilentlyContinue)) {
        Write-Host "Stopping previous tunnel (PID $oldPid)..." -ForegroundColor DarkGray
        Stop-Process -Id $oldPid -Force -ErrorAction SilentlyContinue
    }
}

$logFile = Join-Path $env:TEMP "nutricare-tunnel.log"
Remove-Item $logFile -ErrorAction SilentlyContinue

if ($Provider -eq 'cloudflared') {
    if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
        Write-Host "[ERROR] cloudflared not found. Install: winget install Cloudflare.cloudflared" -ForegroundColor Red
        exit 1
    }
    $proc = Start-Process cloudflared -ArgumentList "tunnel --no-autoupdate --url http://localhost:$Port --logfile `"$logFile`"" -PassThru -WindowStyle Hidden
    $pattern = 'https://[a-z0-9-]+\.trycloudflare\.com'
} else {
    if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
        Write-Host "[ERROR] ngrok not found. Install: npm i -g ngrok" -ForegroundColor Red
        exit 1
    }
    $proc = Start-Process ngrok -ArgumentList "http $Port --log `"$logFile`" --log-format logfmt" -PassThru -WindowStyle Hidden
    $pattern = 'https://[a-z0-9.-]+\.ngrok(-free)?\.(app|dev|io)'
}

# 3. Wait for the public URL
$publicUrl = $null
for ($i = 0; $i -lt 30 -and -not $publicUrl; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $logFile) {
        $m = Select-String -Path $logFile -Pattern $pattern | Select-Object -First 1
        if ($m) { $publicUrl = $m.Matches[0].Value }
    }
    if ($proc.HasExited) { break }
}

if (-not $publicUrl) {
    Write-Host "[ERROR] Tunnel did not come up. See log: $logFile" -ForegroundColor Red
    if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
    exit 1
}

Set-Content -Path $urlFile -Value $publicUrl
Set-Content -Path $pidFile -Value $proc.Id

# New quick-tunnel hostnames take a few seconds to resolve.
$reachable = $false
for ($i = 0; $i -lt 20 -and -not $reachable; $i++) {
    Start-Sleep -Seconds 3
    $reachable = Test-Url "$publicUrl/api/v1/health" 15
}
if (-not $reachable) {
    Write-Host "[WARN] Tunnel URL is not answering yet; it may need another minute." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=======================================================================" -ForegroundColor DarkGreen
Write-Host "  PUBLIC URL:  $publicUrl" -ForegroundColor Green
Write-Host "  API (proxied): $publicUrl/api/v1/health" -ForegroundColor Yellow
Write-Host "  Provider: $Provider (PID $($proc.Id))   Log: $logFile" -ForegroundColor DarkGray
Write-Host "  Stop the tunnel:  Stop-Process -Id $($proc.Id)   or   .\stop.ps1" -ForegroundColor DarkGray
Write-Host "=======================================================================" -ForegroundColor DarkGreen

# 4. Sync Vercel so the hosted frontend forwards /api/v1 to this tunnel
$vercelLinked = Test-Path (Join-Path $rootDir '.vercel\project.json')
if ($NoVercel -or -not $vercelLinked) {
    if (-not $NoVercel) { Write-Host "Vercel not linked here (.vercel missing) - skipping Vercel sync." -ForegroundColor DarkGray }
    exit 0
}
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "[WARN] Vercel CLI not found - skipping Vercel sync. Install: npm i -g vercel" -ForegroundColor Yellow
    exit 0
}

$lastSynced = if (Test-Path $syncedFile) { (Get-Content $syncedFile -Raw).Trim() } else { '' }
if ($lastSynced -eq $publicUrl) {
    Write-Host "Vercel already points at this tunnel - nothing to redeploy." -ForegroundColor DarkGray
    exit 0
}

Write-Host "`nSyncing Vercel BACKEND_URL -> $publicUrl and redeploying production..." -ForegroundColor Cyan
Push-Location $rootDir
try {
    # Write the value without BOM or newline; piping from PowerShell adds characters
    # that make the Next.js rewrite invalid.
    $valueFile = Join-Path $env:TEMP 'nutricare-backend-url.txt'
    [System.IO.File]::WriteAllText($valueFile, $publicUrl, (New-Object System.Text.UTF8Encoding($false)))

    $ok = $true
    foreach ($target in 'production', 'preview') {
        cmd /c "vercel env add BACKEND_URL $target --force < `"$valueFile`"" 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { $ok = $false; Write-Host "[ERROR] Could not set BACKEND_URL for $target" -ForegroundColor Red }
    }
    Remove-Item $valueFile -ErrorAction SilentlyContinue

    if ($ok) {
        $out = cmd /c "vercel deploy --prod --yes 2>&1"
        $prodLine = $out | Select-String 'Production URL: (https://\S+?)"?,?$' | Select-Object -Last 1
        if ($LASTEXITCODE -eq 0) {
            Set-Content -Path $syncedFile -Value $publicUrl
            $prod = if ($prodLine) { $prodLine.Matches[0].Groups[1].Value } else { '(see Vercel dashboard)' }
            Write-Host "  VERCEL URL:  $prod  (now using this tunnel)" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Vercel deploy failed:" -ForegroundColor Red
            $out | Select-Object -Last 15 | ForEach-Object { Write-Host "  $_" }
        }
    }
} finally {
    Pop-Location
}
