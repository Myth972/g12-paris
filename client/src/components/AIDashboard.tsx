import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Zap,
  AlertCircle,
  Clock,
  Server,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  ShieldX,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export default function AIDashboard() {
  const utils = trpc.useUtils();
  const { data: stats, isLoading } = trpc.ai.stats.useQuery();
  const resetHealth = trpc.ai.resetProviderHealth.useMutation({
    onSuccess: () => {
      utils.ai.stats.invalidate();
    },
  });
  const updateProviders = trpc.ai.updateProviders.useMutation({
    onSuccess: () => {
      utils.ai.stats.invalidate();
    },
  });

  if (isLoading || !stats) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Activity className="w-8 h-8 animate-pulse mx-auto mb-2 opacity-30" />
        Chargement des statistiques IA...
      </div>
    );
  }

  const providerEntries = Object.entries(stats.byProvider);
  const endpointEntries = Object.entries(stats.byEndpoint);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-serif font-bold">
            Monitoring IA
          </h2>
          <p className="text-xs text-muted-foreground">
            Statistiques d'utilisation et santé des providers
          </p>
        </div>
      </div>

      {/* Quota utilisateur */}
      <div className="bg-card border rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-sm">
            Votre quota
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  stats.userQuota.used / stats.userQuota.max > 0.8
                    ? "bg-red-500"
                    : stats.userQuota.used / stats.userQuota.max > 0.5
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
                style={{
                  width: `${Math.min(100, (stats.userQuota.used / stats.userQuota.max) * 100)}%`,
                }}
              />
            </div>
          </div>
          <span className="text-sm font-mono font-medium">
            {stats.userQuota.used.toLocaleString()} /{" "}
            {stats.userQuota.max.toLocaleString()} tokens
          </span>
        </div>
        {stats.userQuota.resetsIn > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            <Clock className="w-3 h-3 inline mr-1" />
            Reset dans {stats.userQuota.resetsIn} minute
            {stats.userQuota.resetsIn > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Total appels
            </span>
          </div>
          <p className="text-2xl font-bold">{stats.totalCalls}</p>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Total tokens
            </span>
          </div>
          <p className="text-2xl font-bold">
            {stats.totalTokens.toLocaleString()}
          </p>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Erreurs récentes
            </span>
          </div>
          <p className="text-2xl font-bold">{stats.recentErrors.length}</p>
        </div>
      </div>

      {/* Santé des providers (circuit breaker) */}
      <div className="bg-card border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Santé des providers</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              disabled={resetHealth.isPending}
              onClick={() => resetHealth.mutate({})}
            >
              <RefreshCw className={`w-3 h-3 ${resetHealth.isPending ? "animate-spin" : ""}`} />
              Réinitialiser
            </Button>
            <Button
              variant="default"
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
              Mettre à jour les API
            </Button>
          </div>
        </div>

        {/* Résultats du dernier test */}
        {updateProviders.data && (
          <div className="mb-3 p-3 rounded-lg bg-muted/40 border border-border/60">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Résultats du dernier test ({new Date().toLocaleTimeString()}) :
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
          </div>
        )}

        {stats.providerHealth.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune donnée de santé pour le moment.
          </p>
        ) : (
          <div className="space-y-2">
            {stats.providerHealth.map(h => (
              <div
                key={h.provider}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {h.status === "healthy" ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  ) : h.status === "degraded" ? (
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                  ) : (
                    <ShieldX className="w-4 h-4 text-red-500" />
                  )}
                  <span className="font-medium text-sm capitalize">{h.provider}</span>
                  <Badge
                    variant="outline"
                    className={`capitalize ${
                      h.status === "healthy"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : h.status === "degraded"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {h.status === "unconfigured"
                      ? "clé manquante"
                      : h.status === "cooldown"
                        ? "en pause"
                        : h.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {h.lastError && (
                    <span className="max-w-[240px] truncate" title={h.lastError}>
                      {h.lastError}
                    </span>
                  )}
                  <span>
                    {h.consecutiveFailures} échec{h.consecutiveFailures > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Événements de fallback */}
      {stats.fallbackEvents.length > 0 && (
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-sm">Bascules automatiques</h3>
          </div>
          <div className="space-y-2">
            {stats.fallbackEvents.slice(0, 10).map((ev, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm"
              >
                <span>
                  <span className="font-mono font-medium">{ev.from}</span>
                  <span className="mx-1.5 text-muted-foreground">→</span>
                  <span className="font-mono font-medium text-primary">{ev.to}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Par provider */}
      {providerEntries.length > 0 && (
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">
              Par fournisseur
            </h3>
          </div>
          <div className="space-y-3">
            {providerEntries.map(([name, data]) => (
              <div
                key={name}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {name}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {data.calls} appel{data.calls > 1 ? "s" : ""}
                  </span>
                  <span className="font-mono font-medium">
                    {data.tokens.toLocaleString()} tokens
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Par endpoint */}
      {endpointEntries.length > 0 && (
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">
              Par endpoint
            </h3>
          </div>
          <div className="space-y-3">
            {endpointEntries.map(([name, data]) => (
              <div
                key={name}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <code className="text-xs font-mono text-primary">
                  {name}
                </code>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {data.calls} appel{data.calls > 1 ? "s" : ""}
                  </span>
                  <span className="font-mono font-medium">
                    {data.tokens.toLocaleString()} tokens
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Erreurs récentes */}
      {stats.recentErrors.length > 0 && (
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-sm">
              Erreurs récentes
            </h3>
          </div>
          <div className="space-y-2">
            {stats.recentErrors.slice(0, 10).map((err, i) => (
              <div
                key={i}
                className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <code className="text-xs font-mono text-red-700 dark:text-red-400">
                    {err.endpoint}
                  </code>
                  <span className="text-xs text-muted-foreground">
                    {new Date(err.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-red-600 dark:text-red-400 text-xs truncate">
                  {err.error}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
