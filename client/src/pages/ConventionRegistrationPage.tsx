import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const STORAGE_KEY = "g12_convention_registered";

export default function ConventionRegistrationPage() {
  const [, navigate] = useLocation();
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const registrationEnabled = settingsQuery.data?.["convention.registrationEnabled"] === "true";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (settingsQuery.data && !registrationEnabled) {
      navigate("/culte-en-ligne/convention");
    }
  }, [settingsQuery.data, registrationEnabled, navigate]);

  useEffect(() => {
    const registered = localStorage.getItem(STORAGE_KEY);
    if (registered) {
      navigate("/culte-en-ligne/convention");
    }
  }, [navigate]);

  const registerMutation = trpc.conventionRegistrations.create.useMutation({
    onSuccess: (data) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        email: data.registration.email,
        firstName: data.registration.firstName,
        lastName: data.registration.lastName,
        registeredAt: new Date().toISOString(),
      }));
      setSubmitted(true);
      toast.success("Inscription réussie !");
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de l'inscription");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    registerMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold font-serif mb-2">Inscription réussie !</h2>
            <p className="text-muted-foreground mb-6">
              Merci {firstName} ! Vous pouvez maintenant accéder à la Convention G12 France.
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link href="/culte-en-ligne/convention">
                Accéder à la Convention
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (settingsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-serif">Inscription Convention G12 France</CardTitle>
          <CardDescription>
            Inscrivez-vous pour accéder au direct et à tous les contenus de la convention.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-firstname">Prénom</Label>
              <Input
                id="reg-firstname"
                placeholder="Votre prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-lastname">Nom</Label>
              <Input
                id="reg-lastname"
                placeholder="Votre nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Inscription en cours...
                </>
              ) : (
                "S'inscrire"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/culte-en-ligne" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              Retour au Culte en ligne
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
