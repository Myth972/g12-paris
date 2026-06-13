# Guide Playwright - G12 Paris Media Platform

Ce guide explique comment configurer et utiliser Playwright pour tester l'application G12 Paris Media Platform.

## Table des matières

1. [Installation et configuration](#installation-et-configuration)
2. [Fonctions de Playwright](#fonctions-de-playwright)
3. [Configuration des tests](#configuration-des-tests)
4. [Capacités de tests](#capacités-de-tests)
5. [Exemples de tests](#exemples-de-tests)
6. [Bonnes pratiques](#bonnes-pratiques)

---

## Installation et configuration

### 1. Installation des dépendances

```bash
# Installation de Playwright
pnpm add -D @playwright/test

# Installation des navigateurs
npx playwright install
```

### 2. Configuration du projet

Le fichier `playwright.config.ts` est configuré avec :
- Support de Chrome, Firefox, Safari et Edge
- Tests sur bureau et mobile
- Serveur de développement intégré
- Screenshots et vidéos en cas d'échec
- Traces pour le débogage

### 3. Scripts npm

Ajoutez ces scripts dans votre `package.json` :

```json
{
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "test:report": "playwright show-report",
    "test:update": "playwright test --update-snapshots",
    "test:clean": "playwright test --clean-snapshots"
  }
}
```

---

## Fonctions de Playwright

### 1. Navigation et interaction

```typescript
// Navigation
await page.goto('/');
await page.waitForLoadState('networkidle');

// Clics
await page.click('button[type="submit"]');
await page.click('[data-testid="login-button"]');

// Remplissage de formulaires
await page.fill('#email', 'user@example.com');
await page.fill('#password', 'password123');
await page.selectOption('select[name="language"]', 'fr');

// Upload de fichiers
await page.setInputFiles('input[type="file"]', 'path/to/file.jpg');
```

### 2. Assertions

```typescript
// Assertions de base
await expect(page).toHaveTitle('G12 Paris Media');
await expect(page.locator('h1')).toHaveText('Bienvenue');
await expect(page.locator('.success-message')).toBeVisible();

// Assertions de contenu
await expect(page.locator('.article-card')).toHaveCount(5);
await expect(page.locator('.loading-spinner')).toBeHidden();

// Assertions de formulaires
await expect(page.locator('#email')).toBeFocused();
await expect(page.locator('.error-message')).toHaveText('Email invalide');
```

### 3. Gestion des états

```typescript
// Attendre un élément
await page.waitForSelector('.article-card', { timeout: 10000 });

// Attendre une condition
await page.waitForFunction(() => document.querySelector('.loaded') !== null);

// Attendre le réseau
await page.waitForResponse('**/api/articles');
```

### 4. Fonctions utilitaires

```typescript
// Capture d'écran
await page.screenshot({ path: 'home.png', fullPage: true });

// Vidéo
await page.video().saveAs('test-video.webm');

// Console logs
page.on('console', (msg) => {
  console.log(`[${msg.type()}] ${msg.text()}`);
});

// Network monitoring
page.on('response', (response) => {
  if (response.status() >= 400) {
    console.error(`HTTP Error: ${response.status()} ${response.url()}`);
  }
});
```

---

## Configuration des tests

### 1. Structure des tests

```
tests/
├── setup/
│   ├── fixtures.ts      # Fixtures personnalisées
│   └── global.setup.ts  # Setup global
├── e2e/
│   ├── home.test.ts     # Tests de la page d'accueil
│   ├── auth.test.ts     # Tests d'authentification
│   ├── articles.test.ts # Tests des articles
│   ├── admin.test.ts    # Tests admin
│   └── responsive.test.ts # Tests de responsivité
└── components/
    ├── header.test.ts   # Tests du composant header
    └── article.test.ts  # Tests du composant article
```

### 2. Fixtures personnalisées

Le fichier `tests/setup/fixtures.ts` fournit :
- Page avec viewport standard
- Configuration par défaut
- Mocks d'API
- Gestion des erreurs

### 3. Configuration avancée

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
```

---

## Capacités de tests

### 1. Tests de l'interface utilisateur

**Tests de base :**
- Navigation entre pages
- Affichage des composants
- Interaction avec les formulaires
- Validation des messages

**Exemple de test UI :**
```typescript
import { test, expect } from '../setup/fixtures';

test.describe('Page d\'accueil', () => {
  test('devrait afficher le header et le footer', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier le header
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    
    // Vérifier le footer
    await expect(page.locator('footer')).toBeVisible();
    
    // Vérifier le contenu principal
    await expect(page.locator('main')).toBeVisible();
  });
});
```

### 2. Tests de création d'articles

**Capacités testées :**
- Éditeur de contenu riche
- Upload d'images
- Enregistrement et publication
- Validation des métadonnées

**Exemple de test d'article :**
```typescript
test.describe('Création d\'article', () => {
  test('devrait permettre de créer un nouvel article', async ({ page }) => {
    await page.goto('/admin/articles/new');
    
    // Remplir le formulaire
    await page.fill('#title', 'Mon nouvel article');
    await page.fill('#slug', 'mon-nouvel-article');
    await page.fill('#summary', 'Résumé de l\'article');
    
    // Ajouter du contenu
    await page.click('.editor-toolbar [data-action="bold"]');
    await page.fill('.editor-content', 'Contenu de l\'article...');
    
    // Upload d'image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-image.jpg');
    
    // Publier
    await page.click('button[type="submit"]');
    
    // Vérifier la confirmation
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page).toHaveURL(/\/articles\/mon-nouvel-article/);
  });
});
```

### 3. Tests d'authentification

**Capacités testées :**
- Connexion et déconnexion
- Gestion des erreurs
- Redirections
- Sessions persistantes

**Exemple de test d'authentification :**
```typescript
test.describe('Authentification', () => {
  test('devrait permettre de se connecter', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('.user-menu')).toBeVisible();
  });

  test('devrait afficher une erreur pour de mauvaises identifiants', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#email', 'wrong@example.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toHaveText('Email ou mot de passe incorrect');
  });
});
```

### 4. Tests de gestion des médias

**Capacités testées :**
- Upload et gestion de fichiers
- Gallerie médias
- Optimisation d'images
- Droits d'accès

### 5. Tests de responsivité

**Capacités testées :**
- Design mobile-first
- Breakpoints CSS
- Composants adaptatifs
- Performance mobile

**Exemple de test responsive :**
```typescript
test.describe('Tests responsifs', () => {
  test('devrait s\'adapter au mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Vérifier le menu burger
    await expect(page.locator('.mobile-menu-button')).toBeVisible();
    
    // Vérifier le layout mobile
    await expect(page.locator('.mobile-layout')).toBeVisible();
  });

  test('devrait s\'adapter au desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Vérifier le menu desktop
    await expect(page.locator('.desktop-menu')).toBeVisible();
    
    // Vérifier le layout desktop
    await expect(page.locator('.desktop-layout')).toBeVisible();
  });
});
```

---

## Exemples de tests

### 1. Tests de la page d'accueil

```typescript
// tests/e2e/home.test.ts
import { test, expect } from '../setup/fixtures';

