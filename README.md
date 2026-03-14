# 📰 G12 Paris Infos Médias

Un site web moderne pour publier des actualités, des articles et des publications avec support de l'IA générative pour la rédaction.

## ✨ Fonctionnalités Principales

### 📄 Gestion de Contenu

- **Articles** - Créer, éditer et publier des articles journalistiques
- **Publications** - Partager des images et contenus visuels
- **Catégories** - Organiser le contenu par catégorie
- **Slugs** - URLs lisibles et SEO-friendly

### 🤖 IA Générative (Groq)

- **Génération de titres** - Créer des titres percutants
- **Génération de résumés** - Écrire des chapôs professionnels
- **Correction de texte** - Corriger orthographe et grammaire
- **Génération de contenu** - Rédiger des articles structurés

### 🔐 Authentification & Autorisation

- **Dev Login** - Compte de développement pour tester
- **Admin Panel** - Interface d'administration
- **Contrôle d'accès** - Admin et user roles
- **JWT Sessions** - Sessions sécurisées

### 🎨 Frontend Moderne

- **React 19** - Dernière version de React
- **TailwindCSS** - Design responsive et élégant
- **Radix UI** - Composants d'interface accessibles
- **Wouter** - Routeur léger et performant

### ⚡ Backend Robuste

- **Node.js + Express** - Serveur performant
- **tRPC** - RPC typé et sécurisé
- **Turso/LibSQL** - Base de données distribuée
- **Drizzle ORM** - Gestion élégante de la base de données

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- npm ou pnpm
- Variables d'environnement configurées (voir `.env`)

### Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Vérifier TypeScript
npm run check

# 3. Démarrer le serveur de développement
npm run dev
```

### Accès

- **Frontend**: http://localhost:3001/
- **API**: http://localhost:3001/api/trpc

---

## 📖 Utilisation

### Lancer via le Script Batch (Windows)

Double-cliquez sur `launch-server.bat` et choisissez :

1. **Mode Développement** (hot-reload, debug)
2. **Mode Production** (build + serveur)
3. **Vérifier versions Node/npm**
4. **Installer dépendances**

### Commands NPM

```bash
# Développement
npm run dev          # Démarrer avec hot-reload

# Build & Production
npm run build        # Compiler pour production
npm start            # Lancer en production

# Vérification
npm run check        # Vérifier les types TypeScript
npm run format       # Formater le code

# Tests & Database
npm run test         # Lancer les tests
npm run db:push      # Générer les migrations
```

---

## 🔐 Authentification

### Test Login (Développement)

Pour tester avec un compte admin :

```bash
curl -X POST http://localhost:3001/api/dev/login \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'
```

Ou accédez à `/dev-login` dans le navigateur.

### Production

Configurez `OAUTH_SERVER_URL` et `OWNER_OPEN_ID` dans `.env` pour utiliser OAuth en production.

---

## 🤖 Utiliser l'IA

### Exemple: Générer un titre

```typescript
const title = await trpc.ai.generateText.mutate({
  prompt: "Article sur l'impact de la technologie à Paris",
  type: "title",
});
```

### Types disponibles

- `title` - Générer des titres percutants
- `summary` - Créer des résumés professionnels
- `correction` - Corriger le texte
- `content` - Rédiger du contenu structuré

---

## 📊 Structure du Projet

```
.
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Pages du site
│   │   ├── components/       # Composants réutilisables
│   │   ├── lib/              # Utilities et configs
│   │   └── main.tsx          # Entrée React
│   └── index.html
├── server/                    # Backend Node.js
│   ├── main.ts               # Entrée serveur
│   ├── routers.ts            # Endpoints tRPC
│   ├── db.ts                 # Fonctions database
│   └── _core/                # Modules core
├── shared/                    # Code partagé
│   ├── types.ts              # Types TypeScript
│   └── const.ts              # Constantes
├── api/                       # API Vercel
├── drizzle/                   # Schéma database
├── launch-server.bat         # Script de démarrage
├── SERVER_GUIDE.md           # Guide serveur détaillé
└── README.md                 # Ce fichier
```

---

## 🗄️ Base de Données

### Provider

- **Turso** (LibSQL) - Base de données distribuée et performante
- **Drizzle ORM** - Gestion élégante avec type-safety

### Tables Principales

- `users` - Utilisateurs et authentification
- `articles` - Articles et actualités
- `publications` - Publications et images
- `notifications` - Notifications utilisateurs
- `galleries` - Galeries d'images
- `pages` - Pages statiques

### Migration

```bash
npm run db:push  # Générer et appliquer les migrations
```

---

## 🧪 Tests

### Type Checking

```bash
npm run check  # Vérifier les types TypeScript (0 erreurs attendues ✅)
```

### Tests

```bash
npm run test   # Lancer les tests unitaires
```

---

## 🚢 Déploiement

### Vercel (Recommandé)

1. Push le code vers GitHub
2. Connectez le repo à Vercel
3. Configurez les variables d'environnement
4. Déployez automatiquement

### Docker

```bash
docker build -t g12-paris .
docker run -p 3000:3000 g12-paris
```

### Autres Hosting

```bash
npm run build  # Build
npm start      # Lancer le serveur
```

---

## 📝 Variables d'Environnement

Copiez `.env.example` en `.env` et configurez :

```env
# Database
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

# JWT
JWT_SECRET=votre-secret-ici

# AI Provider
PREFERRED_AI_PROVIDER=groq
GROQ_API_KEY=votre-cle-groq

# OAuth (Production)
OAUTH_SERVER_URL=https://...
OWNER_OPEN_ID=...
```

---

## 🐛 Troubleshooting

### Erreur: Port déjà utilisé

Le serveur essaie automatiquement le port suivant (3001, 3002, etc.)

### Frontend ne charge pas

- Vérifier que le port 3001 est accessible
- Vider le cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)

### API Erreurs

- Vérifier que vous êtes connecté (dev login)
- Vérifier les logs du serveur
- Vérifier que `GROQ_API_KEY` est configuré

---

## 📊 État du Projet

| Aspect       | Status | Notes                             |
| ------------ | ------ | --------------------------------- |
| TypeScript   | ✅     | 0 erreurs                         |
| Frontend     | ✅     | React 19, Vite                    |
| Backend      | ✅     | Node.js, Express, tRPC            |
| Database     | ✅     | Turso/LibSQL                      |
| AI           | ✅     | Groq (llama-3.3-70b)              |
| Auth         | ✅     | JWT + Dev Login                   |
| Publications | ✅     | 2 publiées                        |
| Articles     | ✅     | 1 publié                          |
| Build        | ⚠️     | Nécessite index.html dans client/ |

---

## 🤝 Contribution

Pour contribuer au projet:

1. Créez une branche `feature/votre-feature`
2. Faites vos changements
3. Vérifiez les types: `npm run check`
4. Formattez le code: `npm run format`
5. Créez une Pull Request

---

## 📄 Licence

MIT - Libre d'utilisation

---

## 📞 Support

Pour des questions ou problèmes:

1. Consultez `SERVER_GUIDE.md`
2. Vérifiez les logs du serveur
3. Regardez dans `.manus-logs/` pour les informations de debug

---

## 🎉 Prochaines Étapes

- [ ] Configurer OAuth en production
- [ ] Ajouter des tests automatisés
- [ ] Mettre en place le monitoring
- [ ] Configurer les backups
- [ ] Optimiser les performances
- [ ] Ajouter plus de fonctionnalités IA

---

**Dernière mise à jour**: 2026-02-21  
**Version**: 1.0.0  
**Status**: ✅ Opérationnel et prêt pour utilisation
