# AGENTS.md — G12 Paris Infos Médias

## Project Overview

Plateforme web pour publier des actualités, articles, médias et gérer du contenu d'église, avec support IA multi-provider. Application fullstack React 19 + Express + tRPC + Drizzle ORM + Turso/SQLite.

## Stack Technique

| Couche | Technologie | Version |
|---|---|---|
| Frontend | React | 19 |
| Bundler | Vite | 7 |
| CSS | Tailwind CSS | v4 |
| UI Components | Radix UI + shadcn/ui | — |
| Routing | Wouter | 3.x |
| State / Data Fetching | TanStack Query + tRPC | v5 / v11 |
| Forms | React Hook Form + Zod | v7 / v4 |
| Rich Text Editor | TipTap | v3 |
| Animation | Framer Motion | v14 |
| i18n | i18next | v26 |
| Backend | Node.js + Express | — |
| API | tRPC | v11 |
| ORM | Drizzle ORM | 0.45 |
| Database | Turso (LibSQL) / SQLite local | — |
| Auth | JWT (jose) + sessions cookie | — |
| Email | Resend | v6 |
| Storage | AWS S3 + Vercel Blob | — |
| Tests (unit) | Vitest | v4 |
| Tests (e2e) | Playwright | v1.64 |
| Package Manager | pnpm | 10.x |
| TypeScript | TypeScript | 5.9 (strict) |

## Project Structure

```
.
├── client/                        # Frontend React 19
│   └── src/
│       ├── pages/                 # Pages (38 fichiers) — lazy-loaded
│       ├── components/            # Composants métier (55 fichiers)
│       ├── components/ui/         # Composants UI shadcn/ui (53 fichiers)
│       ├── hooks/                 # Hooks personnalisés (9 fichiers)
│       ├── contexts/              # React Contexts (ThemeContext)
│       ├── lib/                   # Utilitaires (trpc client, utils, mojs)
│       ├── locales/               # Fichiers i18n (fr, en, es)
│       ├── _core/hooks/           # Hooks internes
│       ├── App.tsx                # Routeur principal + layouts
│       ├── main.tsx               # Entry point React + tRPC provider
│       ├── const.ts               # Constantes client
│       ├── i18n.ts                # Config i18next
│       └── index.css              # Styles globaux + Tailwind
├── server/                        # Backend Node.js
│   ├── _core/                     # Coeur serveur
│   │   ├── index.ts               # Entry point Express (port, CORS, rate-limit, CSRF)
│   │   ├── trpc.ts                # tRPC init + middlewares auth (roles)
│   │   ├── context.ts             # Contexte tRPC (req, res, user)
│   │   ├── env.ts                 # Variables d'environnement
│   │   ├── llm.ts                 # Client IA multi-provider
│   │   ├── aiQuota.ts             # Quota IA par utilisateur
│   │   ├── newsletter.ts          # Envoi newsletter via Resend
│   │   ├── cache.ts               # Cache serveur
│   │   ├── cookies.ts             # Options cookies
│   │   ├── csrf.ts                # Middleware CSRF partagé (double-submit)
│   │   ├── sdk.ts                 # SDK auth
│   │   ├── systemRouter.ts        # Routes système (health)
│   │   ├── vite.ts                # Dev middleware Vite
│   │   └── types/                 # Types serveur
│   ├── routers.ts                 # Routes tRPC (~4038 lignes, 151 procédures)
│   ├── db.ts                      # Fonctions d'accès DB
│   ├── storage.ts                 # Upload S3/Vercel Blob
│   └── themeRouter.ts             # Routes thème
├── shared/                        # Code partagé client/serveur
│   ├── types.ts                   # Réexport types Drizzle
│   ├── const.ts                   # Constantes partagées (UNAUTHED_ERR_MSG, etc.)
│   ├── aiProviders.ts             # Config providers IA
│   └── _core/errors.ts            # Types d'erreurs
├── drizzle/                       # Schéma database + migrations SQL
│   ├── schema.ts                  # Définition des tables (19 tables)
│   └── relations.ts               # Relations Drizzle
├── drizzle-migrations/            # Migrations SQL
├── api/                           # API Vercel (serverless)
│   └── index.ts
├── tests/                         # Tests
│   ├── components/                # Tests composants (Vitest)
│   ├── e2e/                       # Tests e2e (Playwright)
│   └── setup/                     # Setup tests
├── scripts/                       # Scripts utilitaires (backup, cron, youtube)
├── uploads/                       # Fichiers uploadés localement
├── backups/                       # Archives de sauvegarde
├── patches/                       # Patches pnpm (wouter)
```