test.describe('Page d\'accueil', () => {
  test('devrait afficher les articles récents', async ({ page }) => {
    await page.goto('/');
    
    // Attendre le chargement des articles
    await page.waitForSelector('.article-card', { timeout: 10000 });
    
    // Vérifier qu'il y a des articles
    const articleCount = await page.locator('.article-card').count();
    expect(articleCount).toBeGreaterThan(0);
    
    // Vérifier la structure d'un article
    const firstArticle = page.locator('.article-card').first();
    await expect(firstArticle.locator('h2')).toBeVisible();
    await expect(firstArticle.locator('img')).toBeVisible();
    await expect(firstArticle.locator('.article-summary')).toBeVisible();
    await expect(firstArticle.locator('.read-more')).toBeVisible();
  });

  test('devrait permettre de filtrer par catégorie', async ({ page }) => {
    await page.goto('/');
    
    // Cliquer sur une catégorie
    await page.click('.category-filter[data-category="culte"]');
    
    // Vérifier que les articles sont filtrés
    await expect(page.locator('.article-card')).toBeVisible();
    const articles = await page.locator('.article-card').count();
    expect(articles).toBeGreaterThan(0);
  });

  test('devrait permettre de rechercher des articles', async ({ page }) => {
    await page.goto('/');
    
    // Remplir le champ de recherche
    await page.fill('.search-input', 'culte');
    await page.click('.search-button');
    
    // Attendre les résultats
    await page.waitForSelector('.search-results');
    
    // Vérifier les résultats
    await expect(page.locator('.search-results')).toBeVisible();
    await expect(page.locator('.search-results-title')).toBeVisible();
  });
});
```

### 2. Tests de création d'article

```typescript
// tests/e2e/articles.test.ts
import { test, expect } from '../setup/fixtures';

