import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ExternalLink,
  FileText,
  Loader2,
  Megaphone,
  Save,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

/**
 * Clé sessionStorage utilisée pour passer un brouillon d'annonce / flash-event
 * du Composer vers le formulaire de gestion de l'accueil (HomeContentManager).
 * Le contenu reste côté navigateur : rien n'est publié automatiquement.
 */
export const COMPOSER_PREFILL_KEY = "g12-composer-prefill";

type ComposerKind = "article" | "announcement" | "flash-event";

const KINDS: { value: ComposerKind; label: string; icon: typeof FileText; hint: string }[] = [
  { value: "article", label: "Article", icon: FileText, hint: "Brouillon d'article complet, enregistré puis éditable dans l'éditeur" },
  { value: "announcement", label: "Annonce", icon: Megaphone, hint: "Texte d'annonce prérempli dans le formulaire de l'accueil" },
  { value: "flash-event", label: "Événement", icon: Zap, hint: "Flash-event avec date/lieu, prérempli dans le formulaire de l'accueil" },
];

/** Envoie le brouillon d'annonce/événement vers le formulaire d'accueil. */
function prefillHomepageForm(target: "announcement" | "flash-event", form: Record<string, string | undefined>) {
  try {
    sessionStorage.setItem(
      COMPOSER_PREFILL_KEY,
      JSON.stringify({ target, form, ts: Date.now() })
    );
    // Ne garder qu'un préremplissage à la fois (si on relance avant navigation).
    if (sessionStorage.getItem(COMPOSER_PREFILL_KEY) === null) {
      throw new Error("sessionStorage indisponible");
    }
  } catch {
    toast.error("Préremplissage impossible dans ce navigateur");
    return false;
  }
  return true;
}

