# AGENTS-System.md — Fonctionnement Système Complet

## Vue d'Ensemble

Application fullstack monolithique React 19 + Express, servie par un seul processus Node.js. Le frontend React est bundlé par Vite et servi en statique (prod) ou via Vite dev middleware (dev). Le backend expose une API tRPC montée sur Express.

---

## Architecture Système

```
┌─────────────────────────────────────────────────────────┐
│                      Navigateur                         │
│  React 19 + TanStack Query + tRPC Client + Wouter      │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (fetch + cookies)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Express Server (Node.js)               │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │  CSRF Check   │  │ Rate Limiter │  │ Cookie Parser │ │
│  │  (middleware)  │  │ (middleware) │  │ (middleware)  │ │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘ │
│         └─────────────────┼───────────────────┘         │
│                           ▼                             │
│              ┌────────────────────────┐                 │
│              │   tRPC Middleware       │                 │
│              │   createContext()       │                 │
│              │   └─ sdk.authenticate   │                 │
│              └───────────┬────────────┘                 │
│                          ▼                              │
│              ┌────────────────────────┐                 │
│              │    appRouter (tRPC)    │                 │
│              │  ┌──────────────────┐  │                 │
│              │  │ articles.*       │  │                 │
│              │  │ gallery.*        │  │                 │
│              │  │ ai.*             │  │                 │
│              │  │ auth.*           │  │                 │
│              │  │ notifications.*  │  │                 │
│              │  │ siteSettings.*   │  │                 │
│              │  │ users.*          │  │                 │
│              │  │ newsletter.*     │  │                 │
│              │  │ verses.*         │  │                 │
│              │  │ uploads.*        │  │                 │
│              │  │ bibliotheque.*   │  │                 │
│              │  │ media.*          │  │                 │
│              │  │ system.*         │  │                 │
│              │  └──────────────────┘  │                 │
│              └───────────┬────────────┘                 │
│                          ▼                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Drizzle  │  │ LLM API  │  │ Storage (S3/Blob)    │  │
│  │ ORM      │  │ (4 prov) │  │                      │  │
│  └────┬─────┘  └──────────┘  └──────────────────────┘  │
│       ▼                                                 │
│  ┌──────────────┐                                       │
│  │ Turso/SQLite │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

---

## Flux de Requête Complet

### 1. Requête HTTP entrante

```
Client → POST /api/trpc/articles.create
         Headers: x-csrf-token: abc123
         Cookie: app_session_id=eyJ...; csrf_token=abc123
         Body: {"0":{"json":{"title":"...","content":"..."}}}
```

### 2. Middleware Express (ordre d'exécution)

```typescript
// server/_core/index.ts

// 1. Body parser (JSON + URL-encoded, limit 50MB)
app.use(express.json({ limit: "50mb" }));

// 2. Fichiers statiques (/uploads)
app.use("/uploads", express.static("uploads"));

// 3. CSRF cookie — crée le cookie si absent
app.use((req, res, next) => {
  ensureCsrfCookie(req, res);  // cookie: csrf_token=<random hex 32>
  next();
});

// 4. Rate limiter (général: 120/min prod, 300/dev)
//    + Rate limiter IA (20/min prod, 60/dev)
app.use("/api/trpc", rateLimiter, csrfProtect, trpcMiddleware);
```

### 3. Protection CSRF (double-submit cookie)

```
Vérification :
1. Lire csrf_token du cookie → cookieToken
2. Lire x-csrf-token du header → headerToken
3. Si cookieToken !== headerToken → 403 Forbidden
4. Si méthode GET/HEAD → pas de vérification CSRF
```

### 4. Contexte tRPC

```typescript
// server/_core/context.ts
async function createContext(opts): Promise<TrpcContext> {
  let user: User | null = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;  // Auth optionnelle pour publicProcedure
  }
  return { req, res, user };
}
```

### 5. Authentification (sdk.ts)

```typescript
// server/_core/sdk.ts
async authenticateRequest(req) {
  // 1. Parser les cookies du header
  const cookies = parseCookies(req.headers.cookie);

  // 2. Extraire le JWT de la session
  const sessionCookie = cookies.get("app_session_id");

  // 3. Vérifier le JWT (jose, HS256)
  const { payload } = await jwtVerify(sessionCookie, secretKey);

  // 4. Chercher l'utilisateur en BDD par openId
  const user = await db.getUserByOpenId(payload.openId);

  // 5. Mettre à jour lastSignedIn
  await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

  return user;
}
```

### 6. Middleware de rôle (tRPC)

```typescript
// server/_core/trpc.ts

