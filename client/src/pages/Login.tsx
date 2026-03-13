import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Shield, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Login() {
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { user, refresh } = useAuth();
  
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      toast.success("Connexion réussie");
      await refresh();
      setLocation("/admin");
    },
    onError: (error) => {
      toast.error(error.message || "Échec de la connexion");
    },
  });

  // If already logged in, redirect to admin
  if (user) {
    setLocation("/admin");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Veuillez saisir le mot de passe");
      return;
    }
    loginMutation.mutate({ password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-border">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-serif font-bold">Administration</CardTitle>
          <CardDescription>
            Saisissez le mot de passe pour accéder au tableau de bord.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Connexion..." : "Se connecter"}
            </Button>
            <Button 
                type="button" 
                variant="ghost" 
                className="w-full"
                onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au site
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
