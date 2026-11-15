# NutriCare AI - Stop Services PowerShell Script

Write-Host "NutriCare AI - Stopping all services..." -ForegroundColor Yellow

function Stop-PortListener($port) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        foreach ($conn in $conns) {
            Write-Host "Stopping process $($conn.OwningProcess) listening on port $port..." -ForegroundColor Gray
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}

Stop-PortListener 8000
Stop-PortListener 8080
Stop-PortListener 3000

Write-Host "[DONE] All NutriCare AI services on ports 8000, 8080, and 3000 stopped." -ForegroundColor Green
