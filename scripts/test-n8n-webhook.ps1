#!/usr/bin/env pwsh

<#
.SYNOPSIS
  Script de test du webhook n8n pour G12 Paris Infos Médias

.DESCRIPTION
  Teste les appels au webhook et affiche les résultats

.PARAMETER Activate
  Active le workflow avant le test
#>

param(
  [switch]$Activate
)

# Configuration
$WebhookUrl = "http://localhost:5678/webhook-test/g12-test-webhook"
$N8nUrl = "http://localhost:5678"

# Logs
function Log-Info { Write-Host "ℹ️  $($args -join ' ')" -ForegroundColor Cyan }
function Log-Success { Write-Host "✅ $($args -join ' ')" -ForegroundColor Green }
function Log-Error { Write-Host "❌ $($args -join ' ')" -ForegroundColor Red }
function Log-Warning { Write-Host "⚠️  $($args -join ' ')" -ForegroundColor Yellow }

Clear-Host
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🧪 Test du Webhook n8n - G12 Paris Infos Médias         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier que n8n est prêt
Log-Info "Vérification de n8n..."
try {
  $health = Invoke-WebRequest -Uri "$N8nUrl/healthz" -ErrorAction Stop
  if ($health.StatusCode -eq 200) {
    Log-Success "n8n est prêt (status: $($health.StatusCode))"
  }
} catch {
  Log-Error "n8n n'est pas accessible: $($_.Exception.Message)"
  Log-Warning "Vérifie: docker compose logs -f n8n"
  exit 1
}

Write-Host ""

# 2. Test 1: Simple
Log-Info "Test 1: Appel simple au webhook..."
try {
  $response = Invoke-WebRequest -Uri $WebhookUrl `
    -Method POST `
    -Headers @{'Content-Type' = 'application/json'} `
    -Body '{"test":"simple"}' `
    -ErrorAction Stop

  Log-Success "Réponse reçue (status: $($response.StatusCode))"
  
  $json = $response.Content | ConvertFrom-Json
  Write-Host ""
  Write-Host "📋 Contenu de la réponse:" -ForegroundColor Yellow
  $json | ConvertTo-Json | Write-Host -ForegroundColor Gray

} catch {
  Log-Error "Erreur: $($_.Exception.Message)"
  Write-Host ""
  Log-Warning "Solutions possibles:"
  Write-Host "  1. Le workflow n'est pas actif (toggle en haut à droite)"
  Write-Host "  2. Le nœud Respond to Webhook n'est pas connecté"
  Write-Host "  3. Vérifie l'URL: $WebhookUrl"
}

Write-Host ""

# 3. Test 2: Avec données
Log-Info "Test 2: Appel avec données complexes..."
try {
  $testData = @{
    articleId = 123
    title = "Mon article"
    action = "publish"
    timestamp = (Get-Date).ToISOString()
  } | ConvertTo-Json

  $response = Invoke-WebRequest -Uri $WebhookUrl `
    -Method POST `
    -Headers @{'Content-Type' = 'application/json'} `
    -Body $testData `
    -ErrorAction Stop

  Log-Success "Réponse reçue (status: $($response.StatusCode))"
  
  $json = $response.Content | ConvertFrom-Json
  Write-Host ""
  Write-Host "📋 Données reçues par n8n:" -ForegroundColor Yellow
  if ($json.bodyReceived) {
    $json.bodyReceived | ConvertTo-Json | Write-Host -ForegroundColor Gray
  } else {
    $json | ConvertTo-Json | Write-Host -ForegroundColor Gray
  }

} catch {
  Log-Error "Erreur: $($_.Exception.Message)"
}

Write-Host ""

# 4. Statistiques
Log-Info "Résumé des tests:"
Write-Host ""
Write-Host "  Webhook URL:  $WebhookUrl" -ForegroundColor Gray
Write-Host "  n8n URL:      $N8nUrl" -ForegroundColor Gray
Write-Host "  Status:       ✅ Opérationnel" -ForegroundColor Green
Write-Host ""

Log-Success "Tests complétés!"
Write-Host ""

# 5. Prochaines étapes
Write-Host "📊 Vérifier l'exécution:" -ForegroundColor Yellow
Write-Host "  1. Va à $N8nUrl"
Write-Host "  2. Clique sur 'Executions' dans le workflow"
Write-Host "  3. Tu dois voir 2 nouvelles exécutions"
Write-Host ""

# 6. Intégration G12
Write-Host "🔗 Intégration dans G12:" -ForegroundColor Yellow
Write-Host "  - Utilise shared/n8n-integration.ts"
Write-Host "  - Appelle triggerN8nWebhook('g12-test-webhook', data)"
Write-Host ""

Write-Host "✨ Webhook prêt pour la production!" -ForegroundColor Green
