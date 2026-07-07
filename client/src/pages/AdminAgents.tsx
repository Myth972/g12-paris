import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import AgentDashboard from "@/components/AgentDashboard";
import { ArrowLeft, Bot } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminAgents() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (user?.role !== "admin") {
    return (
      <div className="container py-8 text-center text-muted-foreground">
        Accès réservé aux administrateurs.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")} aria-label="Retour">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-serif font-bold flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                Agents
              </h1>
              <p className="text-sm text-muted-foreground">
                Gérer et exécuter les agents automatisés
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="container py-8 max-w-4xl">
        <AgentDashboard />
      </div>
    </div>
  );
}
