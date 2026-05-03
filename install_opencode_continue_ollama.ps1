# ================================
# INSTALLATION OpenCode + Continue.dev
# AVEC MENU INTERACTIF + CONFIG MULTI-MODÈLES
# Ollama déjà installé
# ================================

Write-Host "=== Installation OpenCode + Continue.dev ===" -ForegroundColor Cyan

# -------------------------------
# FONCTION : MENU
# -------------------------------
function Show-Menu {
    Write-Host ""
    Write-Host "Sélectionne les modèles à installer :" -ForegroundColor Cyan
    Write-Host "1. DeepSeek R1 7B"
    Write-Host "2. DeepSeek Coder V2 16B"
    Write-Host "3. Llama 3.1 8B"
    Write-Host "4. Phi-4 14B"
    Write-Host "5. Tout installer"
    Write-Host "0. Aucun modèle"
    Write-Host ""
    return Read-Host "Ton choix"
}

# -------------------------------
# 1. Installer VSCodium (OpenCode)
# -------------------------------
$codiumInstaller = "$env:TEMP\VSCodiumSetup.exe"
$codiumUrl = "https://github.com/VSCodium/vscodium/releases/latest/download/VSCodiumSetup-x64.exe"

Write-Host "Téléchargement de VSCodium via curl..." -ForegroundColor Yellow
curl.exe -L $codiumUrl -o $codiumInstaller

if (-not (Test-Path $codiumInstaller)) {
    Write-Host "ERREUR : téléchargement VSCodium impossible." -ForegroundColor Red
    exit
}

Write-Host "Installation de VSCodium..." -ForegroundColor Yellow
Start-Process -FilePath $codiumInstaller -ArgumentList "/VERYSILENT" -Wait

Write-Host "VSCodium installé." -ForegroundColor Green

# -------------------------------
# 2. Vérifier Ollama
# -------------------------------
if (-not (Get-Command "ollama" -ErrorAction SilentlyContinue)) {
    Write-Host "ERREUR : Ollama n'est pas installé sur ce système." -ForegroundColor Red
    Write-Host "Installe-le depuis https://ollama.com/download puis relance ce script."
    exit
}

Write-Host "Ollama détecté." -ForegroundColor Green

# -------------------------------
# 3. Installer l’extension Continue.dev
# -------------------------------
Write-Host "Installation de l’extension Continue.dev..." -ForegroundColor Yellow

$codiumPath = "$env:LOCALAPPDATA\Programs\VSCodium\bin\codium.cmd"

& $codiumPath --install-extension Continue.continue

Write-Host "Continue.dev installé." -ForegroundColor Green

# -------------------------------
# 4. MENU : CHOIX DES MODÈLES
# -------------------------------
$choice = Show-Menu

$models = @()

switch ($choice) {
    "1" { $models += "deepseek-r1:7b" }
    "2" { $models += "deepseek-coder-v2:16b" }
    "3" { $models += "llama3.1:8b" }
    "4" { $models += "phi4:14b" }
    "5" { 
        $models += "deepseek-r1:7b"
        $models += "deepseek-coder-v2:16b"
        $models += "llama3.1:8b"
        $models += "phi4:14b"
    }
    "0" { Write-Host "Aucun modèle sélectionné." -ForegroundColor Yellow }
    default { Write-Host "Choix invalide." -ForegroundColor Red }
}

# -------------------------------
# 5. Télécharger les modèles sélectionnés
# -------------------------------
foreach ($m in $models) {
    Write-Host "Téléchargement du modèle : $m" -ForegroundColor Yellow
    ollama pull $m
}

Write-Host "Modèles installés." -ForegroundColor Green

# -------------------------------
# 6. Configuration Continue.dev
# -------------------------------
Write-Host "Configuration de Continue.dev..." -ForegroundColor Yellow

$continueDir = "$env:USERPROFILE\.continue"
$configFile = "$continueDir\config.json"

if (-not (Test-Path $continueDir)) {
    New-Item -ItemType Directory -Path $continueDir | Out-Null
}

# Génération dynamique de la liste des modèles
$modelEntries = @()
foreach ($m in $models) {
    $modelEntries += @{
        title = $m
        provider = "ollama"
        model = $m
    }
}

$config = @{
    models = $modelEntries
} | ConvertTo-Json -Depth 5

$config | Out-File -FilePath $configFile -Encoding utf8

Write-Host "Configuration terminée." -ForegroundColor Green

# -------------------------------
# FIN
# -------------------------------
Write-Host "Installation complète ! Ouvre VSCodium et profite de Continue + Ollama." -ForegroundColor Cyan
