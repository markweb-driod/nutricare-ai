# =======================================================================
# NutriCare AI - Watchdog
# Checks that the live site's API answers and, if not, restarts the local
# stack + tunnel (tunnel.ps1 -Detach), which also re-points Vercel.
#
# Run by the "NutriCare Watchdog" scheduled task (install-watchdog.ps1)
# every 5 minutes and when the PC wakes from sleep. Safe to run by hand.
#
#   .\watchdog.ps1            # check, repair if needed
#   .\watchdog.ps1 -Force     # repair even if healthy / within cooldown
# =======================================================================
param(
    [string]$SiteUrl = 'https://nutricare-ai-psi.vercel.app',
    [int]$CooldownMinutes = 10,
    [switch]$Force
)

$ErrorActionPreference = 'Continue'
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$logFile = Join-Path $env:TEMP 'nutricare-watchdog.log'
$stampFile = Join-Path $env:TEMP 'nutricare-watchdog.last-repair'

function Log($msg) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $msg"
    Add-Content -Path $logFile -Value $line
    Write-Host $line
}

function Get-Status($url, $timeout = 20) {
    try { (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec $timeout).StatusCode } catch {
        if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    }
}

# Keep the log small
if ((Test-Path $logFile) -and (Get-Item $logFile).Length -gt 200KB) {
    Get-Content $logFile -Tail 500 | Set-Content $logFile
}

# Right after waking, networking can take a moment to come back.
$online = $false
for ($i = 0; $i -lt 6 -and -not $online; $i++) {
    $online = (Get-Status 'https://www.cloudflare.com/cdn-cgi/trace' 10) -eq 200
    if (-not $online) { Start-Sleep -Seconds 10 }
}
if (-not $online) {
    Log 'Offline (no internet) - skipping check.'
    exit 0
}

# Healthy = the live site's API reaches this PC (Vercel -> tunnel -> Next.js -> PHP).
$code = Get-Status "$SiteUrl/api/v1/health"
if ($code -eq 200 -and -not $Force) {
    # Stay quiet on healthy runs; just note one line per hour.
    $last = if (Test-Path $logFile) { Get-Content $logFile -Tail 1 } else { '' }
    if ($last -notmatch "$(Get-Date -Format 'yyyy-MM-dd HH'):\d\d:\d\d  Healthy") { Log 'Healthy.' }
    exit 0
}

# Avoid restart loops (a restart + Vercel redeploy takes a few minutes).
if (-not $Force -and (Test-Path $stampFile)) {
    $lastRepair = Get-Date (Get-Content $stampFile -Raw).Trim()
    $minutes = ((Get-Date) - $lastRepair).TotalMinutes
    if ($minutes -lt $CooldownMinutes) {
        Log "Unhealthy (HTTP $code) but last repair was $([int]$minutes) min ago - waiting for it to settle."
        exit 0
    }
}

Log "Unhealthy (HTTP $code) - restarting stack and tunnel, re-syncing Vercel..."
Set-Content -Path $stampFile -Value (Get-Date -Format 'o')

# Stop the dead tunnel and the app servers so start.ps1 brings up a clean stack.
& "$rootDir\stop.ps1" *> $null
& "$rootDir\tunnel.ps1" -Detach *>&1 | ForEach-Object { Log "  $_" }

Start-Sleep -Seconds 20
$after = Get-Status "$SiteUrl/api/v1/health"
Log "After repair: live API HTTP $after$(if ($after -ne 200) { ' (Vercel may still be deploying; next run re-checks)' })"
