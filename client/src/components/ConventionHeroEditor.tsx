import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Sparkles, Type } from "lucide-react";
import { toast } from "sonner";
import { HERO_DEFAULTS, HERO_KEYS } from "@/lib/conventionHero";

const PAGE_KEY = "convention-g12";

/**
 * Éditeur du bloc d'accueil de la page Convention (admin uniquement).
 *
 * Trois textes seulement : titre, sous-titre et paragraphe. Les dates, elles,
 * ne se saisissent pas — elles sont générées plus bas dans le hero depuis les
 * réglages de l'événement.
 *
 * « Proposer une reformulation » demande une variante à l'IA (`ai.suggest`) et
 * l'affiche à part : elle n'est appliquée que si l'admin le décide, une
 * reformulation automatique à chaque frappe se battrait avec la rédaction.
 */
export default function ConventionHeroEditor() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [open, setOpen] = useState(false);
  const [h1, setH1] = useState<string>(HERO_DEFAULTS.h1);
  const [h2, setH2] = useState<string>(HERO_DEFAULTS.h2);
  const [text, setText] = useState<string>(HERO_DEFAULTS.text);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const hydrated = useRef(false);

  const settingsQuery = trpc.siteSettings.getAll.useQuery(undefined, {
    enabled: isAdmin,
  });
  const setSetting = trpc.siteSettings.set.useMutation();
  const suggest = trpc.ai.suggest.useMutation();
  const utils = trpc.useUtils();

  /** Pré-remplit depuis la base (une seule fois). */
  useEffect(() => {
    const data = settingsQuery.data;
    if (!data || hydrated.current) return;
    setH1((data[HERO_KEYS.h1] as string | undefined) ?? HERO_DEFAULTS.h1);
    setH2((data[HERO_KEYS.h2] as string | undefined) ?? HERO_DEFAULTS.h2);
    setText((data[HERO_KEYS.text] as string | undefined) ?? HERO_DEFAULTS.text);
    hydrated.current = true;
  }, [settingsQuery.data]);

  if (!isAdmin) return null;

  const askSuggestion = async () => {
    if (!text.trim()) {
      toast.error("Le paragraphe est vide : rien à reformuler.");
      return;
    }
    setSuggesting(true);
    try {
      const proposal = await suggest.mutateAsync({
        text,
        brief: "plus concis et plus direct, en gardant le ton d'invitation",
      });
      setSuggestion(proposal);
    } catch (error) {
      toast.error(
        "Suggestion indisponible : " +
          (error instanceof Error ? error.message : "erreur inconnue")
      );
    } finally {
      setSuggesting(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all([
        setSetting.mutateAsync({ key: HERO_KEYS.h1, value: h1 }),
        setSetting.mutateAsync({ key: HERO_KEYS.h2, value: h2 }),
        setSetting.mutateAsync({ key: HERO_KEYS.text, value: text }),
      ]);
      await utils.siteSettings.getAll.invalidate();
      toast.success("Bloc d'accueil enregistré.");
    } catch (error) {
      toast.error(
        "Enregistrement impossible : " +
          (error instanceof Error ? error.message : "erreur inconnue")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-8 rounded-2xl border border-dashed border-primary/40 bg-background/60 p-4 text-left backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Type className="h-4 w-4 shrink-0 text-primary" />
          Textes du bloc d'accueil — les dates sont générées automatiquement
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(value => !value)}
          aria-expanded={open}
        >
          {open ? "Fermer" : "Modifier"}
        </Button>
      </div>

      {open && (
        <div className="mt-4 space-y-4">
          <label className="block space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Titre (H1)
            </span>
            <Input
              className="text-sm"
              value={h1}
              onChange={event => setH1(event.target.value)}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sous-titre (H2, facultatif)
            </span>
            <Input
              className="text-sm"
              value={h2}
              onChange={event => setH2(event.target.value)}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Paragraphe
            </span>
            <Textarea
              rows={4}
              className="text-sm"
              value={text}
              onChange={event => setText(event.target.value)}
            />
          </label>

          {suggestion && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Proposition de reformulation
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {suggestion}
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setText(suggestion);
                    setSuggestion(null);
                  }}
                >
                  Appliquer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSuggestion(null)}
                >
                  Ignorer
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={askSuggestion}
              disabled={suggesting || saving}
            >
              {suggesting ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="mr-1 h-3.5 w-3.5" />
              )}
              Proposer une reformulation
            </Button>
            <Button size="sm" onClick={save} disabled={saving || suggesting}>
              {saving ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="mr-1 h-3.5 w-3.5" />
              )}
              Enregistrer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
