# G12 Paris Infos Médias

Plateforme web moderne pour publier des actualités, articles et publications, avec support IA pour la rédaction.

**Dernière mise à jour**: 2026-04-06  
**Version**: 1.0.0  
**Status**: ✅ Opérationnel

---

## ✨ Fonctionnalités

- Gestion de contenu: articles, publications, catégories, slugs SEO
- IA générative: titres, résumés, correction, rédaction
- Authentification: Dev Login, rôles admin/user, JWT
- Frontend moderne: React 19, TailwindCSS, Radix UI, Wouter
- Backend robuste: Node.js, Express, tRPC, Turso/LibSQL, Drizzle ORM

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- npm ou pnpm
- Variables d’environnement configurées (voir `.env`)

### Installation

```bash
npm install
npm run check
npm run dev
```

### Windows (script)

Double-cliquez `launch-server.bat` et choisissez :

1. Mode Développement (hot-reload, debug)
2. Mode Production (build + serveur)
3. Vérifier versions Node/npm
4. Installer dépendances

### Mac/Linux

```bash
npm run dev
npm run build
npm start
npm run check
```

### Accès

- Frontend (dev): http://localhost:3001/
- API tRPC (dev): http://localhost:3001/api/trpc
- Frontend (prod): http://localhost:3000/ (ou `PORT`)
- API tRPC (prod): http://localhost:3000/api/trpc

---

## 🔐 Authentification

Dev Login (développement uniquement):

```bash
curl -X POST http://localhost:3001/api/dev/login \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'
```

Ou via `/dev-login` dans le navigateur.

Production: configurer `OAUTH_SERVER_URL` et `OWNER_OPEN_ID` dans `.env`.

---

## 🤖 IA

### Exemples

```typescript
const title = await trpc.ai.generateText.mutate({
  prompt: "Article sur l'impact de la technologie à Paris",
  type: "title",
});
```

### Types

- `title`
- `summary`
- `correction`
- `content`

### Endpoints IA

- `POST /api/trpc/ai.generateText`
- `POST /api/trpc/ai.generateImage`

---

## 📚 API (tRPC)

Publications:

- `GET /api/trpc/publications.list`
- `POST /api/trpc/publications.create`
- `POST /api/trpc/publications.delete`

Articles:

- `GET /api/trpc/articles.list`
- `GET /api/trpc/articles.bySlug`
- `POST /api/trpc/articles.create`
- `POST /api/trpc/articles.update`
- `POST /api/trpc/articles.delete`

Auth:

- `GET /api/trpc/auth.me`
- `POST /api/trpc/auth.logout`

---

## 🗄️ Base de Données

- Provider: Turso (LibSQL)
- ORM: Drizzle
- Tables principales: `users`, `articles`, `publications`, `notifications`, `galleries`, `pages`

Migrations:

```bash
npm run db:push
```

---

## 📝 Variables d’Environnement

Copier `.env.example` en `.env` puis configurer:

```env
# Database
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

# JWT
JWT_SECRET=votre-secret-ici

# AI Provider
PREFERRED_AI_PROVIDER=groq
GROQ_API_KEY=votre-cle-groq
GOOGLE_API_KEY=... (optionnel)

# OAuth (Production)
OAUTH_SERVER_URL=https://...
OWNER_OPEN_ID=...
```

---

## 🧪 Tests

```bash
npm run check
npm run test
npm run build
```

---

## 🐛 Troubleshooting

Port déjà utilisé: le serveur tente automatiquement le port suivant.

Frontend ne charge pas:

- Vérifier le port 3001
- Vider le cache navigateur
- Hard refresh (Ctrl+F5)

API erreurs:

- Vérifier la session dev login
- Vérifier les logs serveur
- Vérifier `GROQ_API_KEY`

Build:

- `client/index.html` doit exister pour le build

---

## 📊 Structure du Projet

```
.
├── client/                    # Frontend React
├── server/                    # Backend Node.js
├── shared/                    # Code partagé
├── api/                       # API Vercel
├── drizzle/                   # Schéma database
├── launch-server.bat          # Script de démarrage
└── README.md                  # Documentation consolidée
```

---

## 📊 État du Projet

| Aspect       | Status | Notes                  |
| ------------ | ------ | ---------------------- |
| TypeScript   | ✅     | 0 erreurs              |
| Frontend     | ✅     | React 19, Vite         |
| Backend      | ✅     | Node.js, Express, tRPC |
| Database     | ✅     | Turso/LibSQL           |
| AI           | ✅     | Groq (llama-3.3-70b)   |
| Auth         | ✅     | JWT + Dev Login        |
| Publications | ✅     | 2 publiées             |
| Articles     | ✅     | 1 publié               |

---

## 🎯 Prochaines Étapes

- Configurer OAuth en production
- Ajouter des tests automatisés
- Mettre en place le monitoring
- Configurer les backups
- Optimiser les performances

---

## 🤝 Contribution

1. Créer une branche `feature/votre-feature`
2. Faire les changements
3. Vérifier les types: `npm run check`
4. Formater le code: `npm run format`
5. Ouvrir une Pull Request

---

## 📄 Licence

MIT

---

## 📞 Support

- Consulter les logs serveur
- Regarder `.manus-logs/` pour le debug