export default function AIComposer() {
  const [, setLocation] = useLocation();
  const [kind, setKind] = useState<ComposerKind>("article");
  const [brief, setBrief] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocationInput] = useState("");

  // Brouillon reçu de l'IA, rendu modifiable avant enregistrement.
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const [draftKind, setDraftKind] = useState<ComposerKind>("article");

  const composeMutation = trpc.ai.compose.useMutation({
    onSuccess: (result) => {
      setDraft((result.draft ?? {}) as Record<string, string>);
      setDraftKind(result.kind as ComposerKind);
      toast.success(`Brouillon généré (${result.model})`);
    },
    onError: (error) => toast.error("Génération échouée : " + error.message),
  });

  const createArticleMutation = trpc.articles.create.useMutation({
    onSuccess: (article) => {
      toast.success("Brouillon d'article enregistré — à toi de relire et publier");
      setLocation(`/admin/article/${article.id}`);
    },
    onError: (error) => toast.error("Enregistrement impossible : " + error.message),
  });

  const isEventLike = draftKind === "announcement" || draftKind === "flash-event";

  const handleGenerate = () => {
    if (!brief.trim()) {
      toast.error("Décris d'abord ce que tu veux publier");
      return;
    }
    composeMutation.mutate({
      kind,
      brief: brief.trim(),
      eventDate: eventDate.trim() || undefined,
      location: location.trim() || undefined,
    });
  };

  const handleSaveArticle = () => {
    if (!draft) return;
    if (!draft.title?.trim() || !draft.content?.trim()) {
      toast.error("Titre et contenu requis");
      return;
    }
    createArticleMutation.mutate({
      title: draft.title.trim(),
      excerpt: draft.excerpt?.trim() || undefined,
      content: draft.content.trim(),
      category: draft.category?.trim() || "actualité",
      published: false, // Brouillons uniquement — jamais de publication automatique.
    });
  };

  const handlePrefill = () => {
    if (!draft || !draftKind) return;
    const ok = prefillHomepageForm(draftKind as "announcement" | "flash-event", {
      title: draft.title ?? "",
      description: draft.description ?? "",
      badge: draft.badge ?? "",
      category: draft.category ?? "general",
      eventDate: draft.eventDate ?? "",
      location: draft.location ?? "",
      ctaLabel: draft.ctaLabel ?? "",
      ctaHref: draft.ctaHref ?? "",
    });
    if (ok) {
      setLocation("/admin?tab=accueil");
      toast.success("Formulaire d'accueil prérempli — ajoute l'image puis crée");
    }
  };

  const updateDraft = (field: string, value: string) =>
    setDraft(prev => (prev ? { ...prev, [field]: value } : prev));

  return (
    <div className="space-y-4">
      {/* ── Formulaire de demande ─────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-serif">
            <Sparkles className="w-4 h-4 text-primary" />
            Composer un contenu
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            L'IA rédige un <strong>brouillon non publié</strong> ; tu restes maître de
            la relecture et de la publication.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Choix du type de contenu */}
          <div className="grid grid-cols-3 gap-2">
            {KINDS.map(({ value, label, icon: Icon, hint }) => (
              <button
                key={value}
                type="button"
                title={hint}
                onClick={() => setKind(value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-colors",
                  kind === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="composer-brief">Ta demande</Label>
            <Textarea
              id="composer-brief"
              rows={4}
              placeholder={
                kind === "article"
                  ? "Ex : Rédige un article d'annonce sur le jeûne de janvier, avec un verset d'Ésaïe 58 et un appel à participer…"
                  : "Ex : Convention d'automne le samedi 15 novembre à 18h à l'Espace Reuilly, entrée libre…"
              }
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
            />
          </div>

          {kind !== "article" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="composer-date">Date / heure (optionnel)</Label>
                <Input
                  id="composer-date"
                  placeholder="samedi 15 novembre, 18h"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="composer-location">Lieu (optionnel)</Label>
                <Input
                  id="composer-location"
                  placeholder="Espace Reuilly"
                  value={location}
                  onChange={(e) => setLocationInput(e.target.value)}
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={composeMutation.isPending || !brief.trim()}
            className="w-full sm:w-auto"
          >
            {composeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Rédaction en cours…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Générer le brouillon
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── Aperçu / édition du brouillon ──────────────────────── */}
      {draft && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-serif">
              <Sparkles className="w-4 h-4 text-primary" />
              Brouillon — vérifie et ajuste
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="draft-title">Titre</Label>
              <Input
                id="draft-title"
                value={draft.title ?? ""}
                onChange={(e) => updateDraft("title", e.target.value)}
              />
            </div>

            {draftKind === "article" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="draft-excerpt">Résumé (extrait)</Label>
                  <Textarea
                    id="draft-excerpt"
                    rows={2}
                    value={draft.excerpt ?? ""}
                    onChange={(e) => updateDraft("excerpt", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="draft-content">Contenu (HTML)</Label>
                    <Textarea
                      id="draft-content"
                      rows={10}
                      className="font-mono text-xs"
                      value={draft.content ?? ""}
                      onChange={(e) => updateDraft("content", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="draft-category">Catégorie</Label>
                    <Input
                      id="draft-category"
                      value={draft.category ?? ""}
                      onChange={(e) => updateDraft("category", e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      L'enregistrement crée un <strong>brouillon</strong> ; tu
                      pourras relire dans l'éditeur complet.
                    </p>
                  </div>
                </div>
                <Button onClick={handleSaveArticle} disabled={createArticleMutation.isPending}>
                  {createArticleMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer en brouillon
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="draft-description">Description</Label>
                  <Textarea
                    id="draft-description"
                    rows={3}
                    value={draft.description ?? ""}
                    onChange={(e) => updateDraft("description", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="draft-badge">Badge</Label>
                    <Input
                      id="draft-badge"
                      value={draft.badge ?? ""}
                      onChange={(e) => updateDraft("badge", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="draft-date">Date</Label>
                    <Input
                      id="draft-date"
                      value={draft.eventDate ?? ""}
                      onChange={(e) => updateDraft("eventDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="draft-location">Lieu</Label>
                    <Input
                      id="draft-location"
                      value={draft.location ?? ""}
                      onChange={(e) => updateDraft("location", e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isEventLike && "Image et publication se font dans le formulaire de l'accueil — "}
                  aucune création automatique : le formulaire sera simplement prérempli.
                </p>
                <Button variant="outline" onClick={handlePrefill}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Préremplir le formulaire d'accueil
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
