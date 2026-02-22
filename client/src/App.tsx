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
import NotificationBanner from "./components/NotificationBanner";

const Home = lazy(() => import("./pages/Home"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const Admin = lazy(() => import("./pages/Admin"));
const ArticleEditor = lazy(() => import("./pages/ArticleEditor"));
const Publications = lazy(() => import("./pages/Publications"));
const Galeries = lazy(() => import("./pages/Galeries"));
const CulteEnLigne = lazy(() => import("./pages/CulteEnLigne"));
const Bibliotheque = lazy(() => import("./pages/Bibliotheque"));
const Actualites = lazy(() => import("./pages/Actualites"));
const Login = lazy(() => import("./pages/Login"));
const DevLogin = lazy(() => import("./pages/DevLogin"));

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <NotificationBanner />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/article/:slug" component={ArticleDetail} />
      <Route path="/category/:category" component={CategoryPage} />
      <Route path="/publications" component={Publications} />
      <Route path="/actualites" component={Actualites} />
      <Route path="/galeries" component={Galeries} />
      <Route path="/culte-en-ligne" component={CulteEnLigne} />
      <Route path="/bibliotheque" component={Bibliotheque} />

      {/* Auth routes */}
      <Route path="/login" component={Login} />
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
    <Suspense fallback={<div>Chargement...</div>}>
      <HelmetProvider>
        <ThemeProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <PublicLayout>
                <Router />
              </PublicLayout>
              <Toaster />
            </ErrorBoundary>
          </TooltipProvider>
        </ThemeProvider>
      </HelmetProvider>
    </Suspense>
  );
}

export default App;