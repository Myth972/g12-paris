param(
    [string]$BackupDir = "",
    [string]$TaskName = "G12Backup",
    [string]$Interval = "PT24H",
    [string]$StartTime = "03:00",
    [int]$RetentionDays = 30
)

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$BackupScript = Join-Path -Path $ProjectRoot -ChildPath "scripts\backup.ps1"

if (-not $BackupDir) {
    $BackupDir = Join-Path -Path $ProjectRoot -ChildPath "backups"
}

$StartBoundary = "$(Get-Date -Format 'yyyy-MM-dd')T$($StartTime):00"

$Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$BackupScript`" -BackupDir `"$BackupDir`" -RetentionDays $RetentionDays"

# Supprimer la tache existante si elle existe
try {
    schtasks /delete /tn $TaskName /f 2>$null
    Write-Host " [OK] Ancienne tache supprimee" -ForegroundColor Yellow
} catch {}

# Creer le XML de la tache
$xml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>G12 Paris Infos Medias - Sauvegarde automatique (DB, uploads, config)</Description>
  </RegistrationInfo>
  <Triggers>
    <TimeTrigger>
      <Repetition>
        <Interval>$Interval</Interval>
        <StopAtDurationEnd>false</StopAtDurationEnd>
      </Repetition>
      <StartBoundary>$StartBoundary</StartBoundary>
      <Enabled>true</Enabled>
    </TimeTrigger>
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
    <ExecutionTimeLimit>PT1H</ExecutionTimeLimit>
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

$xmlPath = "$env:TEMP\g12-backup-task.xml"
[System.IO.File]::WriteAllText($xmlPath, $xml, [System.Text.Encoding]::Unicode)

$result = schtasks /create /tn $TaskName /xml $xmlPath 2>&1
Remove-Item $xmlPath -Force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host " Tache planifiee creee avec succes !" -ForegroundColor Green
    Write-Host " Nom: $TaskName" -ForegroundColor Green
    Write-Host " Intervalle: $Interval" -ForegroundColor Green
    Write-Host " Debut: $StartBoundary" -ForegroundColor Green
    Write-Host " Retention: $RetentionDays jours" -ForegroundColor Green
    Write-Host " Destination: $BackupDir" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pour executer la sauvegarde manuellement:" -ForegroundColor Cyan
    Write-Host "  schtasks /run /tn $TaskName" -ForegroundColor White
    Write-Host ""
    Write-Host "Pour voir le statut:" -ForegroundColor Cyan
    Write-Host "  schtasks /query /tn $TaskName /fo list" -ForegroundColor White
} else {
    Write-Host " Erreur: $result" -ForegroundColor Red
    exit 1
}
