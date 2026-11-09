# G12 Paris Infos Médias

Plateforme web pour publier des actualités, articles, médias et gérer du contenu d'église, avec support IA multi-provider.

**Dernière mise à jour**: 2026-11-09  
**Version**: 1.0.0  
**Status**: ✅ Opérationnel

---

## ✨ Fonctionnalités

- **Articles** — Création, édition, publication avec slugs SEO, catégories, versets bibliques
- **Galerie média** — Images et vidéos (Publication du Jour), page d'accueil
- **Pages dynamiques** — Contenu personnalisable par page (hero, bannières, médias)
- **Annonces & Flash Events** — Bannières, annonces, événements sur la page d'accueil
- **IA générative** — Chat, descriptions, versets, traduction, génération d'images/vidéos
- **Newsletter** — Abonnements, envoi de newsletters via Resend
- **Bibliothèque média** — Upload S3/local, catégories, thèmes
- **Notifications** — Système de notifications avec suivi de lecture
- **Authentification** — JWT (jose), sessions, rôles (admin/editeur/bibliotheque/user)
- **Internationalisation** — i18next (français, anglais, espagnol)
- **Thème clair/sombre** — `ThemeContext` (localStorage) + préférence persistée en base (`user_theme`)

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 20.19+ ou 22.12+ (exigence de Vite 7)
- pnpm (ou npm)
- Variables d'environnement configurées (voir `.en.example`)

### Installation

```bash
pnpm install
pnpm run check
pnpm run dev
```

### Windows (script)

Double-cliquez `launch-server.bat` et choisissez :

1. Mode Développement (hot-reload, debug)
2. Mode Production (build + serveur)
3. Vérifier versions Node/npm
4. Installer dépendances

### Scripts disponibles

| Commande | Description |
|---|---|
| `pnpm run dev` | Démarrage en développement (`node --watch`, port 3000) |
| `pnpm run build` | Build production (Vite + esbuild) |
| `pnpm start` | Démarrage production |
| `pnpm run check` | Vérification TypeScript |
| `pnpm run format` | Formatage Prettier |
| `pnpm run test` | Tests Vitest |
| `pnpm run db:push` | Push schéma Drizzle vers DB |
| `pnpm run deploy` | Déploiement (PowerShell) |
| `pnpm run youtube-agent` | Agent YouTube |

### Accès

- Frontend (dev) : http://localhost:3000/
- API tRPC (dev) : http://localhost:3000/api/trpc
- Frontend (prod) : http://localhost:3000/ (ou `PORT`)
- API tRPC (prod) : http://localhost:3000/api/trpc

Le port par défaut est 3000 en dev comme en prod ; s'il est occupé, le serveur
bascule automatiquement sur le suivant (3001).

---

## 🔐 Authentification

Système JWT avec sessions stockées en cookie (`app_session_id`).

### Connexion

```bash
curl -X POST http://localhost:3000/api/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{"password":"votre-mot-de-passe"}'
```

Via la page `/login` dans le navigateur.

### Rôles

- `admin` — Accès complet
- `editeur` — Gestion des articles, pages, annonces
- `bibliotheque` — Gestion de la bibliothèque média
- `user` — Accès restreint (lecture)

---

## 🤖 IA

6 providers exposés dans le sélecteur (`shared/aiProviders.ts`) :

| Provider | Modèle par défaut | Clé API |
|---|---|---|
| Groq | GPT-OSS 120B | `GROQ_API_KEY` |
| Google Gemini | Gemini 3.5 Flash | `GOOGLE_API_KEY` |
| MiniMax | MiniMax-M2.1 | `MINIMAX_API_KEY` |
| Ollama (local) | llama3.2 | `OLLAMA_BASE_URL`, `OLLAMA_MODEL` |
| Kling AI | Kling v1 | `KLING_API_KEY` |
| Replicate | Kling v2.6 | `REPLICATE_API_TOKEN` |

Provider préféré configurable via `PREFERRED_AI_PROVIDER` (défaut : `groq`).

Le fallback automatique de `server/_core/llm.ts` ne s'applique qu'aux providers
à clé API (Groq → Google → MiniMax → AIML) ; Kling, Replicate et Ollama sont
appelés explicitement. `AIMLAPI_KEY` reste utilisé par le fallback bien
qu'AIML n'apparaisse plus dans le sélecteur.

### Endpoints IA

- `ai.status` — État des providers
- `ai.chat` — Chat avec l'IA
- `ai.generateDescription` — Générer description d'article
- `ai.generateVerse` — Générer verset biblique
- `ai.suggestVerseForArticle` — Suggérer un verset pour un article
- `ai.translate` — Traduction de texte
- `ai.search` — Recherche intelligente
- `ai.generateImage` — Génération d'image
- `ai.generateVideo` — Génération de vidéo (Kling)
- `ai.stats` — Statistiques d'utilisation
- `ai.quota` — Quota restant
- `ai.testProvider` — Test d'un provider

---

## 📚 API (tRPC)

`server/routers.ts` expose 17 routeurs ; liste des principales procédures.

