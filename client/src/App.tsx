import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { Route, Switch } from "wouter";
import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import { Loader2 } from "lucide-react";
import PageTransition from "./components/PageTransition";
import GlowCursor from "./components/GlowCursor";
import { AudioPlayerProvider } from "./contexts/AudioPlayerContext";
import FloatingAudioPlayer from "./components/FloatingAudioPlayer";

// Lazy-loaded pages
const Home = lazy(() => import("./pages/Home"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const Admin = lazy(() => import("./pages/Admin"));
const ArticleEditor = lazy(() => import("./pages/ArticleEditor"));
const PublicationDuJour = lazy(() => import("./pages/PublicationDuJour"));
const GalleriesPage = lazy(() => import("./pages/GalleriesPage"));
const Login = lazy(() => import("./pages/Login"));
const AdminTutorial = lazy(() => import("./pages/AdminTutorial"));
const BibliothequePage = lazy(() => import("./pages/BibliothequePage"));
const CataloguePage = lazy(() => import("./pages/CataloguePage"));
const PremiumBookPage = lazy(() => import("./pages/PremiumBookPage"));
const StudiesResourcesPage = lazy(() => import("./pages/StudiesResourcesPage"));
const BiblicalThemesPage = lazy(() => import("./pages/BiblicalThemesPage"));
const OffersPacksPage = lazy(() => import("./pages/OffersPacksPage"));
const AboutVisionPage = lazy(() => import("./pages/AboutVisionPage"));
const CartCheckoutPage = lazy(() => import("./pages/CartCheckoutPage"));
const CulteEnLignePage = lazy(() => import("./pages/CulteEnLignePage"));
const ConventionG12FrancePage = lazy(() => import("./pages/ConventionG12FrancePage"));
const ConventionRegistrationPage = lazy(() => import("./pages/ConventionRegistrationPage"));
const AdminBibliotheque = lazy(() => import("./pages/AdminBibliotheque"));
const AdminBibliothequeEditor = lazy(() => import("./pages/AdminBibliothequeEditor"));
const AdminDesign = lazy(() => import("./pages/AdminDesign"));
const AdminVisuals = lazy(() => import("./pages/AdminVisuals"));
const AdminAgents = lazy(() => import("./pages/AdminAgents"));
const AIArticleWriter = lazy(() => import("./pages/AIArticleWriter"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AISearch = lazy(() => import("./components/AISearch").then(m => ({ default: m.AISearch })));
const ChatBot = lazy(() => import("./components/ChatBot").then(m => ({ default: m.ChatBot })));
const MoJSTestPage = lazy(() => import("./pages/MoJSTestPage"));
const ILoveYouJesus = lazy(() => import("./pages/ILoveYouJesus"));
const ArticleDesignDemo = lazy(() => import("./pages/ArticleDesignDemo"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
    </div>
  );
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter />
      <Suspense fallback={null}>
        <AISearch />
        <ChatBot />
      </Suspense>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public routes */}
        <Route path="/">
          <PublicLayout>
            <Home />
          </PublicLayout>
        </Route>
        <Route path="/article/:slug">
          <PublicLayout>
            <ArticleDetail />
          </PublicLayout>
        </Route>
        <Route path="/categorie/:category">
          <PublicLayout>
            <CategoryPage />
          </PublicLayout>
        </Route>
        <Route path="/publication-du-jour">
          <PublicLayout>
            <PublicationDuJour />
          </PublicLayout>
        </Route>
        <Route path="/galeries">
          <PublicLayout>
            <GalleriesPage />
          </PublicLayout>
        </Route>
        <Route path="/bibliotheque">
          <PublicLayout>
            <BibliothequePage />
          </PublicLayout>
        </Route>
        <Route path="/bibliotheque/catalogue">
          <PublicLayout>
            <CataloguePage />
          </PublicLayout>
        </Route>
        <Route path="/bibliotheque/livre/:id">
          <PublicLayout>
            <PremiumBookPage />
          </PublicLayout>
        </Route>
        <Route path="/bibliotheque/etude">
          <PublicLayout>
            <StudiesResourcesPage />
          </PublicLayout>
        </Route>
        <Route path="/bibliotheque/themes">
          <PublicLayout>
            <BiblicalThemesPage />
          </PublicLayout>
        </Route>
        <Route path="/bibliotheque/offres">
          <PublicLayout>
            <OffersPacksPage />
          </PublicLayout>
        </Route>
        <Route path="/bibliotheque/vision">
          <PublicLayout>
            <AboutVisionPage />
          </PublicLayout>
        </Route>
        <Route path="/panier">
          <PublicLayout>
            <CartCheckoutPage />
          </PublicLayout>
        </Route>
        <Route path="/culte-en-ligne/convention">
          <PublicLayout>
            <ConventionG12FrancePage />
          </PublicLayout>
        </Route>
        <Route path="/inscription-convention">
          <ConventionRegistrationPage />
        </Route>
        <Route path="/culte-en-ligne">
          <PublicLayout>
            <CulteEnLignePage />
          </PublicLayout>
        </Route>
        <Route path="/test-mojs">
          <PublicLayout>
            <MoJSTestPage />
          </PublicLayout>
        </Route>
        <Route path="/article-design-demo">
          <PublicLayout>
            <ArticleDesignDemo />
          </PublicLayout>
        </Route>
        <Route path="/iloveyoujesus">
          <ILoveYouJesus />
        </Route>
        <Route path="/login" component={Login} />

        {/* Admin routes (no public layout) */}
        <Route path="/admin" component={Admin} />
        <Route path="/admin/profile" component={ProfilePage} />
        <Route path="/admin/article/:id" component={ArticleEditor} />
        <Route path="/admin/tutorial" component={AdminTutorial} />
        <Route path="/admin/bibliotheque" component={AdminBibliotheque} />
        <Route path="/admin/bibliotheque/edition/:id" component={AdminBibliothequeEditor} />
        <Route path="/admin/design" component={AdminDesign} />
        <Route path="/admin/visuals" component={AdminVisuals} />
        <Route path="/admin/agents" component={AdminAgents} />
        <Route path="/admin/ai-writer" component={AIArticleWriter} />

        {/* Fallback */}
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function DynamicDesign() {
  const { data: settings } = trpc.siteSettings.getAll.useQuery();
  if (!settings) return null;

  const primary = settings["design.primaryColor"] as string;
  const secondary = settings["design.secondaryColor"] as string;
  const bg = settings["design.bgColor"] as string;
  const fontHeading = settings["design.fontHeading"] as string;
  const fontBody = settings["design.fontBody"] as string;
  const buttonStyle = settings["design.buttonStyle"] as string;
  const cardStyle = settings["design.cardStyle"] as string;
  const textColor = settings["design.textColor"] as string;
  const mutedTextColor = settings["design.mutedTextColor"] as string;
  
  const headingFamily = fontHeading === 'playfair' ? '"Playfair Display", serif' : fontHeading === 'merriweather' ? 'Merriweather, serif' : 'Lora, serif';
  const bodyFamily = fontBody === 'inter' ? 'Inter, sans-serif' : fontBody === 'roboto' ? 'Roboto, sans-serif' : 'Lato, sans-serif';

  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        :root:not(.dark) {
          ${primary ? `--primary: ${primary} !important;` : ''}
          ${secondary ? `--secondary: ${secondary} !important;` : ''}
          ${bg ? `--background: ${bg} !important;` : ''}
        }
        ${textColor ? `:root:not(.dark) body, :root:not(.dark) .text-foreground, :root:not(.dark) .text-card-foreground, :root:not(.dark) h1, :root:not(.dark) h2, :root:not(.dark) h3, :root:not(.dark) h4, :root:not(.dark) h5, :root:not(.dark) h6, :root:not(.dark) nav a, :root:not(.dark) p:not(.text-muted-foreground):not(:is(.text-primary-foreground *, .bg-primary *)) { color: ${textColor} !important; }` : ''}
        ${mutedTextColor ? `:root:not(.dark) .text-muted-foreground { color: ${mutedTextColor} !important; }` : ''}
        ${fontHeading ? `h1, h2, h3, h4, h5, h6, .font-serif { font-family: ${headingFamily} !important; }` : ''}
        ${fontBody ? `body, .font-sans { font-family: ${bodyFamily} !important; }` : ''}
        
        ${buttonStyle === 'square' ? '[data-slot="button"], button, .btn { border-radius: 0px !important; }' : ''}
        ${buttonStyle === 'pill' ? '[data-slot="button"], button, .btn { border-radius: 9999px !important; }' : ''}
        
        ${cardStyle === 'shadow' ? '.bg-card { border-color: transparent !important; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) !important; }' : ''}
      `
    }} />
  );
}

function AppWithTheme() {
  const { data: settings } = trpc.siteSettings.getAll.useQuery();
  const enableThemeToggle = settings?.["design.enableThemeToggle"] === "true";
  const defaultTheme = (settings?.["design.defaultTheme"] as "light" | "dark") || "light";

  // Toggle de test local uniquement — fichier hors git, jamais résolu par le bundler
  const [DevDeviceToggle, setDevDeviceToggle] = useState<ComponentType | null>(null);
  useEffect(() => {
    if (import.meta.env.DEV) {
      const devTogglePath = "/src/components/DevDeviceToggle.tsx";
      import(/* @vite-ignore */ devTogglePath)
        .then(m => setDevDeviceToggle(() => m.default))
        .catch(() => {});
    }
  }, []);

  return (
    <ThemeProvider defaultTheme={defaultTheme} switchable={enableThemeToggle}>
      <DynamicDesign />
      <TooltipProvider>
        <AudioPlayerProvider>
          <GlowCursor />
          <Toaster />
          <Router />
          <FloatingAudioPlayer />
          {DevDeviceToggle && <DevDeviceToggle />}
        </AudioPlayerProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppWithTheme />
    </ErrorBoundary>
  );
}

export default App;