// publicProcedure    → pas de middleware, accès libre
// protectedProcedure → requireUser → vérifie ctx.user existe
// adminProcedure     → createRoleProcedure(["admin", "editeur", "bibliotheque"])
// editeurProcedure   → createRoleProcedure(["admin", "editeur"])
// bibliothequeProcedure → createRoleProcedure(["admin", "bibliotheque"])
```

### 7. Exécution de la procédure tRPC

```typescript
// server/routers.ts
articles: router({
  create: editeurProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
      category: z.string().optional(),
      // ...
    }))
    .mutation(async ({ ctx, input }) => {
      // ctx.user existe et a le bon rôle
      const article = await createArticle({
        ...input,
        authorId: ctx.user.id,
        slug: generateSlug(input.title),
      });

      // Notification auto si applicable
      await createNotification({ ... });

      return article;
    }),
}),
```

### 8. Accès Base de Données (Drizzle ORM)

```typescript
// server/db.ts
export function getDb() {
  if (!_db) {
    const client = createClient({ url: DATABASE_URL, authToken });
    _db = drizzle(client);  // Instance singleton
  }
  return _db;
}

// Exemple de requête
export async function listPublishedArticles(page, limit) {
  const db = getDb();
  assertDb(db);
  return db
    .select()
    .from(articles)
    .where(eq(articles.published, true))
    .orderBy(desc(articles.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
}
```

### 9. Réponse tRPC → Client

```
Serveur → Response
          Headers: Content-Type: application/json
          Body: {"result":{"data":{"json":{...}}}}

Client → TanStack Query cache la réponse
         → Composant React se re-render avec les nouvelles données
```

---

## Flux d'Authentification Complet

### Login

```
1. POST /api/trpc/auth.login { password: "xxx" }
2. Vérification: findUserByPassword(password)
3. Création JWT: SignJWT({ openId, name }, secret, HS256, 1 an)
4. Set-Cookie: app_session_id=<jwt>; HttpOnly; SameSite=Lax; Path=/
5. Retour: { user: { id, name, role, ... } }
```

### Vérification (chaque requête)

```
1. Cookie "app_session_id" présent ?
   → Non : user = null (publicProcedure autorisé)
   → Oui : jwtVerify(token, secret)
2. Payload contient openId + name ?
   → Non : user = null
   → Oui : getUserByOpenId(openId)
3. Utilisateur trouvé en BDD ?
   → Non : user = null
   → Oui : retourne User (id, name, role, openId, ...)
4. lastSignedIn mis à jour automatiquement
```

### Logout

```
1. POST /api/trpc/auth.logout
2. Suppression du cookie "app_session_id"
3. Retour: { success: true }
```

---

## Système de Base de Données

### Connexion

```
Turso (production)          SQLite local (développement)
libsql://xxx.turso.io       file:sqlite.db
@libsql/client              better-sqlite3
Drizzle ORM                 Drizzle ORM
```

### Schéma (drizzle/schema.ts)

```
13 tables :
├── users              → Authentification, rôles
├── articles           → Articles avec slug, catégorie, verset, prix
├── categories         → Catégories d'articles
├── themes             → Thèmes liés aux catégories
├── gallery_items      → Médias (images/vidéos) galerie
├── page_content       → Contenu personnalisable par page
├── announcements      → Annonces et flash events
├── biblical_verses    → Versets bibliques avec résumés
├── subscribers        → Abonnés newsletter
├── site_settings      → Configuration clé/valeur du site
├── notifications      → Notifications système
├── notification_reads → Suivi des notifications lues
└── user_theme         → Préférence thème clair/sombre par utilisateur
```

### Types inférés (pattern Drizzle)

```typescript
// drizzle/schema.ts
export const articles = sqliteTable("articles", { ... });
export type Article = typeof articles.$inferSelect;    // SELECT type
export type InsertArticle = typeof articles.$inferInsert; // INSERT type

// shared/types.ts — réexport centralisé
export type * from "../drizzle/schema";
```

### Migrations

```bash
# Modifier drizzle/schema.ts
# Puis pousser le schéma
pnpm run db:push    # drizzle-kit push
```

---

## Système IA Multi-Provider

### Providers supportés

```
┌──────────┬────────────────────────┬──────────────┐
│ Provider │ API URL                │ Modèle défaut│
├──────────┼────────────────────────┼──────────────┤
│ Groq     │ api.groq.com           │ llama-3.3-70b│
│ Google   │ forge.manus.im         │ gemini-2.0   │
│ MiniMax  │ api.minimaxi.chat      │ MiniMax-M1   │
│ AIML     │ api.aimlapi.com        │ Mistral-7B   │
└──────────┴────────────────────────┴──────────────┘
```

### Flux IA (server/_core/llm.ts)

```
1. Client appelle ai.chat ou ai.generateDescription
2. Vérification quota (50k tokens/heure par user)
3. Rate limiting IA (20 req/min prod)
4. invokeLLMWithFallback(params)
   → Essaie provider préféré (GROQ par défaut)
   → Si échec → essai suivant (Google → MiniMax → AIML)
   → Timeout 30s par tentative
5. Logging: tokens utilisés, durée, succès/erreur
6. Réponse → client (Streamdown pour rendu Markdown sûr)
```

---

## Frontend — React Architecture

### Entry Point

```
main.tsx
├── trpc.createClient (httpBatchLink + CSRF + superjson)
├── QueryClientProvider (TanStack Query)
├── trpc.Provider (tRPC React)
└── App
    ├── ErrorBoundary
    ├── ThemeProvider (next-themes)
    ├── TooltipProvider + Toaster (Sonner)
    └── Router (Wouter)
        ├── PublicLayout (SiteHeader + main + SiteFooter + AISearch)
        │   └── Pages: Home, ArticleDetail, Galeries, etc.
        └── Admin (pas de layout public)
            └── Pages: Admin, ArticleEditor, ProfilePage, etc.
```

### Lazy Loading (code splitting)

```typescript
// App.tsx — chaque page est lazy-loaded
const Home = lazy(() => import("./pages/Home"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
// ...

// Routes avec Suspense
<Suspense fallback={<PageLoader />}>
  <Switch>
    <Route path="/">
      <PublicLayout><Home /></PublicLayout>
    </Route>
    ...
  </Switch>
</Suspense>
```

### tRPC Client (client/src/lib/trpc.ts)

```typescript
// Simplifié : 4 lignes
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";
export const trpc = createTRPCReact<AppRouter>();

// Usage dans les composants
const { data } = trpc.articles.list.useQuery({ page: 1 });
const createMutation = trpc.articles.create.useMutation();
```

### TanStack Query (state management)

```typescript
// Cache automatique :
// - articles.list → cache 5min
// - articles.bySlug → cache 10min
// - siteSettings.getAll → cache 30s

// Invalidations automatiques :
// - Après create/update/delete → invalidation du cache concerné
// - Ex: createArticle → invalidate "articles.list"
```

### Routing (Wouter)

```typescript
// App.tsx
import { Route, Switch } from "wouter";

// Routes publiques (avec PublicLayout)
<Route path="/"><PublicLayout><Home /></PublicLayout></Route>
<Route path="/article/:slug"><PublicLayout><ArticleDetail /></PublicLayout></Route>

// Routes admin (sans PublicLayout)
<Route path="/admin" component={Admin} />
<Route path="/admin/article/:id" component={ArticleEditor} />
```

### Styling (Tailwind CSS v4)

```typescript
// cn() utilitaire = clsx + tailwind-merge
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn("p-4", isActive && "bg-primary text-white")}>
```

---

## Développement vs Production

### Développement (`pnpm run dev`)

```
1. tsx watch server/_core/index.ts
2. Express démarre sur port 3001
3. Vite dev server créé en middleware (setupVite)
4. Hot Module Replacement (HMR) actif
5. index.html lu depuis client/index.html à chaque requête
6. Frontend servi via Vite middleware (pas de build)
7. Backend: transpilation TS à la volée via tsx
```

### Production (`pnpm run build` → `pnpm start`)

```
1. Build: vite build → dist/public/ (bundle React optimisé)
2. Build: esbuild → dist/index.js (server Node.js bundlé)
3. start: node dist/index.js
4. Frontend: fichiers statiques dans dist/public/
5. Backend: code déjà bundlé (pas de transpilation)
6. Port: 3000 (ou PORT env)
```

### Vercel (serverless)

```
1. vercel.json redirige /api/* → api/index.ts
2. api/index.ts importe appRouter + createContext
3. Export handler = createExpressMiddleware(...)
4. Frontend: build Vite → dist/public/
5. Auto-deploy après push GitHub
```

---

## Build & Bundle

### Vite Config (vite.config.ts)

```
Plugins:
├── @vitejs/plugin-react    → JSX + Fast Refresh
├── @tailwindcss/vite       → Tailwind CSS v4
├── @builder.io/vite-plugin-jsx-loc → JSX line numbers
└── vite-plugin-manus-runtime → Debug tools

Manual Chunks (optimisation bundle):
├── vendor-ui-core          → React, Radix, Framer Motion, Lucide
├── vendor-editor           → TipTap, ProseMirror
├── vendor-data             → TanStack Query, tRPC, Zod, React Hook Form
├── vendor-ai-highlight     → Shiki, Streamdown
└── vendor-mermaid/katex    → Diagrams (si présents)
```

### esbuild (server bundling)

```bash
esbuild server/_core/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist
```

---

## Variables d'Environnement

### Côté Serveur (server/_core/env.ts)

```typescript
export const ENV = {
  databaseUrl:      process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL,
  cookieSecret:     process.env.JWT_SECRET,
  adminPassword:    process.env.ADMIN_PASSWORD,
  groqApiKey:       process.env.GROQ_API_KEY,
  googleApiKey:     process.env.GOOGLE_API_KEY,
  minimaxApiKey:    process.env.MINIMAX_API_KEY,
  aimlApiKey:       process.env.AIMLAPI_KEY,
  blobToken:        process.env.BLOB_READ_WRITE_TOKEN,
  preferredAiProvider: process.env.PREFERRED_AI_PROVIDER || "groq",
};
```

### Côté Client (vite.config.ts)

```
Toutes les variables VITE_* sont exposées au client :
- VITE_API_URL
- VITE_OAUTH_PORTAL_URL
- VITE_APP_ID
```

---

## Scripts Utiles

```bash
# Développement
pnpm run dev              # Server + Vite HMR (port 3001)

# Build & Production
pnpm run build            # Vite build + esbuild server
pnpm start                # Node.js production (port 3000)

# Vérification
pnpm run check            # TypeScript (tsc --noEmit)
pnpm run format           # Prettier

# Tests
pnpm run test             # Vitest (unit, server/**/*.test.ts)
pnpm run test:e2e         # Playwright (tests/e2e/)

# Base de données
pnpm run db:push          # Drizzle push schema

# Analyse
pnpm run analyze          # Bundle analyzer (rollup-plugin-visualizer)
```

---

## Points d'Intégration Clés

| Fichier | Rôle |
|---|---|
| `server/_core/index.ts` | Entry point Express, middlewares, port |
| `server/_core/trpc.ts` | Init tRPC, middlewares auth (5 procédures) |
| `server/_core/context.ts` | Contexte tRPC (req, res, user) |
| `server/_core/sdk.ts` | Auth JWT, session management |
| `server/_core/llm.ts` | Client IA multi-provider + fallback |
| `server/_core/env.ts` | Variables d'environnement serveur |
| `server/routers.ts` | Routes tRPC (82+ procédures, ~2200 lignes) |
| `server/db.ts` | Fonctions d'accès DB (Drizzle ORM) |
| `drizzle/schema.ts` | Schéma BDD (13 tables) |
| `shared/types.ts` | Types partagés client/serveur |
| `shared/const.ts` | Constantes partagées |
| `client/src/App.tsx` | Routeur React + layouts |
| `client/src/main.tsx` | Entry React + tRPC client |
| `client/src/lib/trpc.ts` | Client tRPC (4 lignes) |
