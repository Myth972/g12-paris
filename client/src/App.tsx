import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import { Loader2 } from "lucide-react";

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
const BibliothequeePage = lazy(() => import("./pages/BibliothequeePage"));
const CulteEnLignePage = lazy(() => import("./pages/CulteEnLignePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

import { AISearch } from "./components/AISearch";

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
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <AISearch />
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
            <BibliothequeePage />
          </PublicLayout>
        </Route>
        <Route path="/culte-en-ligne">
          <PublicLayout>
            <CulteEnLignePage />
          </PublicLayout>
        </Route>
        <Route path="/login" component={Login} />

        {/* Admin routes (no public layout) */}
        <Route path="/admin" component={Admin} />
        <Route path="/admin/article/:id" component={ArticleEditor} />
        <Route path="/admin/tutorial" component={AdminTutorial} />

        {/* Fallback */}
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
