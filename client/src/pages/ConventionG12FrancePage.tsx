import { useState, useEffect } from "react";
import PageContentDisplay from "@/components/PageContentDisplay";
import PageTitleEditor from "@/components/PageTitleEditor";
import PageTextEditor from "@/components/PageTextEditor";
import { Reveal } from "@/components/Reveal";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Share2, ExternalLink, Check, Calendar, MapPin, ShieldCheck, Loader2, XCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

const COOKIE_NAME = "g12_convention_verified";
const COOKIE_DAYS = 3;

function setConventionCookie(code: string) {
  const expires = new Date(Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${COOKIE_NAME}=${code};expires=${expires};path=/;SameSite=Lax;Secure`;
}

function getConventionCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function ConventionG12FrancePage() {
  const [, navigate] = useLocation();
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const conventionLogoUrl = (settingsQuery.data?.["convention.logoUrl"] as string) || "https://conventiong12france.com/wp-content/uploads/elementor/thumbs/g12France-rdu8vngvdwatmx6fgxu9wasglsg906xtva9qh3nrls.png";
  const bgUrl = (settingsQuery.data?.["convention.bgUrl"] as string) || "https://conventiong12france.com/wp-content/uploads/2025/10/LHERITAGE-2025-1536x861.png";
  const bgUrlMiddle = (settingsQuery.data?.["convention.bgUrlMiddle"] as string) || "";
  const bgUrlBottom = (settingsQuery.data?.["convention.bgUrlBottom"] as string) || "";
  const primaryColor = settingsQuery.data?.["convention.primaryColor"] as string;
  const showLogoRaw = settingsQuery.data?.["convention.showLogo"] as string | undefined;
  const showOfficialSiteRaw = settingsQuery.data?.["convention.showOfficialSite"] as string | undefined;
  const liveEnabledRaw = settingsQuery.data?.["convention.liveEnabled"] as string | undefined;
  const liveEnabled = liveEnabledRaw === "true";
  const showLogo = showLogoRaw !== "false";
  const showOfficialSite = showOfficialSiteRaw !== "false";
  const showBilingualCTARaw = settingsQuery.data?.["convention.showBilingualCTA"] as string | undefined;
  const showBilingualCTA = showBilingualCTARaw !== "false";
  const youtubeVideoIdRaw = settingsQuery.data?.["convention.youtubeVideoId"] as string | undefined;
  const facebookVideoUrl = settingsQuery.data?.["convention.facebookVideoUrl"] as string | undefined;
  const registrationEnabled = settingsQuery.data?.["convention.registrationEnabled"] === "true";

  // Redirect to registration if enabled (admin bypass)
  useEffect(() => {
    if (settingsQuery.data && registrationEnabled && !isAdmin) {
      navigate("/inscription-convention");
    }
  }, [settingsQuery.data, registrationEnabled, navigate, isAdmin]);

  // --- Code verification state ---
  const [verified, setVerified] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Check cookie on mount
  useEffect(() => {
    if (isAdmin) {
      setVerified(true);
      return;
    }
    const cookieCode = getConventionCookie();
    if (cookieCode) {
      setCode(cookieCode);
      setVerified(true);
    }
  }, [isAdmin]);

  const verifyQuery = trpc.conventionRegistrations.verifyCode.useQuery(
    { code },
    { enabled: false }
  );

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 7) return;
    setVerifying(true);
    setVerifyError("");
    try {
      const result = await verifyQuery.refetch();
      if (result.data?.valid) {
        setConventionCookie(code);
        setVerified(true);
        toast.success("Code vérifié ! Bienvenue à la Convention G12 France.");
      } else {
        const reason = result.data?.reason;
        if (reason === "rate_limit") {
          setVerifyError("Trop de tentatives. Réessayez dans 5 minutes.");
        } else if (reason === "expired") {
          setVerifyError("Ce code a expiré.");
        } else {
          setVerifyError("Code invalide. Vérifiez votre code et réessayez.");
        }
      }
    } catch {
      setVerifyError("Erreur de connexion. Réessayez.");
    } finally {
      setVerifying(false);
    }
  };

  const extractYouTubeId = (input: string | undefined): string | null => {
    if (!input) return null;
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const youtubeVideoId = extractYouTubeId(youtubeVideoIdRaw);
  const [copied, setCopied] = useState(false);
  const [iframeErrored, setIframeErrored] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: "Convention G12 France", url }); } catch {}
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- Code verification form ---
  if (!verified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-2" />
            <CardTitle className="text-2xl font-serif">Convention G12 France</CardTitle>
            <CardDescription>
              Entrez votre code à 7 caractères pour accéder au contenu de la convention.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="conv-code">Code d'accès</Label>
                <Input
                  id="conv-code"
                  placeholder="ABCD123"
                  value={code}
                  onChange={(e) => { setCode(e.target.value.toUpperCase().slice(0, 7)); setVerifyError(""); }}
                  maxLength={7}
                  className="text-center text-lg font-mono tracking-[0.2em] uppercase"
                  autoFocus
                  disabled={verifying}
                />
              </div>
              {verifyError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                  <XCircle className="w-4 h-4 shrink-0" />
                  {verifyError}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={code.length !== 7 || verifying}>
                {verifying ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Vérification...</>
                ) : (
                  "Accéder à la Convention"
                )}
              </Button>
            </form>
            <div className="text-center">
              <Link href="/inscription-convention" className="text-sm text-muted-foreground hover:text-foreground">
                Pas encore inscrit ? S'inscrire ici
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Main convention content (after verification) ---
  return (
    <div className="min-h-screen bg-background">
      {/* Dynamic primary color CSS injection */}
      {primaryColor && (
        <style>{`
          :root { --primary: ${primaryColor}; }
          .dark { --primary: ${primaryColor}; }
        `}</style>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${bgUrl}")` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-background" />
        <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 text-center">
          {showLogo && (
            <img
              src={conventionLogoUrl}
              alt="Convention G12 France"
              className="h-20 md:h-28 mx-auto mb-6 object-contain drop-shadow-lg"
            />
          )}
          <Reveal>
            <div className="flex items-center justify-center gap-3 mb-4">
              {liveEnabled && (
                <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                  <span className="w-2 h-2 bg-white rounded-full" />
                  En direct
                </span>
              )}
            </div>
          </Reveal>
          <Reveal>
            <h1 className="text-4xl md:text-6xl font-bold font-serif text-white mb-4 drop-shadow-lg">
              <PageTitleEditor pageKey="convention-g12" defaultH1="Convention G12 France 2026" />
            </h1>
          </Reveal>
          <Reveal>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8 drop-shadow">
              <PageTextEditor pageKey="convention-g12" textKey="hero" defaultText="L'héritage de la foi — Un temps fort de worship, de prière et de enseignement" />
            </p>
          </Reveal>
          {showOfficialSite && (
            <Reveal>
              <Button asChild size="lg" className="gap-2">
                <a href="https://conventiong12france.com" target="_blank" rel="noopener noreferrer">
                  Site officiel <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </Reveal>
          )}
        </div>
      </div>

      {/* Video Section */}
      {(youtubeVideoId || facebookVideoUrl) && (
        <section className="container mx-auto px-4 -mt-8 relative z-20">
          <Reveal>
            <div className="max-w-4xl mx-auto">
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
                {youtubeVideoId && !iframeErrored ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0&rel=0`}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Convention G12 France - Live"
                    onError={() => setIframeErrored(true)}
                  />
                ) : facebookVideoUrl ? (
                  <iframe
                    src={facebookVideoUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title="Convention G12 France - Facebook"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                    <div className="text-center">
                      <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                      <p className="text-muted-foreground">Le live débutera bientôt</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* Info Section */}
      <section className="container mx-auto px-4 py-12">
        <Reveal>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border">
              <Calendar className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Dates</p>
                <p className="text-sm text-muted-foreground">Plus d'informations sur conventiong12france.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border">
              <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Lieu</p>
                <p className="text-sm text-muted-foreground">Plus d'informations sur conventiong12france.com</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Middle background image */}
      {bgUrlMiddle && (
        <div className="relative h-48 md:h-64 my-8">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url("${bgUrlMiddle}")` }}
          />
        </div>
      )}

      {/* Bilingual CTA Section */}
      {showBilingualCTA && (
        <section className="container mx-auto px-4 py-12">
          <Reveal>
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h2 className="text-3xl font-bold font-serif">
                <PageTitleEditor pageKey="convention-g12-cta" defaultH1="Rejoignez-nous pour cette convention historique" />
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Button asChild size="lg" className="gap-2">
                  <a href="https://conventiong12france.com" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" /> FR
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <a href="https://conventiong12france.com/en" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" /> EN
                  </a>
                </Button>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* Bottom background image */}
      {bgUrlBottom && (
        <div className="relative h-48 md:h-64 my-8">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url("${bgUrlBottom}")` }}
          />
        </div>
      )}

      {/* Content Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <PageContentDisplay pageId="convention-g12" />
        </div>
      </section>

      {/* Share & Back */}
      <section className="container mx-auto px-4 py-8 border-t">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/culte-en-ligne" className="text-sm text-muted-foreground hover:text-foreground">
            ← Retour au Culte en ligne
          </Link>
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Copié !" : "Partager"}
          </Button>
        </div>
      </section>
    </div>
  );
}
