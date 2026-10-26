# TODO.md — Suivi des tâches G12 Paris Infos Médias

> Ce fichier est mis à jour quand l'utilisateur dit « à plus tard ». Il permet de reprendre
> le travail là où on s'est arrêté.

## Session : régression dev à corriger (non commitée) — `vite.config.ts` + `server/_core/vite.ts`

Le commit `cc802cc` (fix build) a introduit un bug : `vite.config.ts` passait en
`defineConfig(({ mode }) => ...)`, or `server/_core/vite.ts` fait `...viteConfig`
(spread d'un objet). Spreader une fonction ne copie rien → serveur dev démarré sans
plugins ni aliases (« Failed to load url /src/main.tsx », JSON indigérable).
Correctifs appliqués :
1. `vite.config.ts` : retour à une config **objet** statique — le mode prod se pilote
   via `NODE_ENV` (déjà forcé par cross-env dans `build`/`buildCommand` + garde-fou
   `process.argv.includes("build")`) ; gating `buildMode = isProduction ? ...
2. `server/_core/vite.ts` : blindage — si la config est une fonction, elle est invoquée
   ({command:'serve', mode}) avant le spread (les deux formes sont supportées).
Vérifié : check ✓, install ✓, build prod ✓ (jsxDEV=0), serveur dev → `/src/main.tsx`
200 text/javascript avec jsxDevRuntime, `/manifest.json` 200, 0 « Pre-transform error ».

## Session : audit du site déployé post-push (non commité)

### Contexte
Vérification du site en production https://g12-paris.vercel.app après les poussées
(commit+push) : pages clés, inscription publique convention, matrice admin/éditeur/bibliothécaire.
Tests faits par requêtes HTTP réelles avec jeton CSRF + sessions, **sans polluer les données**
(fiches d'audit créées puis supprimées).

### Vérifié en prod ✅
1. **Pages clés** : /, /articles, /evenements, /convention, /publication-du-jour, /galerie,
   /bibliotheque, /contact… → 200 (coquille SPA) ; /sw.js ✓, /manifest.json ✓, /offline.html ✓,
   /robots.txt ✓, /sitemap.xml ✓.
2. **API publique** : articles.list ✓, verses.latest ✓, gallery.featured ✓,
   conventionRegistrations.publicCount ✓, siteSettings.getAll ✓, auth.me (anonyme = null) ✓.
3. **Inscription publique convention** : `create` anonyme OK (CSRF requis), `publicCount`
   incrémenté, e-mail de confirmation déclenché, fiche d'audit **supprimée par la suite**
   (count revenu à 1) ; CSRF : POST sans header → 403, avec header → 401 (mauvais mot de
   passe = barrière CSRF transparente).
4. **Matrice des rôles (comptes d'audit créés puis supprimés)** — editeur et bibliotheque :
   `users.list`, `ai.apiKeys.*`, `ai.providers.*`, `conventionRegistrations.{list,listAll,stats}`,
   `agents.list` → **403 FORBIDDEN** ; `suggestions.list` (staff) → 200 ; anonyme → 403.
   Admin : toutes les routes adminOnly → 200.
5. **Médias récents** : Vercel Blob → 200 (images + vidéo) ; la galerie fonctionne.

### Écarts constatés ⚠️
1. **Fuite `conventionRegistrations.checkEmail` (public)** : renvoie la fiche complète
   (nom, e-mail, **ticketCode**, isActive, expiresAt) pour n'importe quel e-mail soumis —
   prouvé en prod. Rendre seulement `{ registered: boolean }` (le ticketCode ne doit pas
   sortir côté public).
2. **Build Vercel en mode développement** : le bundle servi `assets/index-DBFyjMyo.js`
   contient `jsxDEV`, `data-loc` et `fileName:"/vercel/path0/…"` (plugin jsx-loc + React dev,
   chunks ~2,5× plus lourds que le build local actuel). Cause : `NODE_ENV=development`
   dans les réglages du projet Vercel (+ `.env` local). Le correctif local (vite.config :
   jsxLocPlugin seulement en mode production) existe **mais n'est pas commité/poussé**
   (attente validation). Après validation : commit+push du fix + **supprimer la variable
   NODE_ENV dans Vercel → Settings → Environment Variables**, puis redéployer.
3. **Clé `site_logo` orpheline (corrigée en faux positif après relecture)** : la valeur
   `settings.site_logo = /uploads/…png` renvoie 404 sur Vercel, MAIS **aucune composante
   client ne lit cette clé** — le logo affiché vient de `SiteHeader.tsx` qui utilise
   `/logo.webp` (statique, 200 OK en prod). Impact visiteur : **aucun**. Action possible :
   vider cette clé / brancher le header dessus un jour (fichier source
   perdu de toute façon — absent du backup `backups/backup-20260530-225133.zip`).
   **→ Fait** : clé vidée en prod via `siteSettings.set {"site_logo": ""}`
   (ancienne valeur `/uploads/page-content/1774656378298-Ja-j8vIyQc59ecBRch_lW.png`,
   fichier introuvable local + backup). Pourquoi : la clé est orpheline (aucune
   lecture client), une valeur 404 morte n'a que des inconvénients ; pour
   remettre un logo un jour, passer par `siteSettings.uploadLogo` (admin), qui
   stocke sur Vercel Blob et met à jour la clé `logoUrl`.
4. **Mots de passe en clair en base** : `createUser` stocke `password` tel quel et
   `findUserByUsernameAndPassword` compare en clair (db.ts). Recommandation : hash
   (bcrypt/scrypt) + migration des comptes existants.
5. **Rôle bibliothécaire sans périmètre propre** : `bibliothequeProcedure` est déclarée
   mais jamais utilisée ; un bibliothécaire a tout le périmètre staff (adminProcedure).
   À arbitérer si tu veux vraiment restreindre ce rôle.

### Propre après l'audit
- Comptes d'audit supprimés (users.delete) : `test-editeur-audit` (22940), `test-biblio-audit` (22942).
- Fiches convention d'audit supprimées (conventionRegistrations.delete) : Audit Test (id 6), Audit Test2 (id 7).
- `publicCount` final = 1 (état initial).

## Dernière session (en cours, non commitée)

### PWA mode offline (cache des derniers contenus consultés)
1. **`client/public/sw.js`** → version **v10** : cache runtime des réponses tRPC
   **publiques** (articles, gallery, announcements, verses, pageContent,
   siteSettings) en network-first : en ligne = fraîcheur, hors ligne = dernier
   contenu connu (header `x-g12-offline: 1`); mutations + auth + uploads privés
   jamais mis en cache. Cache-first parking SYNCHRONIQUE pour les médias
   (`/uploads/`) : l'extérieur de la réponse est dans le cache avant rendu →
   couvertures/vignettes lisibles hors ligne. LRU octets + entrées
   (API ~2 Mo/60 entrées, médias ~4 Mo/300 entrées).
2. **`client/src/main.tsx`** : `gcTime` TanStack Query à 30 jours (au lieu de
   5 min, sinon le SW cache des données que React Query jette), listener
   `window online` → `invalidateQueries()` au retour du réseau (revalidations
   silencieuses, l'écran garde les dernières données valides).
3. **`client/src/components/OfflineBanner.tsx`** (nouveau) : bandeau
   « Mode hors connexion — vous consultez le dernier contenu enregistré »,
   AnimatePresence slide-in top, clés i18n `offline.banner` ajoutées dans
   **fr / en / es**. Monté dans `App.tsx > AppWithTheme` (au-dessus de
   AudioPlayerProvider).
4. Vérifié : `pnpm run check` ✓, `pnpm run build` ✓, `node --check sw.js` ✓,
   JSON locales valides ✓. **Pas de commit** (attente validation).
5. **Lightbox sur les images du corps des articles** (`ArticleDetail.tsx`) :
   collecte des `<img>` du prose rendu par Streamdown (useEffect sur
   `contentHtml`), clic délégué → Lightbox plein écran avec navigation
   ← / → entre toutes les images de l'article, cursor-zoom-in au survol.
   Les images-liens (dans un `<a>`) gardent leur comportement de lien.
   Vérifié : check ✓ + build ✓.
6. **Lightbox étendue aux autres pages** :
   - `PublicationDuJour.tsx` : les images « Publications du Jour » ouvrent
     la lightbox (fini le `openImageInNewTab`) ; l'image du Verset du Jour
     ouvre aussi la lightbox avec le texte/référence du verset en bannière.
   - `PageContentDisplay.tsx` : les images des contenus éditéurs ouvrent la
     lightbox (clé z-index stopPropagation), la légende reste extensible
     via le reste de la carte ; YouTube/vidéo MP4 inchangés (contrôles natifs).
7. **Vignettes AVIF/WebP + srcset responsive** :
   - `server/imageResizer.ts` (nouveau) : route `/api/image?src=&w=&f=`,
     transformation sharp à la volée (rotate EXIF, resize sans agrandir,
     AVIF 60 / WebP 78 / JPEG 80), Cache-Control immutable 1 an + s-maxage.
     Allowlist : `/uploads/…` (lecture borne au dossier, pas de traversal)
     + Vercel Blob / S3 ; l'échec renvoie une redirection vers l'original.
     Enregistrée dans `server/_core/index.ts` et `api/index.ts` (Vercel).
   - `client/src/lib/imageOptimize.ts` (nouveau) : normalisation source
     (même origine → chemin, blob → URL full), exclusions data:/SVG/GIF/AVIF,
     buildSrcSet 320/480/768/1024.
   - `client/src/components/OptimizedImage.tsx` (nouveau) : `<picture>`
     AVIF+WebP, `_source` et fallback original ; sources non transformables
     → `<img>` simple. Intégré aux vignettes de GalleriesPage (masonry +
     carrousel) et PageContentDisplay (prop `sizeHint`, sizes hint par mode).
   - `sw.js` : `/api/image` passe en cache-first médias (offline OK).
   - **Mesuré en local** : JPG original 161 579 o → **AVIF 320px : 9 028 o
     (−94 %)**, WebP 480px : 27 748 o. Traversal et host externe → 404.
   - Vérifié : check ✓, build ✓, `node --check sw.js` ✓, test réel endpoint ✓.
8. **Événements : countdown + .ics sur chaque événement à venir (/evenements)** :
   - `ConventionCountdown` généralisé : props `label`, `liveLabel`, variante
     `compact` (chips inline « 12j 04h 30m 00s », pour les cartes). Valeurs
     par défaut inchangées pour la page Convention.
   - `conventionCalendar.ts` : alias générique `downloadIcs` + UID dérivé du titre.
   - `EventsPage.tsx` : sous chaque carte d'événement à venir (eventDate >
     maintenant) : countdown compact (fenêtre « en cours » de 4 h) + bouton
     « Ajouter au calendrier » téléchargeant `evenement-<titre>.ics`.
9. **JSON-LD Event sur la page Convention** : `useSeo` ajouté (title/description/
   url/image de la Convention) + `eventJsonLd` (startDate/endDate réglages
   admin, location venueName+venueAddress, organizer Organization partagée).
   Vérifié : check ✓ + build ✓.
10. **Placeholder couleur dominante sur les vignettes optimisées** :
   - `client/src/lib/imagePlaceholder.ts` (nouveau) : fetch de la variante
     32 px du proxy `/api/image` (same-origin → canvas lisible, pas de CORS),
     couleur moyenne pondérée sur canvas 8×8, léger assombrissement ×0.92,
     cache module Map par URL (zéro recalcul relativement à la session).
   - `OptimizedImage.tsx` : prop `placeholder = true`, couleur déjà calculée
     applique en style synchrone (pas de flash), extraction async sinon.
     Sources non transformables → comportement inchangé.
   - Coût : ~1 Ko par image (cache immuable) ; vignettes réutilisables
     partout (galerie + pages de contenu) automatiquement.
   - Vérifié : check ✓ + build ✓.
11. **ChatBot Admin à actions (rédaction) + réorganisation du Dashboard** :
    - **`server/routers.ts`** : nouvelle procédure **`ai.compose`** (editeurProcedure) —
      rédige un brouillon structuré via LLM (multi-provider avec fallback, quota +
      logging aria "ai.compose"). Entrée : kind article/announcement/flash-event,
      brief (+ eventDate/location). Sortie : JSON validé par Zod (version sinon
      erreur claire) — **aucune écriture DB, aucun publish automatique**.
    - **`client/src/components/AIComposer.tsx`** (nouveau, chargé lazy) : sous-onglet
      **Composer** en tête de l'onglet IA. Choix du type (Article / Annonce /
      Événement), demande libre + date/lieu optionnels, aperçu **modifiable** du
      brouillon. Article → "Enregistrer en brouillon" (articles.create
      published:false) puis ouverture de l'éditeur. Annonce/Flash →
      "Préremplir le formulaire d'accueil" (sessionStorage). Brouillons seulement,
      validé par l'utilisateur.
    - **`client/src/components/HomeContentManager.tsx`** : `AnnouncementDialog`
      accepte `initialValues` (préremplissage brouillon IA) ; les sections
      Annonces et Flash-events lisent la clé sessionStorage
      `g12-composer-prefill` au montage, ouvrent le dialogue prérempli et
      consomment la clé (une seule fois, par type correspondant).
    - **`client/src/pages/Admin.tsx`** :
      - Onglets pilotés par l'URL : `value/onValueChange contrôlés`, lien
        shareable `/admin?tab=xxx` (favoris + handoff depuis le Composer), liste
        blanche par rôle (bibliothécaire ne peut pas atteindre users/ai via URL).
      - Sidebar desktop réorganisée en groupes lisible : **Contenu** (articles,
        accueil, pages, publications, story-cards), **IA & Communication** (IA,
        Communications, Inscriptions), **Administration** (CMS, Utilisateurs).
        Mobile inchangé (scroll horizontal).
      - Rôles calculés avant les retours anticipés (règle des hooks) ; garde
        d'accès « accès restreint » conservé intact.
    - Vérifié : `pnpm run check` ✓ (0 erreur), `pnpm run build` ✓ (~15 s).
12. **Fade-in des vignettes optimisées** : `OptimizedImage` — opacité 0→1
    (transition CSS 300 ms ease-out) déclenchée par `<img onLoad>`,
    l'état `complete` du DOM gère les images déjà en cache et le reset sur
    changement de source ; les styles parents restent prioritaires (spread
    `...style` après). Prop `fadeIn = true` par défaut, désactivable.
    Vérifié : check ✓ + build ✓.
13. **Test Vitest de ai.compose (matrice Pairwise)** :
    - `server/aiCompose.test.ts` (nouveau, 8 tests) : LLM mocké
      (`vi.mock("./_core/llm.js")` — invokeLLM/invokeLLMWithFallback/
      isProviderConfigured), aucun réseau, aucune écriture DB.
    - Paires couvertes : Rôle (admin | éditeur | bibliothèque | user) ×
      Type (article | annonce | flash-event) × Sortie IA (JSON valide avec
      fences, JSON minimal, JSON complet, JSON hors format, prose sans JSON).
    - Garde vérifiée : bibliothèque/user → refus AVANT l'appel LLM ; JSON
      hors format / non-JSON → erreur explicite, zéro création ; succès →
      `articles.total` et `announcements` inchangés (brouillons uniquement).
    - Résultat : 8/8 verts (`pnpm vitest run server/aiCompose.test.ts`).
14. **Correction des 2 échecs préexistants de `apiProviders.test.ts`** :
    - Cause (via `git log -S aimlapi`, commits 348cb3b puis 9a4a1de) : le
      commit initial des providers dynamiques avait un seed SANS AIMLAPI,
      mais 9a4a1de a ajouté `aimlapi` aux `DEFAULT_PROVIDERS`
      (`enabled: true`) sans mettre à jour le test ni le commentaire — le
      test échouait, le code avait raison.
    - Cause réelle du problème de fond : AIMLAPI est un provider
      **d'images/vidéo** (`/v1/images/generations`, modèle `flux/schnell`) ;
      activé par défaut, il polluait le fallback du chat
      (`invokeLLMWithFallback` n'aurait pu que échouer dessus).
    - Correctif : `aimlapi` **`enabled: false`** dans `DEFAULT_PROVIDERS`
      (liste conservée pour le connecteur de clés ; l'admin l'active), +
      mises à jour du commentaire de tête du module.
    - Test recalibré sur l'objectif de sécurité initial : « AIMLAPI présent
      mais désactivé » / « exclu du fallback du chat », plus « absent de la
      liste ». DB déjà seedée synchronisée par le `beforeAll` (upsert des
      défauts).
    - Résultat : `pnpm run test` → **115/115 verts (10 fichiers)**,
      `pnpm run check` ✓ (0 erreur), `pnpm run build` ✓ (~15 s).
15. **Blur-up des vignettes optimisées** (remplace le simple aplât de
    couleur dominante) :
    - `server/imageResizer.ts` : param `&blur=sigma` (0.3–20, rejet hors
      bornes → 400) sur `/api/image`, `sharp.blur(sigma)` appliqué après le
      resize ; les variantes normales sont inchangées.
    - `client/src/lib/imagePlaceholder.ts` réécrit : un SEUL fetch de la
      variante 320px WebP floutée («8", ≈2-10 Ko, cache immuable) fournit
      à la fois l'URL du fond ({ color, blurUrl } en cache module) et la
      couleur moyenne (canvas 8x8, pixels alpha pondérés), au lieu de deux
      téléchargements séparés (couleur 32px + image finale).
    - `client/src/components/OptimizedImage.tsx` : le fond du `<img>` porte
      désormais `background-image` = variante floutée (cover/center) par-
      dessus la `background-color` de secours ; la vignette fond 0→1
      (300 ms) au-dessus d'une version lisible floutée d'elle-même.
      Styles parents toujours prioritaires (spread `...style` après).
    - Vérifié en exécution : dev server éphémère → `GET
      /api/image?...&w=320&f=webp&blur=8` = 200 image/webp 2 212 o (vs
      12 382 o sans flou), `blur=99` = 400 ; contrôle visuel du WebP flouté
      conforme ; serveur de test stoppé, aucun port résiduel.
    - `pnpm run check` ✓ + `pnpm run build` ✓ + `pnpm run test` 115/115.
16. **Test Vitest du connecteur de clés (Pairwise)** + corrections révélées :
    - **Sécurisation** : `ai.providers.list/add/remove` passées d'
      `adminProcedure` (admin+éditeur+biblio) à `adminOnlyProcedure` — l'UI
      (ApiKeyConnector) est déjà réservée à `isAdmin` (Admin.tsx 790),
      l'API devait suivre ; un éditeur ne doit pas retoucher le fallback IA.
    - **Bug réel trouvé et corrigé** (`_core/apiProviders.ts`) : le seed
      réinsérait tout provider par défaut « manquant » à chaque lecture →
      la suppression (blacklist) d'un provider par défaut (ex. aimlapi)
      était **silencieusement annulée**. `seedIfEmpty` ne seed plus QUE si
      la table est vide (premier démarrage) ; une ligne supprimée reste
      supprimée, conformément au commentaire du module.
    - `server/providersConnector.test.ts` (nouveau, 9 tests) : matrice
      Paire Rôle (admin | editeur | bibliotheque | user | anonyme) ×
      Action (activation | désactivation | suppression+restauration |
      entrée invalide | normalisation identifiant) ; chaque refus vérifie
      l'absence d'effet de bord sur l'état AIMLAPI.
    - Contrat documenté au passage : basculer enabled via le connecteur
      passe par la charge complète (label/model/baseUrl requis par le
      schéma, comme l'UI).
    - Résultat : `pnpm run test` → **124/124 verts (11 fichiers)**,
      `pnpm run check` ✓, `pnpm run build` ✓.
    - Reste à faire éventuellement (découvert, hors périmètre) :
      `ai.apiKeys.set/remove` sont toujours sur `adminProcedure` (éditeur
      peut poser une clé API) — même pattern, resserrement à valider
      séparément.
17. **Défauts providers resserrés : seuls Groq et Google activés** :
    - `DEFAULT_PROVIDERS` : MiniMax, Ollama, Kling, Replicate passent
      `enabled: false` (AIMLAPI l'était déjà) ; le fallback du chat ne
      s'appuie plus que sur Groq + Google tant que l'admin n'active pas
      les autres via le connecteur.
    - Commentaire de tête du module mis à jour.
    - `apiProviders.test.ts` recalibré : tous les providers présents dans
      la liste, exactement 2 activés (Groq, Google), fallback = [groq,
      google], minimax/aimlapi exclus.
    - Vérifié : `pnpm run test` 124/124 (11 fichiers), check ✓, build ✓.
    - NB : une base existante déjà seedée garde son état (le seed ne
      réécrit pas les lignes présentes) ; harmonisation via toggles dans
      l'admin si souhaité.
18. **Toggle enable/disable à chaud du connecteur (API + UI)** :
    - API nouvelle procédure `ai.providers.toggle` (adminOnlyProcedure) :
      charge minimale `{ provider, enabled }`, conserve label/model/
      baseUrl, idempotent (re-toggle au même état = no-op), NOT_FOUND sur
      provider inconnu, reset du cache providers.
    - `listApiKeyStatus` expose désormais `enabled` par provider
      (champ ajouté à `ApiKeyStatus`) — l'UI connaît l'état de chaque ligne.
    - UI `ApiKeyConnector.tsx` : interrupteur Switch par ligne
      (« activé »/« désactivé » coloré), mutation `toggle` avec toasts +
      invalidations (apiKeys.list, stats), désactivé pendant l'envoi.
    - Tests : +3 dans providersConnector.test.ts (toggle conserve la
      charge, idempotence, NOT_FOUND sans création, éditeur refusé) →
      `pnpm run test` 127/127 (11 fichiers), check ✓, build ✓.

### Limites connues mode offline
- Recherche / pagination : seule la page déjà consultée est servie hors ligne.
- Contenus au-dessus de la ligne de flottaison déjà vus (LCP) restent priorisés.
- Mutations (commentaires, likes) jamais mises en file offline (pas de Background
  Sync API) → voué à rester simple, les visiteurs consultent, peu agissent hors ligne.

## Session précédente (committée)

### Commit & push de l'ensemble des sessions ci-dessus ✅
- Commit **1ad5692** `feat(site+ia): connecteur de cles avec toggle admin, providers Groq/Google par defaut, visuels blur-up et PWA offline` → push `main` (GitHub Myth972/g12-paris), Vercel redéploie automatiquement.
- État au commit : 127/127 tests verts, check ✓, build ✓. 36 fichiers (+3259 / −217), 12 fichiers créés.
- Reste non committé : cette note seulement.

## Session courante (après commit 1ad5692) — en attente de validation

18-bis. **Connecteur de clés réservé à l'admin (les clés elles-mêmes aussi)** :
    - `ai.apiKeys.list/set/remove` passées d'`adminProcedure`
      (admin+éditeur+biblio) à `adminOnlyProcedure` — l'UI ne montre déjà
      le connecteur qu'à `isAdmin` (Admin.tsx) et l'API suit désormais :
      un éditeur/bibliothécaire ne peut plus poser, retirer ni même
      consulter la liste des clés (valeurs masquées).
    - Tests : +4 dans providersConnector.test.ts (Admin set+list masque
      la valeur brute, Éditeur set refusé sans création, Bibliothécaire
      list refusé, User remove refusé avec clé intacte) — le statut de clé
      n'est listé que pour les providers connus (ligne de test créée et
      nettoyée clé+ligne).
    - Résultat : 16/16 dans le fichier, `pnpm run test` → **131/131 verts
      (11 fichiers)**, check ✓, build ✓.

18-ter. **Matrice de permissions Pairwise étendue (users, cms, ai) + correction d'une escalade** :
    - Révélation corrigée (`server/routers.ts`) : `users.list/get/create/
      updateRole/delete` montaient sur `adminProcedure`(= admin+éditeur+biblio)
      — un éditeur pouvait créer un compte admin ou se promouvoir lui-même
      via un appel tRPC direct. Passées en `adminOnlyProcedure`, alignées sur
      l'UI (onglet Utilisateurs rendu seulement si `showFullAdmin`).
    - Vérifiées sans changement : `pageContent.*` (create/update éditeur = OK,
      métier de rédaction ; biblio refusée à create, editeurProcedure) et
      `ai.chat` (adminProcedure délibéré : le chatbot admin est staff+admin).
      `ai.scanArea` demandée par l'utilisateur n'existe pas dans le code.
    - Test nouveau `server/permissionsMatrix.test.ts` : **14 paires** —
      users (admin list ; admin create+delete ; éditeur updateRole→admin
      refusé avec rôle inchangé en DB ; biblio create refusée sans compte
      créé ; user list refusée ; anonyme get refusé), cms (éditeur create
      autorisé avec son authorId ; biblio create refusée ; user update
      refusé ; anonyme adminList refusé), ai.chat (admin et éditeur
      autorisés ; user et anonyme refusés) — avec mock LLM et cleanup
      complet (users `tmp-perm-cible`, pageContent `tmp-perm-test`).
      Contrat documenté au passage : le middleware de rôles renvoie
      FORBIDDEN (« Accès réservé aux rôles ») même sans session.
    - Résultat : 14/14 dans le fichier, `pnpm run test` → **145/145 verts
      (12 fichiers)**, check ✓, build ✓. Non commité (attente validation).

18-quater. **Inscriptions de convention réservées à l'admin (les listes d'e-mails aussi)** :
    - `conventionRegistrations.list/listAll/count/stats/delete/toggleActive/
      bulkDelete` passées d'`adminProcedure` à `adminOnlyProcedure` — un
      éditeur/bibliothécaire pouvait consulter puis supprimer les inscriptions
      (e-mails et dates personnels des participants). L'UI ne rend l'onglet
      Inscriptions que si `showFullAdmin` (menu caché + `allowedTabs` +
      contenu non rendu sur `/admin?tab=` forcé) ; l'API suit désormais.
    - Porte publique inchangée : `create/checkEmail/verifyCode/publicCount`
      restent `publicProcedure`.
    - Tests : +5 paires dans permissionsMatrix.test.ts (anonyme stats refusé,
      biblio list refusée, admin create public + toggleActive + delete cycle,
      éditeur listAll refusé, user delete refusé avec ligne intacte vérifiée
      en DB puis nettoyage admin) — cleanup `tmp-perm-conv@example.com`.
      Petite coquille de restructuration du fichier réparée (réouverture
      du bloc describe `ai.chat`).
    - Résultat : 19/19 dans le fichier, `pnpm run test` → **150/150 verts
      (12 fichiers)**, check ✓, build ✓. Non commité (attente validation).

18-quinquies. **Audit des routes admin restantes (bibliothèque, verses,
newsletter, agents) + garde routeur admin-only sur /admin/agents** :
    - Audit sans modification : aucune fuite de données personnelles.
      Newsletter (listSubscribers/digest) = workflow métier du bibliothécaire
      (AdminBibliotheque.tsx liste/enleve des abonnés) — assumé, pas une
      fuite. Verses/bibliotheque = contenu éditorial. agents.* API accepte
      le staff (non-PII, opérationnel). ai.stats/quota agrégés + son quota.
    - Garde routeur (`client/src/App.tsx`) : composant `AdminOnlyRoute`
      (useAuth + wouter useLocation) qui attend la résolution de la session
      (PageLoader), puis redirige tout non-admin vers /admin — plus de
      rendu « Accès réservé » figé sur /admin/agents, la garde du composant
      AdminAgents reste en backstop. Route /admin/agents enveloppée.
    - check ✓, build ✓. Non commité (attente validation).

18-sexies. **Agents réservés à l'admin au niveau API (+ 4 paires de test)** :
    - `agents.list/run/logs` passées d'`adminProcedure` à
      `adminOnlyProcedure` (routers.ts) pour coller à la garde UI
      AdminAgents : déclencher des runs de scripts serveur n'est pas le
      métier de la rédaction.
    - Tests +4 dans permissionsMatrix.test.ts (agent de test enregistré
      via registerAgent, sans effet de bord) : admin list OK ; admin run +
      logs avec trace de succès ; éditeur run refusé sans exécution ni
      log ; biblio logs + user list refusés.
    - Résultat : 23/23 dans le fichier, `pnpm run test` → **154/154 verts
      (12 fichiers)**, check ✓, build ✓. Non commité (attente validation).

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