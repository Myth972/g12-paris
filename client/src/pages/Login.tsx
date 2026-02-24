import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User, LogIn, Info, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Login() {
    const [, setLocation] = useLocation();
    const { isAuthenticated } = useAuth();
    const [devLoading, setDevLoading] = useState<string | null>(null);

    // If already authenticated, redirect to home or admin
    if (isAuthenticated) {
        setLocation("/");
        return null;
    }

    const handleDevLogin = async (role: "admin" | "user") => {
        setDevLoading(role);
        try {
            const res = await fetch("/api/dev/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role }),
            });

            if (!res.ok) throw new Error("Login failed");

            toast.success(`Connecté en tant que ${role} (Développement)`);
            window.location.href = role === "admin" ? "/admin" : "/";
        } catch (error) {
            toast.error("Erreur de connexion de test");
            setDevLoading(null);
        }
    };

    return (
        <div className="min-h-[calc(100-rem)] flex items-center justify-center bg-secondary/20 p-4 py-20">
            <div className="w-full max-w-md space-y-8">
                {/* Logo and Intro */}
                <div className="text-center space-y-4">
                    <div className="inline-flex w-16 h-16 rounded-2xl bg-primary items-center justify-center shadow-lg shadow-primary/20">
                        <LogIn className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-foreground">G12 Paris</h1>
                        <p className="text-muted-foreground font-sans uppercase tracking-widest text-xs mt-1">Espace Membre</p>
                    </div>
                </div>

                <Card className="border-none shadow-xl shadow-foreground/5">
                    <CardHeader>
                        <CardTitle className="text-xl">Connexion</CardTitle>
                        <CardDescription>
                            Accédez à votre espace personnalisé et aux contenus exclusifs de G12 Paris.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Button
                            className="w-full h-12 text-md gap-3 bg-primary hover:bg-primary/90 shadow-md transition-all active:scale-[0.98]"
                            onClick={() => (window.location.href = getLoginUrl())}
                        >
                            <LogIn className="w-5 h-5" />
                            Se connecter via le Portail
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground font-medium">À propos</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex gap-3 text-sm text-muted-foreground">
                                <div className="mt-0.5"><Info className="w-4 h-4 text-primary" /></div>
                                <p>Vos identifiants sont gérés de manière sécurisée par notre portail centralisé.</p>
                            </div>
                            <div className="flex gap-3 text-sm text-muted-foreground">
                                <div className="mt-0.5"><Shield className="w-4 h-4 text-primary" /></div>
                                <p>Accédez aux outils d'édition si vous êtes administrateur.</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col border-t border-border/40 pt-6">
                        <p className="text-xs text-center text-muted-foreground">
                            En vous connectant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
                        </p>
                    </CardFooter>
                </Card>

                {/* Development Mode Access */}
                {import.meta.env.DEV && (
                    <Card className="border-dashed border-2 bg-accent/30 border-accent-foreground/20">
                        <CardHeader className="py-4">
                            <div className="flex items-center gap-2 text-accent-foreground/70">
                                <AlertCircle className="w-4 h-4" />
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider">Mode Développeur</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-3 pb-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDevLogin("admin")}
                                disabled={!!devLoading}
                                className="h-10 gap-2 border-accent-foreground/10 hover:bg-accent/50"
                            >
                                <Shield className="w-4 h-4" />
                                Admin
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDevLogin("user")}
                                disabled={!!devLoading}
                                className="h-10 gap-2 border-accent-foreground/10 hover:bg-accent/50"
                            >
                                <User className="w-4 h-4" />
                                Utilisateur
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
