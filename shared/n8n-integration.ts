/**
 * Integration n8n dans G12 Paris Infos Médias
 * 
 * Ce fichier montre comment:
 * 1. Déclencher des workflows n8n via webhooks
 * 2. Utiliser l'API n8n pour contrôler les workflows
 * 3. Intégrer les workflows dans les endpoints tRPC
 */

// ==================== CONFIGURATION ====================

const N8N_WEBHOOK_BASE = 'http://localhost:5678/webhook';
const N8N_API_BASE = 'http://localhost:5678/api/v1';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

// ==================== UTILITAIRES ====================

/**
 * Déclencher un webhook n8n
 */
export async function triggerN8nWebhook(
  webhookPath: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${N8N_WEBHOOK_BASE}/${webhookPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Webhook failed: ${response.statusText}`
      };
    }

    return {
      success: true,
      message: 'Webhook triggered successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Webhook error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Appeler l'API n8n pour récupérer les workflows
 */
export async function getN8nWorkflows() {
  if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY is not set');
  }

  const response = await fetch(`${N8N_API_BASE}/workflows`, {
    method: 'GET',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workflows: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Déclencher un workflow n8n via l'API
 */
export async function executeN8nWorkflow(
  workflowId: string,
  data?: Record<string, unknown>
) {
  if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY is not set');
  }

  const response = await fetch(
    `${N8N_API_BASE}/workflows/${workflowId}/execute`,
    {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: { params: data || {} }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to execute workflow: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Obtenir l'historique d'exécution d'un workflow
 */
export async function getN8nExecutions(workflowId: string) {
  if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY is not set');
  }

  const response = await fetch(
    `${N8N_API_BASE}/workflows/${workflowId}/executions`,
    {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch executions: ${response.statusText}`);
  }

  return response.json();
}

// ==================== WEBHOOKS SPÉCIFIQUES ====================

/**
 * Déclencher un workflow de newsletter
 */
export async function triggerNewsletterWorkflow(
  subscriberEmails?: string[]
): Promise<{ success: boolean; message: string }> {
  return triggerN8nWebhook('newsletter-digest', {
    type: 'manual',
    subscribers: subscriberEmails || [],
    timestamp: new Date().toISOString()
  });
}

/**
 * Déclencher un workflow de publication d'article
 */
export async function triggerArticlePublishWorkflow(articleData: {
  id: number;
  title: string;
  slug: string;
  content: string;
  categoryId: number;
}): Promise<{ success: boolean; message: string }> {
  return triggerN8nWebhook('article-published', {
    ...articleData,
    action: 'publish',
    timestamp: new Date().toISOString()
  });
}

/**
 * Déclencher un workflow de génération de description IA
 */
export async function triggerAiDescriptionWorkflow(articleData: {
  id: number;
  title: string;
  content: string;
}): Promise<{ success: boolean; message: string }> {
  return triggerN8nWebhook('generate-description', {
    ...articleData,
    action: 'generate',
    timestamp: new Date().toISOString()
  });
}

/**
 * Déclencher un workflow de création de notification
 */
export async function triggerNotificationWorkflow(notification: {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  userId?: number;
}): Promise<{ success: boolean; message: string }> {
  return triggerN8nWebhook('create-notification', {
    ...notification,
    timestamp: new Date().toISOString()
  });
}

/**
 * Déclencher un workflow de synchronisation S3
 */
export async function triggerS3SyncWorkflow(bucketPath: string): Promise<{ success: boolean; message: string }> {
  return triggerN8nWebhook('sync-s3', {
    bucketPath,
    action: 'sync',
    timestamp: new Date().toISOString()
  });
}

// ==================== INTÉGRATION TRPC ====================

/**
 * Exemple d'intégration dans un endpoint tRPC
 * 
 * Ajouter dans server/routers.ts:
 * 
 * export const appRouter = t.router({
 *   article: t.router({
 *     publishWithWorkflow: protectedProcedure
 *       .input(z.object({
 *         articleId: z.number(),
 *         title: z.string()
 *       }))
 *       .mutation(async ({ input }) => {
 *         // Publier l'article
 *         const article = await db.articles.update({...});
 *         
 *         // Déclencher le workflow n8n
 *         const result = await triggerArticlePublishWorkflow({
 *           id: article.id,
 *           title: article.title,
 *           slug: article.slug,
 *           content: article.content,
 *           categoryId: article.categoryId
 *         });
 *         
 *         return { article, workflowTriggered: result.success };
 *       })
 *   }),
 *   
 *   newsletter: t.router({
 *     sendAutomatic: adminProcedure.mutation(async () => {
 *       const result = await triggerNewsletterWorkflow();
 *       return { success: result.success, message: result.message };
 *     })
 *   }),
 *   
 *   n8n: t.router({
 *     getWorkflows: adminProcedure.query(async () => {
 *       return await getN8nWorkflows();
 *     }),
 *     
 *     getExecutions: adminProcedure
 *       .input(z.object({ workflowId: z.string() }))
 *       .query(async ({ input }) => {
 *         return await getN8nExecutions(input.workflowId);
 *       })
 *   })
 * });
 */

// ==================== EXEMPLE D'UTILISATION ====================

/**
 * Fonction de test
 */
export async function testN8nIntegration() {
  console.log('🧪 Test d\'intégration n8n...\n');

  try {
    // 1. Tester un webhook
    console.log('1. Déclenchement du webhook notification...');
    const webhookResult = await triggerNotificationWorkflow({
      title: 'Test n8n',
      message: 'L\'intégration n8n fonctionne!',
      type: 'success'
    });
    console.log('   ✅ Résultat:', webhookResult);

    // 2. Récupérer les workflows
    console.log('\n2. Récupération des workflows...');
    if (N8N_API_KEY) {
      const workflows = await getN8nWorkflows();
      console.log('   ✅ Workflows trouvés:', workflows.data?.length || 0);
    } else {
      console.log('   ⚠️  N8N_API_KEY non configurée (webhook fonctionne quand même)');
    }

    console.log('\n✅ Tests réussis!');
  } catch (error) {
    console.error('❌ Erreur:', error instanceof Error ? error.message : String(error));
  }
}

// ==================== EXPORTS ====================

export {
  N8N_WEBHOOK_BASE,
  N8N_API_BASE,
  N8N_API_KEY
};
