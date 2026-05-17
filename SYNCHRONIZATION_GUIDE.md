# Guide de Synchronisation des Environnements

## ­ƒôü Structure des Environnements

Ce projet utilise **trois environnements** distincts :

| Dossier | R├┤le | Usage |
|---------|------|-------|
| `Production en cours/` | **Production** | D├®ploy├® sur Vercel/GTI - Version de r├®f├®rence |
| `developement en cours/` | **D├®veloppement** | Bac ├á sable local - Tests et nouvelles fonctionnalit├®s |
| `api/` | **API Vercel** | Routes API optimis├®es pour le d├®ploiement serverless |

## ­ƒöä Workflow de D├®veloppement

### 1. D├®veloppement Local
```bash
cd "developement en cours"
npm run dev
```
- Travaillez ici sur les nouvelles fonctionnalit├®s
- Testez sans impacter la production

### 2. D├®ploiement vers Production
Lorsque vous ├¬tes pr├¬t ├á d├®ployer :

```powershell
# Copier les fichiers modifi├®s depuis D├®veloppement vers Production
Copy-Item -Path "developement en cours\client" -Destination "Production en cours\" -Recurse -Force
Copy-Item -Path "developement en cours\server" -Destination "Production en cours\" -Recurse -Force
Copy-Item -Path "developement en cours\shared" -Destination "Production en cours\" -Recurse -Force

# Ou utiliser le script de d├®ploiement existant
cd "Production en cours"
powershell.exe -File deploy.ps1
```

### 3. Base de Donn├®es
- **Ne copiez jamais** `sqlite.db` entre les environnements
- Chaque environnement a sa propre base de donn├®es
- Les sch├®mas sont synchronis├®s via Drizzle (`npm run db:push`)

## ÔÜá´©Å R├¿gles Importantes

1. **NE JAMAIS** modifier directement les fichiers dans `Production en cours/` pour le d├®veloppement
2. **TOUJOURS** travailler dans `developement en cours/` puis synchroniser
3. **RESPECTER** la structure des dossiers - ne pas d├®placer les fichiers n'importe o├╣
4. **GARDER** les fichiers `.env` s├®par├®s pour chaque environnement

## ­ƒôï Fichiers ├á Synchroniser Manuellement

Apr├¿s chaque session de d├®veloppement, sincronisez ces dossiers :
- `client/src/` (code front-end)
- `server/` (code back-end et API)
- `shared/` (types partag├®s)
- `drizzle/` (si changements de sch├®ma)

**Ne PAS toucher** :
- `node_modules/` (r├®install├® via `pnpm install`)
- `sqlite.db` (base de donn├®es locale)
- `.env` (variables d'environnement sp├®cifiques)

## ­ƒøá´©Å Commandes Utiles

```bash
# Dans developement en cours
npm run dev              # D├®marrer le serveur local
npm run check           # V├®rifier les types TypeScript
npm run db:push         # Synchroniser le sch├®ma de base de donn├®es

# Dans Production en cours
npm run build           # Pr├®parer pour la production
pnpm run deploy         # D├®ployer sur Vercel
```
