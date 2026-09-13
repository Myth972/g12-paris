import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, ShieldCheck } from "lucide-react";
import { Link, useSearch } from "wouter";

export default function ConventionVerifyPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialCode = params.get("code") || "";

  const [code, setCode] = useState(initialCode);
  const [query, setQuery] = useState(initialCode);

  const verifyQuery = trpc.conventionRegistrations.verifyCode.useQuery(
    { code: query },
    { enabled: query.length === 7 }
  );

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length === 7) {
      setQuery(code.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-2" />
          <CardTitle className="text-2xl font-serif">Vérification d'inscription</CardTitle>
          <CardDescription>
            Entrez votre code à 7 caractères pour vérifier votre inscription à la Convention G12 France.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verify-code">Code d'inscription</Label>
              <Input
                id="verify-code"
                placeholder="ABCD123"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 7))}
                maxLength={7}
                className="text-center text-lg font-mono tracking-[0.2em] uppercase"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={code.length !== 7}
            >
              Vérifier
            </Button>
          </form>

          {query.length === 7 && verifyQuery.isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {query.length === 7 && verifyQuery.data && (
            <div className={`flex items-center gap-3 p-4 rounded-lg ${verifyQuery.data.valid ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-destructive/10 border border-destructive/30"}`}>
              {verifyQuery.data.valid ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-700 dark:text-emerald-400">Inscription valide</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-500">
                      {verifyQuery.data.registration?.firstName} {verifyQuery.data.registration?.lastName}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-destructive shrink-0" />
                  <div>
                    <p className="font-bold text-destructive">Code invalide</p>
                    <p className="text-sm text-muted-foreground">
                      Ce code ne correspond à aucune inscription.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="text-center pt-2">
            <Link href="/culte-en-ligne/convention" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              Retour à la Convention
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
