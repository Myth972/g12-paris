import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import Home from "./pages/Home";
import ArticleDetail from "./pages/ArticleDetail";
import CategoryPage from "./pages/CategoryPage";
import Admin from "./pages/Admin";
import ArticleEditor from "./pages/ArticleEditor";
import PublicationDuJour from "./pages/PublicationDuJour";
import GalleriesPage from "./pages/GalleriesPage";
import Login from "./pages/Login";
import AdminTutorial from "./pages/AdminTutorial";
import BibliothequeePage from "./pages/BibliothequeePage";
import CulteEnLignePage from "./pages/CulteEnLignePage";
import { SpeedInsights } from "@vercel/speed-insights/react";

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
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <SpeedInsights />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
