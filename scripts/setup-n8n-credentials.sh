#!/bin/bash

# Configuration des credentials n8n pour G12 Paris Infos Médias
# Ce script configure l'authentification sécurisée entre n8n et votre API tRPC

set -e

# Variables
N8N_URL="${N8N_URL:-http://localhost:5678}"
JWT_SECRET="${JWT_SECRET:-g12-paris-secret-jwt-key-2024}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-adminMarty972$}"
API_URL="http://localhost:3000/api"

echo "🔐 Configuration des credentials n8n pour G12..."
echo "n8n URL: $N8N_URL"
echo ""

# Fonction pour attendre que n8n soit prêt
wait_for_n8n() {
    local max_attempts=30
    local attempt=0
    
    echo "⏳ Attente du démarrage de n8n..."
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$N8N_URL/healthz" > /dev/null 2>&1; then
            echo "✅ n8n est prêt"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    echo "❌ n8n n'a pas démarré après ${max_attempts}s"
    exit 1
}

# Attendre que n8n soit prêt
wait_for_n8n

echo ""
echo "📝 Création du credential 'G12 API - tRPC'..."
echo ""

# Créer le credential via l'API n8n
# Note: Les credentials peuvent être créés via l'interface web aussi
# Nous utilisons curl pour automatiser le processus

CREDENTIAL_RESPONSE=$(curl -s -X POST "$N8N_URL/api/v1/credentials" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "G12 API - tRPC",
    "type": "httpCustomAuth",
    "data": {
      "authType": "custom_header",
      "headerKey": "Authorization",
      "headerValue": "Bearer '$JWT_SECRET'"
    }
  }')

echo "Réponse: $CREDENTIAL_RESPONSE"
echo ""

# Alternative: Créer un credential d'authentification HTTP Basic
echo "📝 Création du credential pour uploads S3..."
echo ""

S3_CREDENTIAL=$(curl -s -X POST "$N8N_URL/api/v1/credentials" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "G12 AWS S3",
    "type": "aws",
    "data": {
      "accessKeyId": "'${AWS_ACCESS_KEY_ID:-}'",
      "secretAccessKey": "'${AWS_SECRET_ACCESS_KEY:-}'",
      "region": "'${AWS_REGION:-eu-west-1}'"
    }
  }')

echo "Réponse S3: $S3_CREDENTIAL"
echo ""

echo "✅ Configuration des credentials terminée !"
echo ""
echo "📋 Instructions manuelles pour l'interface n8n :"
echo "1. Allez à http://localhost:5678"
echo "2. Cliquez sur l'icône de profil > Paramètres"
echo "3. Sélectionnez 'Credentials'"
echo "4. Cliquez sur '+ Nouveau'"
echo "5. Sélectionnez 'Custom Auth / HTTP Headers'"
echo "6. Entrez :"
echo "   - Nom: G12 API - tRPC"
echo "   - En-tête: Authorization"
echo "   - Valeur: Bearer $JWT_SECRET"
echo "7. Sauvegardez"
echo ""
echo "🔑 Vos clés d'environnement :"
echo "   JWT_SECRET: $JWT_SECRET"
echo "   Admin Password: $ADMIN_PASSWORD"
echo "   API URL: $API_URL"
echo ""