### Articles

- `articles.list` (public)
- `articles.bySlug` / `articles.byId` (public)
- `articles.adminList` (admin)
- `articles.create` / `articles.update` / `articles.delete` (editeur)
- `articles.uploadImage` (editeur)

### Galerie

- `gallery.featured` / `gallery.list` (public)
- `gallery.listAdmin` / `gallery.create` / `gallery.update` / `gallery.delete` (admin)
- `gallery.uploadImage` (editeur)

### Pages

- `pageContent.byPage` / `pageContent.featuredHome` (public)
- `pageContent.adminList` / `pageContent.create` / `pageContent.update` / `pageContent.delete` (editeur/admin)

### Annonces

- `announcements.list` (public)
- `announcements.adminList` / `announcements.create` / `announcements.update` / `announcements.delete` (editeur/admin)

### Newsletter

- `newsletter.subscribe` (public)
- `newsletter.listSubscribers` / `newsletter.deleteSubscriber` / `newsletter.sendDigest` (admin)

### Auth

- `auth.me` / `auth.login` / `auth.logout` (public)

### Notifications

- `notifications.myNotifications` / `notifications.unreadCount` / `notifications.markAsRead` / `notifications.markAllAsRead` (protégé)
- `notifications.adminList` / `notifications.create` / `notifications.delete` (admin)

### Versets

- `verses.latest` / `verses.byId` (public)
- `verses.adminList` / `verses.create` / `verses.update` / `verses.delete` (admin)

### Bibliothèque

- `bibliotheque.listMedias` / `bibliotheque.deleteMedia` (admin)
- `bibliotheque.listCategories` / `bibliotheque.createCategory` / `bibliotheque.deleteCategory` (admin)
- `bibliotheque.listThemes` / `bibliotheque.createTheme` / `bibliotheque.deleteTheme` (admin)
- `bibliotheque.sendNewsletter` (admin)

### Site Settings

- `siteSettings.get` / `siteSettings.getAll` (public)
- `siteSettings.set` / `siteSettings.uploadLogo` / `siteSettings.uploadHomeHeroBackground` / `siteSettings.uploadCulteHeroBackground` / `siteSettings.uploadCulteBanner` (admin)

### Utilisateurs

- `users.list` / `users.get` / `users.create` / `users.updateRole` / `users.delete` (admin)
- `users.updatePassword` (protégé)

### Uploads & Media

- `uploads.generateUploadToken` / `uploads.localUpload` (admin)
- `media.signedUrl` / `media.bulkSignedUrls` (admin)

### Système

- `system.health` (public)

### Thème

- `theme.*` — préférence de thème par utilisateur (`user_theme`)

### Suggestions

- `suggestions.*` — suggestions des visiteurs, modération côté admin

### Inscriptions Convention

- `conventionRegistrations.*` — inscription et vérification du code d'accès
  (rate limit dédié : 3 requêtes/heure sur `create`)

### Agents IA

- `agents.*` — déclenchement et suivi des exécutions d'agents (`agent_runs`)

### Clés & providers IA

- `ai.apiKeys.*` / `ai.apiProviders.*` — gestion des clés et providers (admin)

---

## 🗄️ Base de Données

- **Provider**: Turso (LibSQL) ou SQLite local
- **ORM**: Drizzle ORM
- **Migration**: `pnpm run db:push`

### Tables

