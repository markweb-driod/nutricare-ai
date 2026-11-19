# =======================================================================
# NutriCare AI - Install / remove the watchdog scheduled task
#
#   .\install-watchdog.ps1             # install or update
#   .\install-watchdog.ps1 -Uninstall  # remove
#
# Registers "NutriCare Watchdog" for the current user (no admin needed).
# It runs watchdog.ps1 every 5 minutes, 1 minute after the PC wakes from
# sleep, and at sign-in. It runs hidden and only while you are signed in.
# =======================================================================
param([switch]$Uninstall)

$taskName = 'NutriCare Watchdog'
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$script = Join-Path $rootDir 'watchdog.ps1'

if ($Uninstall) {
    if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "Removed scheduled task '$taskName'." -ForegroundColor Green
    } else {
        Write-Host "Scheduled task '$taskName' is not installed." -ForegroundColor DarkGray
    }
    exit 0
}

$user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$start = (Get-Date).AddMinutes(1).ToString('s')
$esc = [System.Security.SecurityElement]

# conhost --headless runs PowerShell without flashing a console window.
$command = 'conhost.exe'
$arguments = "--headless powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$script`""

$xml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Keeps the NutriCare AI site reachable: restarts the local stack and tunnel and re-points Vercel when the live API stops answering (for example after sleep).</Description>
  </RegistrationInfo>
  <Triggers>
    <TimeTrigger>
      <StartBoundary>$start</StartBoundary>
      <Repetition><Interval>PT5M</Interval><StopAtDurationEnd>false</StopAtDurationEnd></Repetition>
      <Enabled>true</Enabled>
    </TimeTrigger>
    <EventTrigger>
      <Enabled>true</Enabled>
      <Delay>PT1M</Delay>
      <Subscription>&lt;QueryList&gt;&lt;Query Id="0" Path="System"&gt;&lt;Select Path="System"&gt;*[System[Provider[@Name='Microsoft-Windows-Power-Troubleshooter'] and EventID=1]]&lt;/Select&gt;&lt;/Query&gt;&lt;/QueryList&gt;</Subscription>
    </EventTrigger>
    <LogonTrigger>
      <Enabled>true</Enabled>
      <UserId>$($esc::Escape($user))</UserId>
      <Delay>PT1M</Delay>
    </LogonTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>$($esc::Escape($user))</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings><StopOnIdleEnd>false</StopOnIdleEnd><RestartOnIdle>false</RestartOnIdle></IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT15M</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>$command</Command>
      <Arguments>$($esc::Escape($arguments))</Arguments>
      <WorkingDirectory>$($esc::Escape($rootDir))</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
"@

Register-ScheduledTask -TaskName $taskName -Xml $xml -Force | Out-Null
$t = Get-ScheduledTask -TaskName $taskName
Write-Host "Installed scheduled task '$taskName' ($($t.State))." -ForegroundColor Green
Write-Host "  Runs: every 5 min, 1 min after wake from sleep, and at sign-in" -ForegroundColor DarkGray
Write-Host "  Log:  $env:TEMP\nutricare-watchdog.log" -ForegroundColor DarkGray
Write-Host "  Remove with: .\install-watchdog.ps1 -Uninstall" -ForegroundColor DarkGray