test.describe('Gestion des articles', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter en admin
    await page.goto('/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('devrait créer un nouvel article', async ({ page }) => {
    await page.goto('/admin/articles/new');
    
    // Remplir le formulaire
    await page.fill('#title', 'Test Article');
    await page.fill('#slug', 'test-article');
    await page.fill('#summary', 'Ceci est un test');
    await page.fill('#content', 'Contenu de test avec **gras** et *italique*');
    
    // Ajouter une image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-image.jpg');
    
    // Publier
    await page.click('button[type="submit"]');
    
    // Vérifier la redirection
    await expect(page).toHaveURL(/\/articles\/test-article/);
    await expect(page.locator('.article-title')).toHaveText('Test Article');
  });

  test('devrait valider le formulaire', async ({ page }) => {
    await page.goto('/admin/articles/new');
    
    // Tenter de soumettre sans remplir les champs requis
    await page.click('button[type="submit"]');
    
    // Vérifier les messages d'erreur
    await expect(page.locator('.error-title')).toBeVisible();
    await expect(page.locator('.error-slug')).toBeVisible();
  });

  test('devrait éditer un article existant', async ({ page }) => {
    // Aller à un article existant
    await page.goto('/articles/exemple');
    
    // Cliquer sur modifier
    await page.click('.edit-button');
    
    // Modifier le contenu
    await page.fill('#title', 'Article modifié');
    await page.click('button[type="submit"]');
    
    // Vérifier les modifications
    await expect(page).toHaveURL(/\/articles\/exemple/);
    await expect(page.locator('.article-title')).toHaveText('Article modifié');
  });
});
```

### 3. Tests d'authentification

```typescript
// tests/e2e/auth.test.ts
import { test, expect } from '../setup/fixtures';

test.describe('Authentification', () => {
  test('devrait se connecter avec succès', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('.user-menu')).toBeVisible();
    await expect(page.locator('.welcome-message')).toHaveText('Bienvenue, Admin');
  });

  test('devrait gérer une connexion invalide', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#email', 'wrong@example.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toHaveText('Email ou mot de passe incorrect');
    await expect(page).toHaveURL('/login');
  });

  test('devrait se déconnecter', async ({ page }) => {
    // Se connecter d'abord
    await page.goto('/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    // Se déconnecter
    await page.click('.user-menu');
    await page.click('.logout-button');
    
    await expect(page).toHaveURL('/login');
    await expect(page.locator('.login-form')).toBeVisible();
  });

  test('devrait rediriger vers le dashboard après connexion', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Devrait être redirigé vers la page de connexion
    await expect(page).toHaveURL('/login');
    
    // Se connecter
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    // Maintenant devrait être sur le dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});
```

### 4. Tests de la galerie média

```typescript
// tests/e2e/media.test.ts
import { test, expect } from '../setup/fixtures';

test.describe('Gestion des médias', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter en admin
    await page.goto('/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
  });

  test('devrait afficher la galerie média', async ({ page }) => {
    await page.goto('/admin/media');
    
    await expect(page.locator('.media-gallery')).toBeVisible();
    await expect(page.locator('.upload-button')).toBeVisible();
    
    // Vérifier les statistiques
    await expect(page.locator('.media-stats')).toBeVisible();
  });

  test('devrait uploader une image', async ({ page }) => {
    await page.goto('/admin/media');
    
    // Cliquer sur uploader
    await page.click('.upload-button');
    
    // Sélectionner un fichier
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-image.jpg');
    
    // Attendre l'upload
    await page.waitForSelector('.upload-progress', { state: 'hidden' });
    
    // Vérifier que l'image est dans la galerie
    await expect(page.locator('.media-item img')).toBeVisible();
  });

  test('devrait permettre de supprimer un média', async ({ page }) => {
    await page.goto('/admin/media');
    
    // Trouver un média et cliquer sur supprimer
    await page.click('.media-item .delete-button');
    
    // Confirmer la suppression
    await page.click('.confirm-delete');
    
    // Vérifier que le média est supprimé
    await expect(page.locator('.media-item')).not.toBeVisible();
  });
});
```

### 5. Tests de responsivité

```typescript
// tests/e2e/responsive.test.ts
import { test, expect } from '../setup/fixtures';