| Table | Description |
|---|---|
| `users` | Utilisateurs et authentification |
| `articles` | Articles avec slug, catégorie, verset, prix, lien affilié |
| `categories` | Catégories d'articles |
| `themes` | Thèmes liés aux catégories |
| `gallery_items` | Médias (images/vidéos) pour la galerie |
| `page_content` | Contenu personnalisable des pages |
| `announcements` | Annonces et flash events (home page) |
| `notifications` | Notifications système |
| `notification_reads` | Suivi des notifications lues |
| `biblical_verses` | Versets bibliques avec résumés |
| `subscribers` | Abonnés newsletter |
| `site_settings` | Configuration dynamique du site |
| `user_theme` | Préférence thème clair/sombre |
| `api_keys` | Clés API tierces stockées côté serveur |
| `api_providers` | Providers IA enregistrés dynamiquement |
| `suggestions` | Suggestions envoyées par les visiteurs |
| `convention_registrations` | Inscriptions à la convention (code d'accès) |
| `convention_code_attempts` | Tentatives de code (anti-bruteforce) |
| `agent_runs` | Exécutions des agents IA |

---

## 📝 Variables d'Environnement

Copier `.en.example` en `.env` puis configurer :

```env
# Database
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

# JWT
JWT_SECRET=votre-secret-ici

# Authentification
VITE_APP_ID=...
ADMIN_PASSWORD=...

# AI Providers
PREFERRED_AI_PROVIDER=groq
GROQ_API_KEY=...
GOOGLE_API_KEY=...
MINIMAX_API_KEY=...
AIMLAPI_KEY=...

# AWS S3 (Upload d'images)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-1
AWS_S3_BUCKET=...

# Newsletter
RESEND_API_KEY=...

# API
VITE_API_URL=http://localhost:3000/api
```

---

## 🧪 Tests

```bash
pnpm run check    # TypeScript
pnpm run test     # Tests unitaires (Vitest)
pnpm run build    # Build de vérification
```

---

## 🐛 Troubleshooting

**Port déjà utilisé** : le serveur tente automatiquement le port suivant.

**Frontend ne charge pas** :
- Vérifier le port 3000 (celui affiché au démarrage)
- Vider le cache navigateur
- Hard refresh (Ctrl+F5)

**API erreurs** :
- Vérifier la session auth (`auth.me`)
- Vérifier les logs serveur
- Vérifier les clés API (`GROQ_API_KEY`, etc.)

**Build** :
- `client/index.html` doit exister pour le build

---

## 📁 Structure du Projet

```
.
├── client/                    # Frontend React 19 (Vite, Tailwind v4, Radix UI)
│   ├── src/
│   │   ├── pages/             # Pages (Login, Dashboard, Articles, etc.)
│   │   ├── components/        # Composants UI
│   │   ├── i18n.ts + locales/ # Internationalisation (fr/en/es)
│   │   └── hooks/             # Hooks personnalisés
├── server/                    # Backend Node.js (Express, tRPC)
│   ├── _core/                 # Coeur (env, llm, session, trpc, db)
│   └── routers.ts             # Routes tRPC (~150 procédures)
├── shared/                    # Code partagé (types, providers IA, etc.)
├── drizzle/                   # Schéma database (19 tables)
├── api/                       # API Vercel
├── scripts/                   # Scripts utilitaires
│   ├── backup.ps1             # Sauvegarde DB/uploads/config
│   ├── setup-backup-cron.ps1  # Planification backup automatique
│   ├── setup-cron.ps1         # Planification agent YouTube
│   └── youtube-culte-agent.mjs
├── patches/                   # Patches de dépendances
├── uploads/                   # Uploads locaux
├── backups/                   # Archives de sauvegarde (.zip)
├── launch-server.bat          # Script de démarrage Windows
├── start-server.bat           # Script de démarrage alternatif
└── README.md                  # Documentation
```

---

## 🛠️ Stack Technique

| Frontend | Backend | Base de données | IA |
|---|---|---|---|
| React 19 | Node.js | Turso LibSQL | Groq |
| Vite 7 | Express | Drizzle ORM | Gemini |
| Tailwind CSS v4 | tRPC v11 | SQLite (dev) | MiniMax |
| Radix UI | jose (JWT) | | AIML (fallback) |
| TanStack Query | Zod v4 | | Kling, Replicate, Ollama |
| Wouter | Resend | | |
| TipTap | Sharp | | |
| Framer Motion | Vercel Blob | | |
| i18next | AWS S3 | | |
| Recharts | | | |
| Sonner | | | |

---

## 📊 État du Projet

| Aspect | Status | Notes |
|---|---|---|
| TypeScript | ✅ | 0 erreurs |
| Frontend | ✅ | React 19, Vite, Tailwind v4 |
| Backend | ✅ | Express, tRPC, ~150 procédures |
| Database | ✅ | Turso + SQLite local |
| AI | ✅ | 6 providers, fallback sur les providers à clé API |
| Auth | ✅ | JWT, sessions, 4 rôles |
| Internationalisation | ✅ | fr/en/es |
| Newsletter | ✅ | Resend + subscribers |
| Upload fichiers | ✅ | S3 + local |
| Backups automatiques | ✅ | Quotidiens (30 jours de rétention) |

---

## 💾 Backups

Sauvegarde automatique de la base de données SQLite, du `.env` et des uploads via Windows Task Scheduler.

### Installation (une fois)

```powershell
.\scripts\setup-backup-cron.ps1
```

Par défaut : sauvegarde tous les jours à 03:00, rétention 30 jours.

### Personnalisation

```powershell
.\scripts\setup-backup-cron.ps1 -BackupDir "D:\backups" -Interval "PT12H" -RetentionDays 90
```

### Sauvegarde manuelle

```powershell
.\scripts\backup.ps1
```

Les backups sont compressés en `.zip` dans le dossier `backups/`.

### Ce qui est sauvegardé

- `sqlite.db` — base de données locale
- `.env` — configuration
- `uploads/` — fichiers uploadés
- `drizzle/` — schéma de base

---

## 🎯 Prochaines Étapes

- Ajouter des tests automatisés
- Mettre en place le monitoring
- Optimiser les performances

---

## 🤝 Contribution

1. Créer une branche `feature/votre-feature`
2. Faire les changements
3. Vérifier les types : `pnpm run check`
4. Formater le code : `pnpm run format`
5. Ouvrir une Pull Request

---

## 📄 Licence

Aucune licence explicite n'est fournie pour ce dépôt : il n'existe pas de
fichier `LICENSE`. Ajouter le fichier correspondant avant toute réutilisation.

---

## 📞 Support

- Consulter les logs serveur
- Regarder `.manus-logs/` pour le debug
