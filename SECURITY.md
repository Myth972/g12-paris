# Politique de sécurité — G12 Paris Infos Médias

## À propos du projet

G12 Paris Infos Médias est une plateforme web fullstack (React 19 + Express + tRPC + Drizzle ORM + Turso/SQLite) pour publier des actualités, articles, médias et gérer du contenu d'église, avec support IA multi-provider.

## Mesures de sécurité déjà en place

| Mesure | Implémentation |
|--------|---------------|
| **CSRF** | Double-submit cookie pattern (`csrf_token` cookie + `x-csrf-token` header) |
| **Rate limiting** | 120 req/min (prod), 300 req/min (dev) — général |
| **Rate limiting IA** | 20 req/min (prod), 60 req/min (dev) — spécifique IA |
| **Authentification** | JWT (jose) + sessions cookie |
| **Protection XSS** | Assainissement des entrées IA (Streamdown) |
| **Quota IA** | 50k tokens/heure par utilisateur |
| **Timeout IA** | 30s sur tous les appels IA |
| **Retry + Fallback** | groq → google → minimax → aimlapi |
| **Validation** | Zod schemas sur toutes les entrées tRPC |
| **CORS** | Configuré pour le domaine Vercel |
| **Upload** | Limité à 50MB, stockage S3/Vercel Blob |
| **Logger IA** | Tokens, durée, succès/erreur tracés |

## Versions prises en charge

| Version | Prise en charge |
|---------|-----------------|
| `main` | ✅ Oui |
| Dernière version publiée | ✅ Oui |
| Versions antérieures | ❌ Non, sauf correctif critique validé |

## Signaler une vulnérabilité

Ne créez pas d'issue publique. Utilisez le **signalement privé GitHub** (Security Advisories) :

1. Allez dans l'onglet **Security** du dépôt
2. Cliquez sur **"Report a vulnerability"**
3. Remplissez le formulaire avec :
   - Description claire de la vulnérabilité
   - Impact estimé et scénario d'exploitation
   - Étapes de reproduction
   - Preuve de concept minimale (sans données sensibles)

Si le signalement privé n'est pas disponible, contactez : **security@g12paris.fr**

## Délais de traitement

- Accusé de réception : **3 jours ouvrés**
- Première qualification : **7 jours ouvrés**
- Communication régulière jusqu'à correction

## Divulgation responsable

- Laissez un délai raisonnable avant toute divulgation publique
- N'exfiltrez, modifiez ou détruisez pas de données
- Ne dégradez pas la disponibilité du service
- Limitez les tests au strict nécessaire

## Bonnes pratiques mainteneurs

- Traiter en priorité les alertes **CodeQL** et **Dependabot** critiques ou élevées
- Protéger la branche `main` avec revue obligatoire
- Exiger des statuts GitHub Actions verts avant fusion
- Activer les mises à jour de sécurité Dependabot
- Réviser régulièrement les permissions GitHub Actions et l'accès des collaborateurs
- Ne jamais commiter les fichiers `.env`, `sqlite.db`, `SYNCHRONIZATION_GUIDE.md`, `TODO_PENDING.md`
- Utiliser des tokens API avec rotation régulière (JWT, clés IA, AWS S3)
