# TODO.md — Suivi des tâches G12 Paris Infos Médias

> Ce fichier est mis à jour quand l'utilisateur dit « à plus tard ». Il permet de reprendre
> le travail là où on s'est arrêté.

## Dernière session (terminée)

### Contexte
Analyse du projet + corrections + tests de l'API Notifications avec la technique de test **Pairwise**
(paires : Rôle Éditeur × Lecture de notifications existantes ; Rôle Simple × Marquer Tout Comme Lu
avec aucune/partiellement lues). Validé par l'utilisateur : « Ok pour moi », « Oui tu peux ».

### Fait ✅
1. **`server/db.ts`** :
   - `markNotificationAsRead` : lève `TRPCError NOT_FOUND` si la notification n'existe pas (fini le faux `{success:true, alreadyRead:true}`) ; `catch` ciblé uniquement `SQLITE_CONSTRAINT_UNIQUE`, les autres erreurs remontent.
   - Types de retour explicites pour `listNotifications` / `getUserNotifications` (fini les `any`), import `type Notification`.
   - Ajout de `_client` + export `closeDb()`.
2. **`server/_core/trpc.ts`** : ajout de `adminOnlyProcedure` (rôle `admin` seul). `adminProcedure` (admin+editeur+bibliotheque) inchangée.
3. **`server/routers.ts`** : `notifications.create` et `notifications.delete` passées en `adminOnlyProcedure`.
4. **`server/notifications.test.ts`** : réécrit → **26 tests** (access control, admin CRUD, matrice pairwise documentée, registry `createdNotifIds` pour cleanup, helper `createBibliothequeContext`).
5. **`client/src/components/NotificationBell.tsx`** + **`client/src/pages/ProfilePage.tsx`** : suppression des `any`.
6. **DB de test isolée** (`vitest.setup.ts`) : fichier SQLite unique par worker dans `os.tmpdir()` (`g12-test-${pid}-${Date.now()}-....sqlite`), `DATABASE_URL=file:...`, vars TURSO supprimées, push du schéma via `pushSQLiteSchema` (drizzle-kit/api chargé par `createRequire` — l'import ESM échoue sous Vite). `afterAll` → `closeDb()`.
7. **`vitest.config.ts`** : ajout `globalSetup: ["./tests/setup/db.teardown.ts"]`.
8. **`tests/setup/db.teardown.ts`** : nouveau — export **nommés** `setup`/`teardown` (vitest ignore le `teardown` nommé si un `default` existe !). Nettoie les `g12-test-*.sqlite` de `%TEMP%` après fermeture des workers.

### Vérifié ✅
- `pnpm run test` : **48 tests passent** (4 fichiers), 0 fichier temp résiduel dans `%TEMP%`.
- `pnpm run check` (tsc --noEmit) : **propre**.

## À faire plus tard / idées
- [ ] Rien de bloquant en attente. Prochaines pistes possibles :
  - [ ] Étendre les tests Pairwise à d'autres APIs (gallery, announcements, themes…).
  - [ ] Vérifier si `vitest.config.dev.ts` a besoin du même `globalSetup`.
  - [ ] Penser à vider `%TEMP%` si un run est interrompu (Ctrl+C laisse des fichiers `g12-test-*.sqlite`).

## Notes techniques importantes
- **Ne pas utiliser `drizzle-migrations/*.sql`** pour créer la DB de test : schéma obsolète (ex. `page_content` sans `ctaLabel`). Utiliser `pushSQLiteSchema(schemaModule, drizzleDb)` avec `await import("./drizzle/schema.ts")`.
- Fichiers SQLite verrouillés (EPERM Windows) tant que le worker vitest est vivant ; suppression possible seulement après la fin du run.
- `backup-20260506-211520/` : dossier de backup pré-existant — ne pas y toucher ; casse l'include par défaut de vitest (utiliser `include: ["server/**/*.test.ts"]`).
- Vitest 2.1.9 : `loadGlobalSetupFile` utilise `m.default` comme setup et **ignore `teardown` nommé si un `default` existe** → ne pas utiliser `export default` dans `db.teardown.ts`.
- Avertissement bénin : `DeprecationWarning: punycode module is deprecated`.
- Environnement : Windows/PowerShell, pnpm. Commandes : `pnpm run test`, `pnpm run check`.