# =======================================================================
# NutriCare AI - Public Tunnel
# Exposes the web app (port 3000) on a public HTTPS URL. The PHP API is
# proxied through Next.js (/api/v1), so one tunnel serves the whole app.
#
#   .\tunnel.ps1                 # Cloudflare quick tunnel (no account needed)
#   .\tunnel.ps1 -Provider ngrok # ngrok (needs `ngrok config add-authtoken`)
# =======================================================================
param(
    [ValidateSet('cloudflared', 'ngrok')]
    [string]$Provider = 'cloudflared',
    [int]$Port = 3000
)

$ErrorActionPreference = 'Continue'
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Test-Url($url) {
    try { (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch { $false }
}

# 1. Make sure the stack is running
if (-not (Test-Url "http://localhost:$Port")) {
    Write-Host "Web app not running on :$Port - starting services via start.ps1..." -ForegroundColor Yellow
    & "$rootDir\start.ps1"
}
if (-not (Test-Url "http://localhost:$Port")) {
    Write-Host "[ERROR] Web app still not reachable on http://localhost:$Port" -ForegroundColor Red
    exit 1
}

# 2. Start the tunnel
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

Set-Content -Path (Join-Path $rootDir '.tunnel-url') -Value $publicUrl
Set-Content -Path (Join-Path $rootDir '.tunnel-pid') -Value $proc.Id

Write-Host ""
Write-Host "=======================================================================" -ForegroundColor DarkGreen
Write-Host "  PUBLIC URL:  $publicUrl" -ForegroundColor Green
Write-Host "  API (proxied): $publicUrl/api/v1/health" -ForegroundColor Yellow
Write-Host "  Provider: $Provider (PID $($proc.Id))   Log: $logFile" -ForegroundColor DarkGray
Write-Host "  Stop the tunnel: .\tunnel.ps1 is running it in background;" -ForegroundColor DarkGray
Write-Host "                   run  Stop-Process -Id $($proc.Id)  or .\stop.ps1" -ForegroundColor DarkGray
Write-Host "=======================================================================" -ForegroundColor DarkGreen
