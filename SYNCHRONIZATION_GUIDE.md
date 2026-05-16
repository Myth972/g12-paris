# Guide de Synchronisation des Environnements

## 📁 Structure des Environnements

Ce projet utilise **trois environnements** distincts :

| Dossier | Rôle | Usage |
|---------|------|-------|
| `Production en cours/` | **Production** | Déployé sur Vercel/GTI - Version de référence |
| `developement en cours/` | **Développement** | Bac à sable local - Tests et nouvelles fonctionnalités |
| `api/` | **API Vercel** | Routes API optimisées pour le déploiement serverless |

## 🔄 Workflow de Développement

### 1. Développement Local
```bash
cd "developement en cours"
npm run dev
```
- Travaillez ici sur les nouvelles fonctionnalités
- Testez sans impacter la production

### 2. Déploiement vers Production
Lorsque vous êtes prêt à déployer :

```powershell
# Copier les fichiers modifiés depuis Développement vers Production
Copy-Item -Path "developement en cours\client" -Destination "Production en cours\" -Recurse -Force
Copy-Item -Path "developement en cours\server" -Destination "Production en cours\" -Recurse -Force
Copy-Item -Path "developement en cours\shared" -Destination "Production en cours\" -Recurse -Force

# Ou utiliser le script de déploiement existant
cd "Production en cours"
powershell.exe -File deploy.ps1
```

### 3. Base de Données
- **Ne copiez jamais** `sqlite.db` entre les environnements
- Chaque environnement a sa propre base de données
- Les schémas sont synchronisés via Drizzle (`npm run db:push`)

## ⚠️ Règles Importantes

1. **NE JAMAIS** modifier directement les fichiers dans `Production en cours/` pour le développement
2. **TOUJOURS** travailler dans `developement en cours/` puis synchroniser
3. **RESPECTER** la structure des dossiers - ne pas déplacer les fichiers n'importe où
4. **GARDER** les fichiers `.env` séparés pour chaque environnement

## 📋 Fichiers à Synchroniser Manuellement

Après chaque session de développement, sincronisez ces dossiers :
- `client/src/` (code front-end)
- `server/` (code back-end et API)
- `shared/` (types partagés)
- `drizzle/` (si changements de schéma)

**Ne PAS toucher** :
- `node_modules/` (réinstallé via `pnpm install`)
- `sqlite.db` (base de données locale)
- `.env` (variables d'environnement spécifiques)

## 🛠️ Commandes Utiles

```bash
# Dans developement en cours
npm run dev              # Démarrer le serveur local
npm run check           # Vérifier les types TypeScript
npm run db:push         # Synchroniser le schéma de base de données

# Dans Production en cours
npm run build           # Préparer pour la production
pnpm run deploy         # Déployer sur Vercel
```