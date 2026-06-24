import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Sparkles,
  ArrowLeft,
  Save,
  Loader2,
  Shield,
  MousePointer2,
  MoveRight,
  ScanLine,
  ArrowUp,
  Layers,
  BarChart3,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const features = [
  {
    key: "particles",
    label: "Particules flottantes",
    desc: "Étoiles animées en arrière-plan",
    icon: Sparkles,
    fields: ["enabled", "count", "speed", "color"] as const,
  },
  {
    key: "glowCursor",
    label: "Glow cursor (croix)",
    desc: "Croix lumineuse qui suit la souris",
    icon: MousePointer2,
    fields: ["enabled"] as const,
  },
  {
    key: "pageTransition",
    label: "Transitions de page",
    desc: "Animation fluide entre les pages",
    icon: MoveRight,
    fields: ["enabled"] as const,
  },
  {
    key: "tiltCard",
    label: "Tilt cards 3D",
    desc: "Effet d'inclinaison 3D au survol des cartes",
    icon: Layers,
    fields: ["enabled"] as const,
  },
  {
    key: "progressBar",
    label: "Barre de progression",
    desc: "Barre de lecture en haut des articles",
    icon: ScanLine,
    fields: ["enabled"] as const,
  },
  {
    key: "scrollToTop",
    label: "Bouton retour haut",
    desc: "Bouton flottant pour remonter en haut des articles",
    icon: ArrowUp,
    fields: ["enabled"] as const,
  },
  {
    key: "reveal",
    label: "Animations au scroll",
    desc: "Apparition progressive des sections au défilement",
    icon: Eye,
    fields: ["enabled"] as const,
  },
  {
    key: "stats",
    label: "Compteurs statistiques",
    desc: "Compteurs animés sur la page d'accueil",
    icon: BarChart3,
    fields: ["enabled"] as const,
  },
];

type FeatureKey = (typeof features)[number]["key"];

function settingKey(feature: FeatureKey, field: string) {
  return `visuals.${feature}.${field}`;
}

export default function AdminVisuals() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (user?.role !== "admin") {
    return (
      <div className="container py-20 text-center">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-serif font-bold mb-2">Accès restreint</h2>
        <p className="text-muted-foreground mb-6">
          Vous devez être administrateur pour accéder à cette page.
        </p>
        <Button variant="outline" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const setSetting = trpc.siteSettings.set.useMutation();

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settingsQuery.data) {
      const next: Record<string, string> = {};
      for (const f of features) {
        for (const field of f.fields) {
          const key = settingKey(f.key, field);
          next[key] = (settingsQuery.data[key] as string) ?? "";
        }
      }
      setValues((prev) => (Object.keys(prev).length ? prev : next));
    }
  }, [settingsQuery.data]);

  const get = (feature: FeatureKey, field: string) =>
    values[settingKey(feature, field)] ?? "";

  const set = (feature: FeatureKey, field: string, value: string) =>
    setValues((prev) => ({ ...prev, [settingKey(feature, field)]: value }));

  const isEnabled = (feature: FeatureKey) =>
    get(feature, "enabled") !== "false";

  const handleSave = async () => {
    try {
      await Promise.all(
        Object.entries(values).map(([key, value]) =>
          setSetting.mutateAsync({ key, value }),
        ),
      );
      toast.success("Paramètres visuels enregistrés");
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20 overflow-y-auto">
      <div className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/admin")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Administration
                </span>
              </div>
              <h1 className="text-2xl font-bold font-serif">
                Paramètres visuels
              </h1>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={setSetting.isPending}
            className="gap-2"
          >
            {setSetting.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {setSetting.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className="container py-8 max-w-3xl space-y-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          const enabled = isEnabled(feature.key);
          return (
            <div
              key={feature.key}
              className="rounded-xl border bg-card p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-primary/10 p-2">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {feature.label}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {feature.desc}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={(v) =>
                    set(feature.key, "enabled", v ? "true" : "false")
                  }
                />
              </div>
              {enabled && feature.fields.length > 1 && (
                <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {(feature.fields as readonly string[]).includes("count") && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Nombre
                      </label>
                      <Input
                        type="number"
                        min={10}
                        max={100}
                        value={get(feature.key, "count")}
                        onChange={(e) =>
                          set(feature.key, "count", e.target.value)
                        }
                      />
                    </div>
                  )}
                  {(feature.fields as readonly string[]).includes("speed") && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Vitesse
                      </label>
                      <Input
                        type="number"
                        min={0.05}
                        max={1}
                        step={0.05}
                        value={get(feature.key, "speed")}
                        onChange={(e) =>
                          set(feature.key, "speed", e.target.value)
                        }
                      />
                    </div>
                  )}
                  {(feature.fields as readonly string[]).includes("color") && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Couleur
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          className="w-10 h-9 p-0.5 cursor-pointer"
                          value={get(feature.key, "color") || "#FCD34D"}
                          onChange={(e) =>
                            set(feature.key, "color", e.target.value)
                          }
                        />
                        <Input
                          value={get(feature.key, "color") || "#FCD34D"}
                          onChange={(e) =>
                            set(feature.key, "color", e.target.value)
                          }
                          className="flex-1 font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
