import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, ArrowLeft, Ticket, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import QRCode from "qrcode";
import { useAuth } from "@/_core/hooks/useAuth";


export default function ConventionRegistrationPage() {
  const [, navigate] = useLocation();
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const registrationEnabled = settingsQuery.data?.["convention.registrationEnabled"] === "true";
  const publicCountQuery = trpc.conventionRegistrations.publicCount.useQuery();
  const registrationCount = publicCountQuery.data ?? 0;
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    if (settingsQuery.data && !registrationEnabled && !isAdmin) {
      navigate("/culte-en-ligne/convention");
    }
  }, [settingsQuery.data, registrationEnabled, navigate, isAdmin]);

  // localStorage check removed — doublon géré côté serveur (alreadyRegistered)

  const registerMutation = trpc.conventionRegistrations.create.useMutation({
    onSuccess: (data) => {
      if (data.registration.ticketCode) {
        QRCode.toDataURL(
          `https://g12parismedia.com/convention/verify?code=${data.registration.ticketCode}`,
          { width: 200, margin: 2, color: { dark: "#1e293b", light: "#ffffff" } }
        ).then(setQrUrl).catch(() => {});
      }
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
    const ticketCode = registerMutation.data?.registration?.ticketCode;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold font-serif mb-2">Inscription réussie !</h2>
            <p className="text-muted-foreground mb-4">
              Merci {firstName} ! Votre code d'inscription :
            </p>
            {ticketCode && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 mb-4">
                <p className="text-2xl font-mono font-bold tracking-[0.3em] text-primary">{ticketCode}</p>
                <p className="text-xs text-muted-foreground mt-1">Conservez ce code, il vous sera demandé à l'entrée</p>
              </div>
            )}
            {qrUrl && (
              <div className="flex justify-center mb-4">
                <img src={qrUrl} alt="QR Code" className="rounded-lg border" />
              </div>
            )}
            <div className="space-y-3">
              <Button asChild size="lg" className="gap-2 w-full">
                <a href={`https://www.helloasso.com/associations/mci-lyon/evenements/convention-g12-france-2026?ticketCode=${ticketCode || ""}`} target="_blank" rel="noopener noreferrer">
                  <Ticket className="w-4 h-4" />
                  Acheter mes billets sur HelloAsso
                </a>
              </Button>
              <Button asChild size="lg" className="gap-2 w-full">
                <Link href={`/convention/verify?code=${ticketCode || ""}`}>
                  Accéder à la Convention
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (settingsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-serif">Inscription Convention G12 France</CardTitle>
          <CardDescription>
            Inscrivez-vous pour accéder au direct et à tous les contenus de la convention.
          </CardDescription>
          {registrationCount > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
              <Users className="w-4 h-4" />
              <span>{registrationCount} personne{registrationCount > 1 ? "s" : ""} déjà inscrite{registrationCount > 1 ? "s" : ""}</span>
            </div>
          )}
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
          <div className="mt-4 space-y-3">
            <Button asChild variant="outline" size="lg" className="gap-2 w-full">
              <Link href="/convention/verify">
                Déjà inscrit ? Vérifier mon code
              </Link>
            </Button>
            <div className="text-center">
              <Link href="/culte-en-ligne" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" />
                Retour au Culte en ligne
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
