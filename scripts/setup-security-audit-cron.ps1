param(
    [string]$TaskName = "G12SecurityAudit",
    [string]$DayOfWeek = "Monday",
    [string]$StartTime = "09:00"
)

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$AuditScript = Join-Path -Path $ProjectRoot -ChildPath "scripts\security-audit.ps1"

$Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$AuditScript`""

# Supprimer la tache existante si elle existe
try {
    schtasks /delete /tn $TaskName /f 2>$null
    Write-Host " [OK] Ancienne tache supprimee" -ForegroundColor Yellow
} catch {}

$xml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>G12 Paris Infos Medias - Audit securite pnpm hebdomadaire (rapport dans backups/security-audits/)</Description>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>$(Get-Date -Format 'yyyy-MM-dd')T$($StartTime):00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByWeek>
        <DaysOfWeek>
          <$DayOfWeek />
        </DaysOfWeek>
        <WeeksInterval>1</WeeksInterval>
      </ScheduleByWeek>
    </CalendarTrigger>
  </Triggers>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT30M</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>powershell.exe</Command>
      <Arguments>$Arguments</Arguments>
    </Exec>
  </Actions>
</Task>
"@

$xmlPath = "$env:TEMP\g12-security-audit-task.xml"
[System.IO.File]::WriteAllText($xmlPath, $xml, [System.Text.Encoding]::Unicode)

$result = schtasks /create /tn $TaskName /xml $xmlPath 2>&1
Remove-Item $xmlPath -Force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host " Tache planifiee creee avec succes !" -ForegroundColor Green
    Write-Host " Nom: $TaskName" -ForegroundColor Green
    Write-Host " Planning: chaque $DayOfWeek a $StartTime" -ForegroundColor Green
    Write-Host " Script: $AuditScript" -ForegroundColor Green
    Write-Host " Rapports: backups\security-audits\audit-AAAA-MM-JJ.md" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pour lancer l'audit manuellement:" -ForegroundColor Cyan
    Write-Host "  schtasks /run /tn $TaskName" -ForegroundColor White
    Write-Host ""
    Write-Host "Pour voir le statut:" -ForegroundColor Cyan
    Write-Host "  schtasks /query /tn $TaskName /fo list" -ForegroundColor White
} else {
    Write-Host " Erreur: $result" -ForegroundColor Red
    exit 1
}
