import { useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Ref } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Languages, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import {
  BILINGUAL_DEFAULTS,
  BILINGUAL_KEYS,
  type BilingualLang,
  type BilingualTexts,
} from "@/lib/conventionBilingual";
import type { TextBlockEditorHandle } from "@/lib/textBlockEditor";

const PAGE_KEY = "convention-g12";

/** Préfixe des clés `site_settings` lues par la page Convention. */
const settingKey = (suffix: string) => `pageText.${PAGE_KEY}.${suffix}`;

/** Champs rédigés : le français fait foi, l'anglais est une suggestion. */
const FIELDS: { id: keyof BilingualTexts; label: string; multiline: boolean }[] =
  [
    { id: "title", label: "Titre", multiline: true },
    { id: "body", label: "Texte d'appel", multiline: true },
    { id: "eventName", label: "Nom de l'événement", multiline: false },
    { id: "subtitle", label: "Sous-titre", multiline: false },
    { id: "cta", label: "Appel à l'action", multiline: false },
  ];

/**
 * Éditeur du bloc bilingue de la page Convention (admin uniquement).
 *
 * Un seul texte est rédigé, en français. Le bouton « Suggérer la version
 * anglaise » appelle `ai.translate` et remplit la colonne EN, qui reste
 * modifiable : rien n'est écrit deux fois, et la suggestion est relue avant
 * d'être enregistrée. Les dates, elles, viennent des réglages de l'événement.
 *
 * Aucun bouton d'enregistrement ici : la section Convention appelle `save()`
 * via sa référence, en même temps que ses propres réglages.
 */
