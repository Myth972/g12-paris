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
| Animation | Framer Motion | v12 |
| i18n | i18next | v26 |
| Backend | Node.js + Express | — |
| API | tRPC | v11 |
| ORM | Drizzle ORM | 0.44 |
| Database | Turso (LibSQL) / SQLite local | — |
| Auth | JWT (jose) + sessions cookie | — |
| Email | Resend | v6 |
| Storage | AWS S3 + Vercel Blob | — |
| Tests (unit) | Vitest | v2 |
| Tests (e2e) | Playwright | v1.60 |
| Package Manager | pnpm | 10.x |
| TypeScript | TypeScript | 5.9 (strict) |

## Project Structure

```
.
├── client/                        # Frontend React 19
│   └── src/
│       ├── pages/                 # Pages (29 fichiers) — lazy-loaded
│       ├── components/            # Composants métier (31 fichiers)
│       ├── components/ui/         # Composants UI shadcn/ui (53 fichiers)
│       ├── hooks/                 # Hooks personnalisés (7 fichiers)
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
│   │   ├── sdk.ts                 # SDK auth
│   │   ├── systemRouter.ts        # Routes système (health)
│   │   ├── vite.ts                # Dev middleware Vite
│   │   └── types/                 # Types serveur
│   ├── routers.ts                 # Routes tRPC (~2180 lignes, 82+ procédures)
│   ├── db.ts                      # Fonctions d'accès DB
│   ├── storage.ts                 # Upload S3/Vercel Blob
│   └── themeRouter.ts             # Routes thème
├── shared/                        # Code partagé client/serveur
│   ├── types.ts                   # Réexport types Drizzle
│   ├── const.ts                   # Constantes partagées (UNAUTHED_ERR_MSG, etc.)
│   ├── aiProviders.ts             # Config providers IA
│   ├── n8n-integration.ts         # Intégration n8n
│   └── _core/errors.ts            # Types d'erreurs
├── drizzle/                       # Schéma database + migrations SQL
│   ├── schema.ts                  # Définition des tables (13 tables)
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
└── patches/                       # Patches pnpm (wouter)
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
- **Middleware auth** : `publicProcedure`, `protectedProcedure`, `adminProcedure`, `editeurProcedure`, `bibliothequeProcedure`
- **Rôles** : `admin`, `editeur`, `bibliotheque`, `user`
- **Contexte** : `TrpcContext` avec `req`, `res`, `user`
- **Validation** : Zod schemas inline dans les procédures tRPC
- **DB** : Drizzle ORM, requêtes dans `server/db.ts`
- **CSRF** : double-submit cookie pattern

### Database (Drizzle ORM)
- **Schema** : `drizzle/schema.ts` — définition des tables avec types inférés
- **Types** : `export type Table = typeof tableName.$inferSelect` et `InsertTable`
- **Migrations** : `pnpm run db:push` pour push le schéma
- **Tables** : 13 tables (users, articles, gallery_items, page_content, announcements, biblical_verses, categories, themes, subscribers, site_settings, notifications, notification_reads, user_theme)
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
pnpm run dev              # Développement (hot-reload, port 3001)
pnpm run build            # Build production (Vite + esbuild)
pnpm start                # Démarrage production (port 3000)
pnpm run check            # Vérification TypeScript (tsc --noEmit)
pnpm run format           # Formatage Prettier
pnpm run test             # Tests unitaires (Vitest)
pnpm run test:e2e         # Tests e2e (Playwright)
pnpm run db:push          # Push schéma Drizzle vers DB
```

## Testing

- **Unit tests** : Vitest, fichiers `*.test.ts` dans `server/`
- **E2E tests** : Playwright, fichiers dans `tests/e2e/`
- **Setup** : `vitest.setup.ts` (Vitest), `tests/setup/global.setup.ts` (Playwright)
- **Config Vitest** : environment `node`, include `server/**/*.test.ts`
- **Config Playwright** : projects (chromium, firefox, webkit, mobile), webServer auto-start

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
- **Vercel** : `vercel.json` config, API serverless dans `api/index.ts`
- **Docker** : `docker-compose.yml` pour n8n + PostgreSQL (workflow automation)
- **Backups** : `scripts/backup.ps1` via Windows Task Scheduler

## Important Notes

- **Port auto-detection** : le serveur cherche automatiquement un port disponible (défaut 3000/3001)
- **CSRF** : double-submit cookie pattern, token dans `csrf_token` cookie + header `x-csrf-token`
- **Rate limiting** : général (120/min prod) + spécifique IA (20/min prod)
- **Lazy loading** : toutes les pages sont lazy-loaded pour optimiser le bundle
- **Theme** : thème clair/sombre géré via `next-themes` + `ThemeContext`
- **i18n** : 3 langues supportées (français, anglais, espagnol)
- **Patches** : wouter@3.7.1 est patché via `patches/wouter@3.7.1.patch`
