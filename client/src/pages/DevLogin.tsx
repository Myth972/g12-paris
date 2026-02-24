import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function DevLogin() {
    const [, setLocation] = useLocation();
    const [loading, setLoading] = useState<string | null>(null);

    const handleLogin = async (role: "admin" | "user") => {
        setLoading(role);
        try {
            const res = await fetch("/api/dev/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role }),
            });

            if (!res.ok) throw new Error("Login failed");

            toast.success(`Connecté en tant que ${role}`);

            // Force reload to refresh auth state
            window.location.href = role === "admin" ? "/admin" : "/";
        } catch (error) {
            toast.error("Erreur de connexion");
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-serif">Mode Développement</CardTitle>
                    <CardDescription>
                        Connectez-vous rapidement sans passer par OAuth.
                        <br />
                        <span className="text-xs text-muted-foreground bg-accent/50 px-2 py-0.5 rounded mt-2 inline-block">
                            Uniquement disponible en local
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        className="w-full h-14 text-lg gap-3"
                        onClick={() => handleLogin("admin")}
                        disabled={!!loading}
                        variant="default"
                    >
                        <Shield className="w-6 h-6" />
                        Connexion Admin
                    </Button>

                    <Button
                        className="w-full h-14 text-lg gap-3"
                        onClick={() => handleLogin("user")}
                        disabled={!!loading}
                        variant="secondary"
                    >
                        <User className="w-6 h-6" />
                        Connexion Utilisateur
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
