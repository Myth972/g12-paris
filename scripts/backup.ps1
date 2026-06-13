param(
    [string]$BackupDir = "",
    [int]$RetentionDays = 30
)

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

if (-not $BackupDir) {
    $BackupDir = Join-Path -Path $ProjectRoot -ChildPath "backups"
}

$BackupPath = Join-Path -Path $BackupDir -ChildPath "backup-$Timestamp"
New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Sauvegarde G12 Paris Infos Medias" -ForegroundColor Cyan
Write-Host " Destination: $BackupPath" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Base de donnees SQLite
$DbFile = Join-Path -Path $ProjectRoot -ChildPath "sqlite.db"
if (Test-Path $DbFile) {
    Copy-Item -Path $DbFile -Destination (Join-Path -Path $BackupPath -ChildPath "sqlite.db")
    Write-Host " [OK] Base de donnees sauvegardee" -ForegroundColor Green
} else {
    Write-Host " [SKIP] Aucune base locale (sqlite.db)" -ForegroundColor Yellow
}

# 2. Config (.env)
$EnvFile = Join-Path -Path $ProjectRoot -ChildPath ".env"
if (Test-Path $EnvFile) {
    Copy-Item -Path $EnvFile -Destination (Join-Path -Path $BackupPath -ChildPath ".env")
    Write-Host " [OK] Configuration (.env) sauvegardee" -ForegroundColor Green
} else {
    Write-Host " [SKIP] Aucun fichier .env" -ForegroundColor Yellow
}

# 3. Fichiers uploads
$UploadsDir = Join-Path -Path $ProjectRoot -ChildPath "uploads"
if (Test-Path $UploadsDir) {
    $UploadsDest = Join-Path -Path $BackupPath -ChildPath "uploads"
    New-Item -ItemType Directory -Path $UploadsDest -Force | Out-Null
    Copy-Item -Path "$UploadsDir\*" -Destination $UploadsDest -Recurse -Force
    Write-Host " [OK] Uploads sauvegardes" -ForegroundColor Green
} else {
    Write-Host " [SKIP] Aucun dossier uploads" -ForegroundColor Yellow
}

# 4. Drizzle migrations (schema)
$DrizzleDir = Join-Path -Path $ProjectRoot -ChildPath "drizzle"
$DrizzleDest = Join-Path -Path $BackupPath -ChildPath "drizzle"
if (Test-Path $DrizzleDir) {
    Copy-Item -Path $DrizzleDir -Destination $DrizzleDest -Recurse -Force
    Write-Host " [OK] Schema Drizzle sauvegarde" -ForegroundColor Green
}

# 5. Nettoyage des backups anciens
if ($RetentionDays -gt 0 -and (Test-Path $BackupDir)) {
    $Cutoff = (Get-Date).AddDays(-$RetentionDays)
    Get-ChildItem -Path $BackupDir -Directory -Filter "backup-*" | Where-Object {
        $_.CreationTime -lt $Cutoff
    } | ForEach-Object {
        Remove-Item -Path $_.FullName -Recurse -Force
        Write-Host " [NETTOYAGE] Ancien backup supprime: $($_.Name)" -ForegroundColor DarkYellow
    }
}

# 6. Compression
$CompressedPath = "$BackupPath.zip"
Compress-Archive -Path "$BackupPath\*" -DestinationPath $CompressedPath -Force
Remove-Item -Path $BackupPath -Recurse -Force

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host " Sauvegarde terminee !" -ForegroundColor Green
Write-Host " Fichier: $CompressedPath" -ForegroundColor Green
Write-Host " Taille: $([math]::Round((Get-Item $CompressedPath).Length / 1MB, 2)) Mo" -ForegroundColor Green
Write-Host " Retention: $RetentionDays jours" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