## Coding Conventions

### TypeScript
- **Strict mode** activé (`"strict": true` dans tsconfig)
- **ESM** : `"type": "module"` dans package.json, imports avec `.js` extension côté serveur
- **Pas de `any`** — utiliser des types explicites
- **Path aliases** :
  - `@/` → `client/src/`
  - `@shared/` → `shared/`
  - `@assets` → `attached_assets/`

### Code Style (Prettier)
- Point-virgule : **oui** (`semi: true`)
- Guillemets : **double quotes** (`singleQuote: false`)
- Trailing comma : **es5**
- Indentation : **2 espaces** (`tabWidth: 2`)
- Line ending : **LF** (`endOfLine: lf`)
- Arrow parens : **avoid** (`arrowParens: "avoid"`)
- Bracket spacing : **oui** (`bracketSpacing: true`)
- Print width : **80**

### Frontend (React)
- **Lazy loading** : toutes les pages sont `React.lazy()` dans `App.tsx`
- **Composants** : fonctions fléchées, export default
- **Hooks** : custom hooks dans `client/src/hooks/`, prefixe `use`
- **UI** : composants shadcn/ui dans `components/ui/`, basés sur Radix UI primitives
- **Styling** : Tailwind CSS v4, `clsx` + `tailwind-merge` via `cn()` utilitaire
- **Routing** : Wouter (`<Route>`, `<Switch>`) — PAS React Router
- **State** : TanStack Query pour les données serveur, React Context pour le thème
- **Forms** : React Hook Form + Zod pour la validation
- **i18n** : `useTranslation()` hook, clés dans `locales/`

### Backend (Express + tRPC)
- **Routes** : définies dans `server/routers.ts` via `router()` tRPC
- **Middleware auth** : `publicProcedure`, `protectedProcedure`, `adminProcedure`, `editeurProcedure`, `bibliothequeProcedure`, `adminOnlyProcedure` (admin seul)
- **Rôles** : `admin`, `editeur`, `bibliotheque`, `user`
- **Contexte** : `TrpcContext` avec `req`, `res`, `user`
- **Validation** : Zod schemas inline dans les procédures tRPC
- **DB** : Drizzle ORM, requêtes dans `server/db.ts`
- **CSRF** : double-submit cookie pattern

### Database (Drizzle ORM)
- **Schema** : `drizzle/schema.ts` — définition des tables avec types inférés
- **Types** : `export type Table = typeof tableName.$inferSelect` et `InsertTable`
- **Migrations** : `pnpm run db:push` pour push le schéma
- **Tables** : 19 tables (users, articles, gallery_items, page_content, announcements, biblical_verses, categories, themes, subscribers, site_settings, notifications, notification_reads, user_theme, api_keys, api_providers, suggestions, convention_registrations, convention_code_attempts, agent_runs)
- **Indexes** : définis via `index()` dans le schéma Drizzle

### Naming Conventions
- **Fichiers** : PascalCase pour les composants React (`ArticleCard.tsx`), camelCase pour les utilitaires (`trpc.ts`)
- **Composants** : PascalCase (`ArticleCard`, `SiteHeader`)
- **Hooks** : camelCase avec prefixe `use` (`useAiProvider`, `useBlobUpload`)
- **Fonctions** : camelCase (`createArticle`, `listPublishedArticles`)
- **Tables DB** : snake_case (`page_content`, `gallery_items`, `biblical_verses`)
- **Colonnes DB** : camelCase dans le schéma (`coverImageUrl`, `displayOrder`), snake_case en DB (`cover_image_url`)
- **Routes tRPC** : dot notation (`articles.list`, `gallery.create`, `ai.chat`)

## Build & Dev Commands

```bash
pnpm install              # Installer les dépendances
pnpm run dev              # Développement (node --watch, port 3000)
pnpm run build            # Build production (Vite + esbuild)
pnpm start                # Démarrage production (port 3000)
pnpm run check            # Vérification TypeScript (tsc --noEmit)
pnpm run format           # Formatage Prettier
pnpm run test             # Tests unitaires (Vitest)
pnpm run test:e2e         # Tests e2e (Playwright)
pnpm run db:push          # Push schéma Drizzle vers DB
```

### Serveur de développement

`pnpm run dev` =
`cross-env NODE_ENV=development node --watch --import tsx server/_core/index.ts`.

- **Ne pas revenir à `tsx watch`** : il montait un processus enfant muet qui
  restait bloqué plus d'une minute avant de mourir sur
  `The service is no longer running: write EPIPE` (esbuild/Vite). Avec
  `node --watch`, la première page est servie en moins de 10 s.
