import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  KeyRound,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";

const PROVIDER_URLS: Record<string, string> = {
  groq: "https://console.groq.com/keys",
  google: "https://aistudio.google.com/apikey",
  minimax: "https://platform.minimaxi.com/user-center/basic-information",
  kling: "https://klingai.com/user/api-keys",
  replicate: "https://replicate.com/account/api-tokens",
  ollama: "",
};

const PROVIDER_HINTS: Record<string, string> = {
  groq: "GROQ_API_KEY (console.groq.com)",
  google: "GOOGLE_API_KEY (aistudio.google.com)",
  minimax: "MINIMAX_API_KEY (platform.minimaxi.com)",
  kling: "KLING_API_KEY (klingai.com/user/api-keys)",
  replicate: "REPLICATE_API_TOKEN (replicate.com/account/api-tokens)",
  ollama: "Ollama local — aucune clé requise",
};

export default function ApiKeyConnector() {
  const utils = trpc.useUtils();
  const { data: statuses, isLoading } = trpc.ai.apiKeys.list.useQuery();
  const [values, setValues] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProvider, setNewProvider] = useState({ provider: "", label: "", model: "", baseUrl: "" });

  const setMutation = trpc.ai.apiKeys.set.useMutation({
    onSuccess: (_data, vars) => {
      toast.success(`Clé ${vars.provider} enregistrée`);
      utils.ai.apiKeys.list.invalidate();
      utils.ai.stats.invalidate();
    },
    onError: err => toast.error(err.message || "Erreur lors de l'enregistrement"),
  });

  const removeMutation = trpc.ai.apiKeys.remove.useMutation({
    onSuccess: (_data, vars) => {
      toast.success(`Surcharge ${vars.provider} supprimée (retour au .env)`);
      utils.ai.apiKeys.list.invalidate();
      utils.ai.stats.invalidate();
    },
    onError: err => toast.error(err.message || "Erreur lors de la suppression"),
  });

  const addProviderMutation = trpc.ai.providers.add.useMutation({
    onSuccess: () => {
      toast.success("Provider ajouté");
      setShowAddForm(false);
      setNewProvider({ provider: "", label: "", model: "", baseUrl: "" });
      utils.ai.apiKeys.list.invalidate();
      utils.ai.stats.invalidate();
    },
    onError: err => toast.error(err.message || "Erreur lors de l'ajout"),
  });

  const removeProviderMutation = trpc.ai.providers.remove.useMutation({
    onSuccess: () => {
      toast.success("Provider supprimé");
      utils.ai.apiKeys.list.invalidate();
      utils.ai.stats.invalidate();
    },
    onError: err => toast.error(err.message || "Erreur lors de la suppression"),
  });

  const updateProviders = trpc.ai.updateProviders.useMutation({
    onSuccess: () => {
      utils.ai.apiKeys.list.invalidate();
      utils.ai.stats.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 opacity-30" />
        Chargement du connecteur...
      </div>
    );
  }

  const statusList = statuses ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Connecteur de clés API</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            disabled={updateProviders.isPending}
            onClick={() => updateProviders.mutate()}
          >
            {updateProviders.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            Tester toutes les clés
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            disabled={showAddForm}
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-3 h-3" />
            Ajouter un API
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Les clés saisies ici sont stockées en base et surchargent celles du{" "}
        <code className="font-mono">.env</code> — appliquées immédiatement, sans
        redéploiement. Vous pouvez ajouter ou supprimer librement les providers
        de la liste.
      </p>

      {showAddForm && (
        <div className="p-4 bg-card border rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Ajouter un provider</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setShowAddForm(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Identifiant (ex: openai)"
              value={newProvider.provider}
              onChange={e => setNewProvider(p => ({ ...p, provider: e.target.value }))}
              className="text-xs"
            />
            <Input
              placeholder="Label (ex: OpenAI)"
              value={newProvider.label}
              onChange={e => setNewProvider(p => ({ ...p, label: e.target.value }))}
              className="text-xs"
            />
            <Input
              placeholder="Modèle (ex: gpt-4o-mini)"
              value={newProvider.model}
              onChange={e => setNewProvider(p => ({ ...p, model: e.target.value }))}
              className="text-xs"
            />
            <Input
              placeholder="Base URL (ex: https://api.openai.com/v1/chat/completions)"
              value={newProvider.baseUrl}
              onChange={e => setNewProvider(p => ({ ...p, baseUrl: e.target.value }))}
              className="text-xs font-mono"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Endpoint OpenAI-compatible (chat completions). La clé sera saisie
            dans la carte du provider après ajout.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowAddForm(false)}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              disabled={
                addProviderMutation.isPending ||
                !newProvider.provider ||
                !newProvider.label ||
                !newProvider.model
              }
              onClick={() => addProviderMutation.mutate(newProvider)}
            >
              {addProviderMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
              Ajouter
            </Button>
          </div>
        </div>
      )}

      {updateProviders.data && (
        <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Résultats du test :
          </p>
          <div className="flex flex-wrap gap-2">
            {updateProviders.data.results.map(r => (
              <Badge
                key={r.provider}
                variant={r.ok ? "default" : "outline"}
                className={`capitalize ${
                  r.ok
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                }`}
              >
                {r.provider}: {r.ok ? "OK" : r.error?.split("–")[0]?.slice(0, 40) || "erreur"}
              </Badge>
            ))}
          </div>
          {updateProviders.data.results.some(
            r => r.modelReplaced || r.obsolete
          ) && (
            <div className="mt-2 space-y-1">
              {updateProviders.data.results
                .filter(r => r.modelReplaced || r.obsolete)
                .map(r => (
                  <p
                    key={r.provider}
                    className="text-xs text-amber-600 dark:text-amber-400"
                  >
                    ⚠️ {r.provider}:{" "}
                    {r.modelReplaced
                      ? `modèle obsolète "${r.modelFrom}" remplacé par "${r.model}"`
                      : `modèle "${r.model}" absent de la liste live des modèles actifs`}
                  </p>
                ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {statusList.map(status => (
          <div
            key={status.provider}
            className="p-4 bg-card border rounded-xl shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm capitalize">{status.provider}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        status.configured
                          ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : "text-red-600 dark:text-red-400 border-red-500/30"
                      }`}
                    >
                      {status.configured ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> configuré
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> non configuré
                        </span>
                      )}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        status.source === "db"
                          ? "text-blue-600 dark:text-blue-400 border-blue-500/30"
                          : status.source === "env"
                            ? "text-purple-600 dark:text-purple-400 border-purple-500/30"
                            : "text-muted-foreground"
                      }`}
                    >
                      {status.source === "db"
                        ? "base de données"
                        : status.source === "env"
                          ? ".env"
                          : "aucune"}
                    </Badge>
                  </div>
{status.configured ? (
                      <>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {status.masked}
                        </p>
                        {status.provider === "kling" && status.credits && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              💳 Crédits : {status.credits}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        {PROVIDER_HINTS[status.provider]}
                      </p>
                    )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {PROVIDER_URLS[status.provider] && (
                  <a
                    href={PROVIDER_URLS[status.provider]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Obtenir une clé
                  </a>
                )}
                {status.source === "db" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate({ provider: status.provider })}
                  >
                    <Trash2 className="w-3 h-3" />
                    Retirer
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                  disabled={removeProviderMutation.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Supprimer définitivement le provider "${status.provider}" ?`
                      )
                    ) {
                      removeProviderMutation.mutate({ provider: status.provider });
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                  Supprimer
                </Button>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={visible[status.provider] ? "text" : "password"}
                  placeholder={PROVIDER_HINTS[status.provider]}
                  value={values[status.provider] ?? ""}
                  onChange={e =>
                    setValues(prev => ({ ...prev, [status.provider]: e.target.value }))
                  }
                  onKeyDown={e => {
                    if (e.key === "Enter" && values[status.provider]) {
                      setMutation.mutate({
                        provider: status.provider,
                        value: values[status.provider],
                      });
                    }
                  }}
                  className="pr-10 text-xs font-mono"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    setVisible(prev => ({
                      ...prev,
                      [status.provider]: !prev[status.provider],
                    }))
                  }
                >
                  {visible[status.provider] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <Button
                size="sm"
                className="h-8 gap-1 text-xs"
                disabled={setMutation.isPending || !values[status.provider]}
                onClick={() =>
                  setMutation.mutate({
                    provider: status.provider,
                    value: values[status.provider],
                  })
                }
              >
                {setMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                Enregistrer
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}