export default function ConventionBilingualEditor({
  ref,
}: {
  ref?: Ref<TextBlockEditorHandle>;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [open, setOpen] = useState(false);
  const [fr, setFr] = useState<BilingualTexts>(BILINGUAL_DEFAULTS.fr);
  const [en, setEn] = useState<BilingualTexts>(BILINGUAL_DEFAULTS.en);
  const [translating, setTranslating] = useState(false);
  /** État de la suggestion automatique, affiché en une ligne discrète. */
  const [autoStatus, setAutoStatus] = useState<
    "idle" | "working" | "error"
  >("idle");
  const [autoError, setAutoError] = useState<string | null>(null);
  const hydrated = useRef(false);
  /** Valeur française déjà traduite, par champ (évite de retraduire à l'identique). */
  const translatedFr = useRef<Partial<Record<keyof BilingualTexts, string>>>({});
  /** Numéro du dernier passage : une frappe plus récente annule l'ancien. */
  const translationRun = useRef(0);

  const settingsQuery = trpc.siteSettings.getAll.useQuery(undefined, {
    enabled: isAdmin,
  });
  const setSetting = trpc.siteSettings.set.useMutation();
  const translate = trpc.ai.translate.useMutation();
  const utils = trpc.useUtils();
  /** Sa référence garde une identité stable : on l'isole des dépendances. */
  const translateRef = useRef(translate.mutateAsync);
  translateRef.current = translate.mutateAsync;

  /** Pré-remplit les deux colonnes depuis la base (une seule fois). */
  useEffect(() => {
    const data = settingsQuery.data;
    if (!data || hydrated.current) return;
    const read = (lang: BilingualLang): BilingualTexts => {
      const keys = BILINGUAL_KEYS[lang];
      return FIELDS.reduce((acc, field) => {
        const stored = data[settingKey(keys[field.id])] as string | undefined;
        acc[field.id] = stored ?? BILINGUAL_DEFAULTS[lang][field.id];
        return acc;
      }, {} as BilingualTexts);
    };
    const initialFr = read("fr");
    setFr(initialFr);
    setEn(read("en"));
    // Les valeurs chargées sont considérées comme déjà traduites : ouvrir le
    // panneau ne déclenche donc aucune requête de traduction.
    translatedFr.current = { ...initialFr };
    hydrated.current = true;
  }, [settingsQuery.data]);

  /**
   * Suggestion automatique : dès que le français change, l'anglais du même
   * champ est retraduit après une courte pause de frappe (1 s).
   *
   * - seuls les champs modifiés depuis la dernière traduction partent ;
   * - une frappe pendant une requête annule son résultat (`translationRun`) ;
   * - une erreur s'affiche une fois, sans bloquer la saisie ni boucler.
   */
  useEffect(() => {
    if (!isAdmin || !open || !hydrated.current) return;
    const pending = FIELDS.filter(field => {
      const value = fr[field.id];
      return (
        value.trim().length > 0 && translatedFr.current[field.id] !== value
      );
    });
    if (pending.length === 0) return;

    const timer = window.setTimeout(async () => {
      const run = ++translationRun.current;
      setAutoStatus("working");
      setAutoError(null);
      for (const field of pending) {
        const source = fr[field.id];
        try {
          const suggestion = await translateRef.current({
            text: source,
            targetLanguage: "en",
          });
          // Une frappe plus récente a pris le relais : on jette ce résultat.
          if (translationRun.current !== run) return;
          setEn(prev => ({ ...prev, [field.id]: suggestion }));
          translatedFr.current[field.id] = source;
        } catch (error) {
          if (translationRun.current !== run) return;
          setAutoError(
            error instanceof Error ? error.message : "erreur inconnue"
          );
          setAutoStatus("error");
          return;
        }
      }
      if (translationRun.current === run) setAutoStatus("idle");
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [fr, open, isAdmin]);

  const update = (lang: BilingualLang, id: keyof BilingualTexts, value: string) => {
    if (lang === "fr") setFr(prev => ({ ...prev, [id]: value }));
    else setEn(prev => ({ ...prev, [id]: value }));
  };

  /** Traduit chaque champ FR non vide et remplit la colonne EN. */
  const suggestEnglish = async () => {
    const fields = FIELDS.filter(field => fr[field.id].trim().length > 0);
    if (fields.length === 0) {
      toast.error("Rien à traduire : la colonne française est vide.");
      return;
    }
    setTranslating(true);
    try {
      const next: BilingualTexts = { ...en };
      for (const field of fields) {
        next[field.id] = await translate.mutateAsync({
          text: fr[field.id],
          targetLanguage: "en",
        });
        translatedFr.current[field.id] = fr[field.id];
      }
      setEn(next);
      setAutoStatus("idle");
      toast.success("Version anglaise suggérée — relis-la puis enregistre.");
    } catch (error) {
      toast.error(
        "Traduction indisponible : " +
          (error instanceof Error ? error.message : "erreur inconnue")
      );
    } finally {
      setTranslating(false);
    }
  };

  /** Écrit les deux langues. L'erreur remonte au bouton de la section. */
  const save = async () => {
    const payload: { key: string; value: string }[] = [];
    for (const field of FIELDS) {
      payload.push({
        key: settingKey(BILINGUAL_KEYS.fr[field.id]),
        value: fr[field.id],
      });
      payload.push({
        key: settingKey(BILINGUAL_KEYS.en[field.id]),
        value: en[field.id],
      });
    }
    await Promise.all(payload.map(entry => setSetting.mutateAsync(entry)));
    await utils.siteSettings.getAll.invalidate();
  };

  useImperativeHandle(ref, () => ({ save }), [save]);

  if (!isAdmin) return null;

  return (
    <div className="mb-4 rounded-2xl border border-dashed border-primary/40 bg-background/60 p-4 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Languages className="h-4 w-4 shrink-0 text-primary" />
          Textes du bloc bilingue — rédigés en français, l'anglais est suggéré
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
          <p className="text-xs text-muted-foreground">
            Les dates et le lieu restent gérés une seule fois : les dates
            viennent de Admin → Design (début et fin de la Convention) et
            s'affichent ici dans les deux langues.
          </p>

          {FIELDS.map(field => (
            <div key={field.id} className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {field.label} · FR
                </span>
                {field.multiline ? (
                  <Textarea
                    rows={3}
                    className="text-sm"
                    value={fr[field.id]}
                    onChange={event =>
                      update("fr", field.id, event.target.value)
                    }
                  />
                ) : (
                  <Input
                    className="text-sm"
                    value={fr[field.id]}
                    onChange={event =>
                      update("fr", field.id, event.target.value)
                    }
                  />
                )}
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {field.label} · EN{" "}
                  <span className="normal-case font-normal">(suggéré)</span>
                </span>
                {field.multiline ? (
                  <Textarea
                    rows={3}
                    className="text-sm"
                    value={en[field.id]}
                    onChange={event =>
                      update("en", field.id, event.target.value)
                    }
                  />
                ) : (
                  <Input
                    className="text-sm"
                    value={en[field.id]}
                    onChange={event =>
                      update("en", field.id, event.target.value)
                    }
                  />
                )}
              </label>
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={suggestEnglish}
              disabled={translating}
            >
              {translating ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Wand2 className="mr-1 h-3.5 w-3.5" />
              )}
              Retraduire maintenant
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Les textes partent avec le bouton « Enregistrer la Convention ».
          </p>

          {/* État de la suggestion automatique */}
          <p
            aria-live="polite"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            {autoStatus === "working" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Suggestion anglaise en cours…
              </>
            )}
            {autoStatus === "error" && (
              <>Suggestion indisponible : {autoError} — l'anglais reste modifiable à la main.</>
            )}
            {autoStatus === "idle" &&
              "L'anglais se met à jour tout seul dès que le texte français change."}
          </p>
        </div>
      )}
    </div>
  );
}
