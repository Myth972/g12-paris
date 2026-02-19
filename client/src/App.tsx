import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";

const Home = lazy(() => import("./pages/Home"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const Admin = lazy(() => import("./pages/Admin"));
const ArticleEditor = lazy(() => import("./pages/ArticleEditor"));
const Publications = lazy(() => import("./pages/Publications"));
const Galeries = lazy(() => import("./pages/Galeries"));
const DevLogin = lazy(() => import("./pages/DevLogin"));

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

function Router() {
  return (
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
      <Route path="/publications">
        <PublicLayout>
          <Publications />
        </PublicLayout>
      </Route>
      <Route path="/galeries">
        <PublicLayout>
          <Galeries />
        </PublicLayout>
      </Route>

      {/* Dev route */}
      <Route path="/dev-login" component={DevLogin} />

      {/* Admin routes (no public layout) */}
      <Route path="/admin" component={Admin} />
      <Route path="/admin/article/:id" component={ArticleEditor} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <HelmetProvider>
            <Toaster />
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Chargement...</div>}>
              <Router />
            </Suspense>
          </HelmetProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
