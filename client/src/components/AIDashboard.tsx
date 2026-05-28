import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Zap,
  AlertCircle,
  Clock,
  Server,
  BarChart3,
} from "lucide-react";

export default function AIDashboard() {
  const { data: stats, isLoading } = trpc.ai.stats.useQuery();

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
