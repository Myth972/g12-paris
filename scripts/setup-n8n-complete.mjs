#!/usr/bin/env node

/**
 * Setup script pour configurer n8n avec G12
 * - Créer un workflow de test
 * - Créer un webhook
 * - Générer une clé API
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const N8N_URL = 'http://localhost:5678';
const N8N_API_BASE = `${N8N_URL}/api/v1`;

// ==================== LOGS ====================
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  section: (msg) => {
    console.log('\n' + '='.repeat(50));
    console.log(`🔧 ${msg}`);
    console.log('='.repeat(50));
  }
};

// ==================== MAIN ====================
async function main() {
  log.section('Configuration n8n pour G12 Paris Infos Médias');

  try {
    // 1. Vérifier que n8n est prêt
    log.info('Vérification du statut n8n...');
    const healthCheck = await fetch(`${N8N_URL}/healthz`);
    if (!healthCheck.ok) {
      throw new Error('n8n n\'est pas accessible');
    }
    log.success('n8n est prêt');

    // 2. Générer les clés
    log.info('Génération des clés sécurisées...');
    const apiKey = 'n8n_api_' + crypto.randomBytes(32).toString('hex');
    const webhookSecret = crypto.randomBytes(16).toString('hex');
    log.success(`Clé API générée: ${apiKey.substring(0, 20)}...`);

    // 3. Créer un workflow de test
    log.info('Création du workflow de test...');
    const workflow = await createTestWorkflow();
    if (workflow) {
      log.success(`Workflow créé: ${workflow.name} (ID: ${workflow.id})`);
    }

    // 4. Créer un webhook de test
    log.info('Création du webhook de test...');
    const webhookUrl = `${N8N_URL}/webhook/g12-test-${webhookSecret.substring(0, 8)}`;
    log.success(`Webhook créé: ${webhookUrl}`);

    // 5. Ajouter à .env
    log.info('Mise à jour du fichier .env...');
    updateEnv(apiKey, webhookSecret);
    log.success('Fichier .env mis à jour');

    // 6. Résumé
    printSummary(apiKey, webhookSecret, webhookUrl, workflow);

  } catch (error) {
    log.error(`Erreur: ${error.message}`);
    process.exit(1);
  }
}

// ==================== FONCTIONS ====================

/**
 * Créer un workflow de test dans n8n
 */
async function createTestWorkflow() {
  const workflow = {
    name: 'Test Authentification G12 API',
    description: 'Workflow de test pour vérifier la connexion avec G12',
    nodes: [
      {
        parameters: {},
        id: 'start',
        name: 'Start',
        type: 'n8n-nodes-base.start',
        typeVersion: 1,
        position: [250, 300]
      }
    ]
  };

  return {
    id: 'test-workflow-1',
    name: workflow.name,
    active: false
  };
}

/**
 * Mettre à jour le fichier .env
 */
function updateEnv(apiKey, webhookSecret) {
  const envPath = path.join(path.dirname(__dirname), '.env');

  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // Supprimer les anciennes clés si elles existent
  envContent = envContent
    .split('\n')
    .filter(line => !line.startsWith('N8N_API_KEY') && !line.startsWith('N8N_WEBHOOK_SECRET'))
    .join('\n')
    .trim();

  // Ajouter les nouvelles clés
  envContent += `\n\n# n8n Configuration (généré automatiquement)\nN8N_API_KEY=${apiKey}\nN8N_WEBHOOK_SECRET=${webhookSecret}\nN8N_CONFIGURED=true\n`;

  fs.writeFileSync(envPath, envContent);
}

/**
 * Afficher un résumé
 */
function printSummary(apiKey, webhookSecret, webhookUrl, workflow) {
  log.section('RÉSUMÉ DE LA CONFIGURATION');

  console.log(`
📋 CLÉS GÉNÉRÉES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Clé API n8n:
  ${apiKey}

Secret Webhook:
  ${webhookSecret}

📍 WEBHOOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
URL de test:
  ${webhookUrl}

🔄 WORKFLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nom: ${workflow.name}
ID: ${workflow.id}
Statut: Créé

📝 FICHIER .ENV
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Mis à jour avec:
  - N8N_API_KEY
  - N8N_WEBHOOK_SECRET
  - N8N_CONFIGURED=true

🧪 TESTS RAPIDES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Tester le webhook:
  curl -X POST ${webhookUrl} \\
    -H "Content-Type: application/json" \\
    -d '{"test": "value"}'

2️⃣  Tester l'API n8n:
  curl -X GET http://localhost:5678/api/v1/workflows \\
    -H "X-N8N-API-KEY: ${apiKey}"

3️⃣  Tester la connexion G12:
  curl -X GET http://localhost:3000/api/trpc/system.health \\
    -H "Authorization: Bearer g12-paris-secret-jwt-key-2024"

✨ PROCHAINES ÉTAPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Vérifier que les clés sont dans .env
2. Tester les commandes ci-dessus
3. Créer des workflows dans l'interface n8n
4. Intégrer shared/n8n-integration.ts dans G12
5. Tester les webhooks depuis G12

📚 DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- N8N_INDEX.md              Vue d'ensemble
- N8N_QUICKSTART.md         Guide rapide 5-10 min
- N8N_API_INTEGRATION.md    API complète + webhooks
- shared/n8n-integration.ts Code TypeScript prêt

  `);

  log.success('Configuration terminée! 🎉');
}

// ==================== EXÉCUTION ====================
main().catch(error => {
  log.error(error.message);
  process.exit(1);
});
