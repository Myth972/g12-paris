# Journal des actions (résumé)

Date : 2026-04-04

## Modifications principales

- Mise à jour de `baseline-browser-mapping` via pnpm.
- Correction d’un import TipTap : `TextStyle` en export nommé.
- Désactivation conditionnelle du debug collector Manus (via `MANUS_DEBUG_COLLECTOR`).
- Dédoublonnage/alias React dans Vite pour éviter l’erreur `Invalid hook call`.
- Ajout d’un sélecteur d’IA global (Groq/Google), persistant via `siteSettings`.
- Ajout d’un test IA (`ai.testProvider`) et d’un statut IA public (`ai.status`).
- Application du fournisseur IA aux fonctionnalités (chat, descriptions, versets, traductions, recherche).
- Ajout d’éditeurs inline H1/H2 sur pages publiques.
- Ajout d’éditeurs inline de textes (paragraphes) sur pages publiques + footer.
- Amélioration de l’affichage “Publication du jour” avec paires image/vidéo.
- Séparation image/vidéo dans `PageContentDisplay` (image cover / vidéo contain).
- Ajout d’un fond Hero configurable (Home + Culte en ligne) via Admin.
- Ajustements du Hero Home : hauteur, parallax, centrage et taille du background.
- Correction de `ai.search` (accès DB) + validation fonctionnelle.

## Fichiers ajoutés

- `client/src/lib/aiProviders.ts`
- `client/src/hooks/useAiProvider.ts`
- `client/src/components/AIProviderSelect.tsx`
- `client/src/components/PageTitleEditor.tsx`
- `client/src/components/PageTextEditor.tsx`
- `client/src/components/HomeHeroBackgroundSettings.tsx`
- `client/src/components/CulteHeroBackgroundSettings.tsx`

## Fichiers modifiés (principaux)

- `client/src/pages/Admin.tsx`
- `client/src/pages/Home.tsx`
- `client/src/pages/PublicationDuJour.tsx`
- `client/src/pages/GalleriesPage.tsx`
- `client/src/pages/BibliothequeePage.tsx`
- `client/src/pages/CulteEnLignePage.tsx`
- `client/src/pages/ArticleEditor.tsx`
- `client/src/components/PageContentManager.tsx`
- `client/src/components/VersesManager.tsx`
- `client/src/components/SiteFooter.tsx`
- `client/src/components/PageContentDisplay.tsx`
- `client/src/components/AISearch.tsx`
- `server/routers.ts`
- `server/_core/llm.ts`
- `vite.config.ts`
- `client/src/components/RichTextEditor.tsx`

## Notes

- Le service worker et Manus debug collector peuvent provoquer des warnings en dev.
- Le provider IA actif est stocké dans `siteSettings` (clé `aiProvider`).
- Les textes inline sont stockés via `siteSettings` (ex: `pageTitle.*`, `pageText.*`).
