import { createNotification } from "../db.js";

type NotificationType = "info" | "alerte" | "nouveauté" | "important";

interface TriggerOptions {
  title: string;
  message: string;
  type?: NotificationType;
  linkUrl?: string;
  authorId?: number;
}

/**
 * Système de déclenchement automatique de notifications.
 * Appeler ces fonctions depuis les mutations existantes pour
 * générer des notifications pertinentes.
 */

export async function triggerArticlePublished(opts: {
  articleId: number;
  title: string;
  authorId: number;
  category?: string;
}) {
  return createNotification({
    title: `Nouvel article : ${opts.title}`,
    message: `Un nouvel article a été publié${opts.category ? ` dans la catégorie « ${opts.category} »` : ""}.`,
    type: "nouveauté",
    linkUrl: `/article/${opts.articleId}`,
    authorId: opts.authorId,
  });
}

export async function triggerUserRegistered(opts: {
  userName: string;
  userId: number;
}) {
  return createNotification({
    title: "Nouvel utilisateur inscrit",
    message: `${opts.userName} vient de s'inscrire sur la plateforme.`,
    type: "info",
    authorId: 1,
  });
}

export async function triggerSubscriberAdded(opts: {
  email: string;
}) {
  return createNotification({
    title: "Nouvel abonné newsletter",
    message: `${opts.email} s'est abonné(e) à la newsletter.`,
    type: "info",
    authorId: 1,
  });
}

export async function triggerProviderCooldown(opts: {
  provider: string;
  error: string;
}) {
  return createNotification({
    title: `Alerte provider IA : ${opts.provider}`,
    message: `Le provider « ${opts.provider} » est en cooldown après des échecs consécutifs. Erreur : ${opts.error}`,
    type: "alerte",
    authorId: 1,
  });
}

export async function triggerQuotaExceeded(opts: {
  userName: string;
  tokensUsed: number;
}) {
  return createNotification({
    title: "Quota IA dépassé",
    message: `${opts.userName} a dépassé le quota de tokens IA (${opts.tokensUsed} tokens utilisés).`,
    type: "important",
    authorId: 1,
  });
}

export async function triggerMediaUploaded(opts: {
  fileName: string;
  uploaderName: string;
  count?: number;
}) {
  const qty = opts.count && opts.count > 1 ? `${opts.count} fichiers` : opts.fileName;
  return createNotification({
    title: "Nouveau média uploadé",
    message: `${opts.uploaderName} a uploadé ${qty}.`,
    type: "nouveauté",
    authorId: 1,
  });
}