- **`PORT` est normalisé** au démarrage : toute valeur hors de `1–65535` (par
  exemple `PORT=0`, qui faisait écouter sur un port aléatoire) est ramenée à
  `3000`. Le port réellement utilisé est lu via `server.address()`, jamais
  supposé.
- **Rechargement** : trois boucles distinctes, détaillées ci-dessous.

#### Rechargement à chaud

Comportements vérifiés sur ce projet :

| Ce qui est modifié | Mécanisme | Effet observé | Preuve de non-rechargement |
|---|---|---|---|
| Un fichier serveur (`server/**`) | `node --watch` | **redémarrage complet** : PID neuf, module rechargé (marqueur visible en ~4 s) | le PID de `netstat -ano \| grep :3000` change |
| Un composant client (`.tsx`, `.ts`) | Fast Refresh Vite | DOM mis à jour, état local préservé, **pas de rechargement** | une valeur posée sur `window` survit |
| `client/src/index.css` (CSS pur ou `@apply` Tailwind) | HMR Vite | `<style>` remplacés en place, **pas de rechargement** | `[vite] hot updated: /src/index.css` en console, `document.styleSheets.length` stable |

Pièges :

- Poser une valeur sur `window` avant de modifier le fichier : si elle survit,
  il n'y a pas eu de rechargement (sinon le contexte JS est recréé).
- Après un redémarrage serveur, `[vite] server connection lost. Polling for
  restart...` puis des `TRPCClientError: Failed to fetch` sont **normaux** :
  Vite se reconnecte seul. Ce n'est pas une erreur de HMR.
- Le PID changeant à chaque redémarrage, `register_preview` doit être rafraîchi
  après toute modification serveur.
- Modifier `vite.config.ts` ou une dépendance ne relève pas du HMR : Vite
  redémarre son serveur.

## Testing

- **Unit tests** : Vitest, fichiers `*.test.ts` dans `server/`
- **E2E tests** : Playwright, fichiers dans `tests/e2e/`
- **Setup** : `vitest.setup.ts` (Vitest), `tests/setup/global.setup.ts` (Playwright)
- **DB de test** : base SQLite locale isolée par worker dans `%TEMP%` (schéma poussé via `pushSQLiteSchema` dans `vitest.setup.ts`), nettoyage automatique via `tests/setup/db.teardown.ts` (globalSetup Vitest)
- **Config Vitest** : environment `node`, include `server/**/*.test.ts`
- **Config Playwright** : projects (chromium, firefox, webkit, mobile), webServer auto-start
- **Attention** : ne pas utiliser `drizzle-migrations/` pour créer la DB de test (schéma obsolète) ; utiliser le schéma de `drizzle/schema.ts`

## Key Patterns

### tRPC Procedure Pattern
```ts
// Dans routers.ts
export const appRouter = router({
  articles: router({
    list: publicProcedure.query(async ({ ctx }) => { ... }),
    create: editeurProcedure
      .input(z.object({ title: z.string(), content: z.string() }))
      .mutation(async ({ ctx, input }) => { ... }),
  }),
});
```

### Drizzle Schema Pattern
```ts
// Dans drizzle/schema.ts
export const tableName = sqliteTable("table_name", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`).notNull(),
}, (table) => [
  index("idx_table_column").on(table.column),
]);
export type TableName = typeof tableName.$inferSelect;
export type InsertTableName = typeof tableName.$inferInsert;
```

### Component Pattern
```tsx
// Composant fonctionnel avec lazy loading
import { lazy } from "react";
const MyPage = lazy(() => import("./pages/MyPage"));

// Dans App.tsx
<Route path="/my-page">
  <PublicLayout>
    <MyPage />
  </PublicLayout>
