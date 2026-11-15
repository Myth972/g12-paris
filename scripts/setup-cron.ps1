$taskName = "G12YouTubeAgent"
$batPath = "C:\Users\Myth972\Documents\g12-paris-infos-medias-main\scripts\youtube-agent.bat"

# First try to delete existing task
try {
    schtasks /delete /tn $taskName /f 2>$null
    Write-Host "Existing task deleted"
} catch {}

# Create using XML (most reliable)
$xml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>G12 YouTube Agent - Auto fetch cultes (tous les samedis a 20h00)</Description>
  </RegistrationInfo>
  <Triggers>
    <!-- Hebdomadaire, samedi 20h00. Remplace l'ancien TimeTrigger horaire (PT1H),
         qui ne correspond plus a la configuration utilisee. -->
    <CalendarTrigger>
      <StartBoundary>2026-11-21T20:00:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByWeek>
        <DaysOfWeek>
          <Saturday />
        </DaysOfWeek>
        <WeeksInterval>1</WeeksInterval>
      </ScheduleByWeek>
    </CalendarTrigger>
  </Triggers>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>true</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>true</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>true</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT1H</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>$batPath</Command>
    </Exec>
  </Actions>
</Task>
"@

$xmlPath = "$env:TEMP\g12-task.xml"
[System.IO.File]::WriteAllText($xmlPath, $xml, [System.Text.Encoding]::Unicode)

$result = schtasks /create /tn $taskName /xml $xmlPath 2>&1
Remove-Item $xmlPath -Force

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Task created!"
    Write-Host ""
    Write-Host "Task details:"
    schtasks /query /tn $taskName /fo list
} else {
    Write-Host "Error: $result"
}