import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play, RotateCcw, Activity, Youtube,
  AlertCircle, CheckCircle2, Clock, Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AgentInfo = {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "idle" | "running" | "error";
  lastRun: number | null;
  lastDuration: number | null;
  lastError: string | null;
};

type LogEntry = {
  agentId: string;
  startedAt: number;
  duration: number;
  success: boolean;
  message: string;
};

const AGENT_ICONS: Record<string, React.ElementType> = {
  youtube: Youtube,
  activity: Activity,
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function AgentCard({
  agent,
  onRun,
}: {
  agent: AgentInfo;
  onRun: (id: string) => void;
}) {
  const Icon = AGENT_ICONS[agent.icon] || Activity;
  const isRunning = agent.status === "running";

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
              isRunning
                ? "bg-primary/20 text-primary"
                : agent.status === "error"
                  ? "bg-destructive/20 text-destructive"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {isRunning ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Icon className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0 break-words">
            <h3 className="font-semibold truncate">{agent.name}</h3>
            <p className="text-sm text-muted-foreground">{agent.description}</p>
          </div>
        </div>
        <Badge
          variant={isRunning ? "default" : agent.status === "error" ? "destructive" : "outline"}
          className={cn(
            "shrink-0 capitalize",
            !isRunning && agent.status !== "error" &&
              "border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400",
          )}
        >
          {isRunning ? "en cours" : agent.status === "error" ? "erreur" : "actif"}
        </Badge>
      </div>

      {agent.lastRun && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(agent.lastRun).toLocaleString("fr-FR")}
          </span>
          {agent.lastDuration && (
            <span>{formatDuration(agent.lastDuration)}</span>
          )}
        </div>
      )}

      {agent.lastError && (
        <p className="text-xs text-destructive bg-destructive/10 rounded p-2">
          {agent.lastError}
        </p>
      )}

      <Button
        size="sm"
        onClick={() => onRun(agent.id)}
        disabled={isRunning}
        className="w-full"
      >
        {isRunning ? (
          <>
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            Exécution...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-1" />
            Exécuter
          </>
        )}
      </Button>
    </div>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
      <div className="mt-0.5">
        {entry.success ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-destructive" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium capitalize">{entry.agentId.replace("-", " ")}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(entry.startedAt).toLocaleString("fr-FR")}
          </span>
          <span className="text-xs text-muted-foreground">
            ({formatDuration(entry.duration)})
          </span>
        </div>
        <p className={cn("text-xs mt-0.5 break-words", entry.success ? "text-muted-foreground" : "text-destructive")}>
          {entry.message}
        </p>
      </div>
    </div>
  );
}

export default function AgentDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(false);

  const agentsQuery = trpc.agents.list.useQuery(undefined, {
    refetchInterval: autoRefresh ? 3000 : false,
  });
  const logsQuery = trpc.agents.logs.useQuery({ limit: 50 });
  const runMutation = trpc.agents.run.useMutation({
    onSuccess: () => {
      agentsQuery.refetch();
      setTimeout(() => logsQuery.refetch(), 500);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleRun = useCallback(
    (id: string) => {
      runMutation.mutate({ id });
    },
    [runMutation],
  );

  const agents = agentsQuery.data ?? [];
  const logs = logsQuery.data ?? [];

  const hasRunning = agents.some((a) => a.status === "running");

  useEffect(() => {
    setAutoRefresh(hasRunning);
  }, [hasRunning]);

  return (
    <div className="space-y-8">
      {/* Agent Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-bold">Agents</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              agentsQuery.refetch();
              logsQuery.refetch();
            }}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Actualiser
          </Button>
        </div>
        {agentsQuery.isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} onRun={handleRun} />
            ))}
          </div>
        )}
      </div>

      {/* Logs */}
      <div>
        <h2 className="text-lg font-serif font-bold mb-4">Historique d'exécution</h2>
        {logsQuery.isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune exécution pour le moment
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-4 max-h-96 overflow-y-auto">
            {logs.map((entry, i) => (
              <LogRow key={`${entry.agentId}-${entry.startedAt}-${i}`} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