</Route>
```

## Environment Variables

Variables critiques (voir `.en.example`) :
- `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` — Database
- `JWT_SECRET` — Auth JWT
- `ADMIN_PASSWORD` — Mot de passe admin
- `GROQ_API_KEY`, `GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `AIMLAPI_KEY` — Providers IA
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` — Upload S3
- `RESEND_API_KEY` — Newsletter
- `VITE_API_URL` — URL API client

## Deployment

- **Local** : `pnpm run dev` (Vite dev server) ou `pnpm start` (build production)
- **Vercel** : `vercel.json` config, API serverless dans `api/index.ts`. C'est **ce fichier** que Vercel exécute en production, pas `server/_core/index.ts` — voir la section « CSRF : une implémentation partagée ».
- **Backups** : `scripts/backup.ps1` via Windows Task Scheduler

## Important Notes

- **Port auto-detection** : le serveur cherche automatiquement un port disponible (défaut 3000/3001)
- **CSRF** : double-submit cookie pattern, jeton dans le cookie `csrf_token` + l'en-tête `x-csrf-token`. **Une seule implémentation**, `server/_core/csrf.ts`, branchée par les deux entrypoints via `registerCsrf(app)` — voir la section dédiée ci-dessous.
- **Rate limiting** : général (120/min prod) + spécifique IA (20/min prod)
- **Lazy loading** : toutes les pages sont lazy-loaded pour optimiser le bundle
- **Theme** : thème clair/sombre géré via `next-themes` + `ThemeContext`
- **i18n** : 3 langues supportées (français, anglais, espagnol)
- **Patches** : wouter@3.7.1 est patché via `patches/wouter@3.7.1.patch`

## CSRF : une implémentation partagée

Le middleware CSRF n'existe qu'en **un seul exemplaire**, dans
`server/_core/csrf.ts`. Les deux entrypoints s'y branchent :

| Fichier | Rôle |
|---|---|
| `server/_core/csrf.ts` | **Implémentation unique** : constantes, lecture du cookie, émission, vérification, endpoint `GET /api/csrf` |
| `server/_core/index.ts` | Serveur Express local (`pnpm run dev`, `pnpm start`) — appelle `registerCsrf(app)` |
| `api/index.ts` | Fonction serverless **exécutée par Vercel en production** — appelle `registerCsrf(app)` |

Un correctif appliqué dans `server/_core/csrf.ts` vaut donc **immédiatement**
pour les deux environnements. C'était le point faible de la version
précédente : le middleware était dupliqué, et un correctif appliqué d'un seul
côté fonctionnait en local puis restait sans effet en production. C'est arrivé
avec le retrait du cookie sur `/api/image` : la prod continuait à répondre
`Set-Cookie` avec `X-Vercel-Cache: MISS`, donc chaque visite re-téléchargeait
l'image d'origine depuis Blob.

Règles :

- Évolutions de `ensureCsrfCookie`, `csrfProtect`, `CACHEABLE_PUBLIC_PATHS`
  ou de l'endpoint `/api/csrf` : **dans `server/_core/csrf.ts` uniquement**.
- Ce qui reste propre à chaque entrypoint, et doit donc être vérifié des deux
  côtés : montage des fichiers statiques, rate-limiting, routes métier
  (`/api/cron`, sitemap, robots). Seul le CSRF est mutualisé.
- Les routes publiques cachables (`/api/image`, `/api/sitemap.xml`,
  `/sitemap.xml`, `/api/robots.txt`, `/robots.txt`, `/uploads/`, `/widget/`)
  ne posent pas le cookie en `GET` : un CDN refuse de mettre en cache une
  réponse contenant `Set-Cookie`. Les autres réponses et `GET /api/csrf`
  continuent de l'émettre, le double-submit reste donc intact.

## Consignes utilisateur (workflow)

- **Consultation préalable obligatoire** : avant toute tâche, lire les fichiers `SYNCHRONIZATION_GUIDE.md` et `TODO_PENDING.md` situés dans `C:\Users\Myth972\Documents\` (hors dépôt git).
- **Fichiers jamais commités** : `SYNCHRONIZATION_GUIDE.md` et `TODO_PENDING.md` ne doivent JAMAIS être sur GitHub (info locale sensible).
- **Rôle** : assistant expert front-end (React, Next.js, Vite, Tailwind, HTML/CSS/JS). Répondre en français clair, code propre et commenté, explications étape par étape, suggestions d'amélioration, analyse des erreurs avec technique de test Pairwise.
- **Médias** : le projet gère les médias (images JPG/PNG/WebP/AVIF/SVG/GIF, audio MP3/WAV/OGG, vidéo MP4/WebM) + optimisation automatique + mo.js/Framer Motion/GSAP. Confirmer au début d'une session que les médias peuvent être gérés.
- **Mémorisation** : garder un historique des actions effectuées (pour ne pas les répéter) et mémoriser les fichiers importants à modifier.
- **« À plus tard »** : sauvegarder les tâches effectuées et restantes dans `C:\Users\Myth972\Documents\TODO_PENDING.md` pour reprendre plus tard.
- **Commit + push** : uniquement après validation explicite de l'utilisateur. Après chaque modification validée → push vers GitHub → déploiement automatique Vercel. Commande sécurisée : `git add --all -- . ":!SYNCHRONIZATION_GUIDE.md" ":!TODO_PENDING.md"`.
- **Méthode** : appliquer la méthode kanban (Backlog / À faire / En cours / À valider / Terminé) pour suivre l'avancement.