test.describe('Tests responsifs', () => {
  test('page d\'accueil sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Vérifier le menu mobile
    await expect(page.locator('.mobile-menu-button')).toBeVisible();
    await expect(page.locator('.mobile-menu')).not.toBeVisible();
    
    // Ouvrir le menu
    await page.click('.mobile-menu-button');
    await expect(page.locator('.mobile-menu')).toBeVisible();
    
    // Vérifier le layout mobile
    await expect(page.locator('.mobile-layout')).toBeVisible();
    await expect(page.locator('.article-card-mobile')).toBeVisible();
  });

  test('page d\'accueil sur tablette', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Vérifier le layout tablette
    await expect(page.locator('.tablet-layout')).toBeVisible();
    await expect(page.locator('.article-card-tablet')).toBeVisible();
    
    // Vérifier le menu responsive
    await expect(page.locator('.responsive-menu')).toBeVisible();
  });

  test('page d\'accueil sur desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Vérifier le layout desktop
    await expect(page.locator('.desktop-layout')).toBeVisible();
    await expect(page.locator('.article-card-desktop')).toBeVisible();
    
    // Vérifier le menu desktop
    await expect(page.locator('.desktop-menu')).toBeVisible();
    await expect(page.locator('.search-bar-desktop')).toBeVisible();
  });

  test('navigation responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Tester la navigation mobile
    await page.click('.mobile-menu-button');
    await page.click('.mobile-menu .nav-link');
    
    // Vérifier la navigation
    await expect(page).toHaveURL(/\/[a-z]+/);
  });
});
```

---

## Bonnes pratiques

### 1. Organisation des tests

- Utilisez des fichiers de test logiquement organisés
- Utilisez des descriptions claires avec `test.describe()`
- Utilisez des noms de test descriptifs
- Groupez les tests par fonctionnalité

### 2. Gestion des données

- Utilisez des fixtures pour les données de test
- Nettoyez les données après chaque test
- Utilisez des données cohérentes et prévisibles
- Évitez de dépendre de données externes

### 3. Performance

- Utilisez `waitForLoadState()` pour attendre le chargement complet
- Évitez les délais fixes (`setTimeout`)
- Utilisez `waitForSelector()` pour attendre des éléments spécifiques
- Désactivez les animations pendant les tests si nécessaire

### 4. Débogage

- Utilisez `--headed` pour voir le navigateur en action
- Utilisez `--debug` pour le mode debug avec breakpoints
- Utilisez `--trace` pour enregistrer les traces
- Utilisez les rapports HTML pour l'analyse

### 5. Intégration CI/CD

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: npx playwright install --with-deps
      - run: pnpm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### 6. Maintenance

- Mettez à jour Playwright régulièrement
- Nettoyez les snapshots inutiles
- Mettez à jour les tests quand l'UI change
- Documentez les tests complexes

---

## Ressources utiles

- [Documentation Playwright](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Testing Library](https://testing-library.com/docs/playwright-testing-library/)
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)

Ce guide vous aidera à mettre en place une suite de tests complète pour votre plateforme média G12 Paris. Adaptez les exemples en fonction de vos besoins spécifiques.