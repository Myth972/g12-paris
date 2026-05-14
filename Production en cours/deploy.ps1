# Script de deploiement automatique vers GitHub et la Base de Donnees

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Demarrage du deploiement G12 Paris..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Mise a jour de la base de donnees (Turso)
Write-Host " 1. Mise a jour de la base de donnees (drizzle-kit)..." -ForegroundColor Yellow
npm run db:push

if ($LASTEXITCODE -ne 0) {
    Write-Host " Erreur lors de la mise a jour de la base de donnees. Deploiement annule." -ForegroundColor Red
    exit 1
}
Write-Host " Base de donnees a jour !`n" -ForegroundColor Green

# 2. Ajout des fichiers a Git
Write-Host " 2. Preparation des fichiers pour GitHub..." -ForegroundColor Yellow
git add .

# 3. Demander un message de commit a l'utilisateur
$commitMsg = Read-Host " Entrez un message pour cette mise a jour (Laissez vide pour le message par defaut)"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "maj: Deploiement automatique et mise a jour de la base de donnees"
}

# 4. Commit des changements
Write-Host "`n 3. Sauvegarde (Commit)..." -ForegroundColor Yellow
git commit -m $commitMsg

# 5. Envoi vers GitHub
Write-Host " 4. Envoi vers GitHub (Push)..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host " Erreur lors de l'envoi vers GitHub." -ForegroundColor Red
    exit 1
}

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host " Deploiement termine avec succes ! " -ForegroundColor Green
Write-Host "Vercel va automatiquement recuperer le code sur GitHub et le mettre en ligne." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
