import { TRPCError } from "@trpc/server";
import { createAgentRun } from "../db.js";

// ─── Types ────────────────────────────────────────────────────────

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** true si l'agent sait tourner en simulation, sans écrire en base. */
  supportsDryRun?: boolean;
}

export interface AgentStatus {
  status: "idle" | "running" | "error";
  lastRun: number | null;
  lastDuration: number | null;
  lastError: string | null;
}

export interface AgentLogEntry {
  agentId: string;
  startedAt: number;
  duration: number;
  success: boolean;
  message: string;
}

export interface AgentRunOptions {
  /** Simulation : l'agent décrit ce qu'il ferait sans rien modifier. */
  dryRun?: boolean;
}

type AgentRunner = (options: AgentRunOptions) => Promise<string>;

// ─── Registry ─────────────────────────────────────────────────────

interface AgentEntry {
  def: AgentDefinition;
  status: AgentStatus;
  runner: AgentRunner;
}

const agents = new Map<string, AgentEntry>();
const logs: AgentLogEntry[] = [];
const MAX_LOG_ENTRIES = 200;

export function registerAgent(
  id: string,
  name: string,
  description: string,
  icon: string,
  runner: AgentRunner,
  options: { supportsDryRun?: boolean } = {},
) {
  agents.set(id, {
    def: {
      id,
      name,
      description,
      icon,
      supportsDryRun: options.supportsDryRun ?? false,
    },
    status: { status: "idle", lastRun: null, lastDuration: null, lastError: null },
    runner,
  });
}

export function listAgents(): (AgentDefinition & AgentStatus)[] {
  return Array.from(agents.values()).map((e) => ({
    ...e.def,
    ...e.status,
  }));
}

export function getAgentLogs(limit = 50): AgentLogEntry[] {
  return logs.slice(0, limit);
}

export async function runAgent(
  id: string,
  options: AgentRunOptions = {},
): Promise<AgentLogEntry> {
  const entry = agents.get(id);
  if (!entry) {
    throw new TRPCError({ code: "NOT_FOUND", message: `Agent "${id}" not found` });
  }
  if (entry.status.status === "running") {
    throw new TRPCError({ code: "CONFLICT", message: `Agent "${id}" is already running` });
  }
  if (options.dryRun && !entry.def.supportsDryRun) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Agent "${id}" n'a pas de mode simulation`,
    });
  }

  const startedAt = Date.now();
  entry.status.status = "running";
  entry.status.lastError = null;

  let success: boolean;
  let message: string;

  try {
    message = await entry.runner(options);
    // Le préfixe évite de confondre un essai avec une exécution réelle dans l'historique.
    if (options.dryRun) message = `[simulation] ${message}`;
    success = true;
    entry.status.lastError = null;
  } catch (err) {
    message = err instanceof Error ? err.message : String(err);
    success = false;
    entry.status.lastError = message;
    entry.status.status = "error";
  }

  const duration = Date.now() - startedAt;
  entry.status.lastRun = startedAt;
  entry.status.lastDuration = duration;
  if (success) entry.status.status = "idle";

  const log: AgentLogEntry = { agentId: id, startedAt, duration, success, message };
  logs.unshift(log);
  if (logs.length > MAX_LOG_ENTRIES) logs.pop();

  createAgentRun({
    agentId: id,
    startedAt: new Date(startedAt),
    duration,
    success,
    message,
  }).catch(() => {});

  return log;
}

// ─── Built-in Agents ──────────────────────────────────────────────

export function initAgents() {
  registerAgent(
    "youtube-culte",
    "YouTube Cultes",
    "Importe les dernières vidéos YouTube de la chaîne G12 Paris",
    "youtube",
    async options => {
      const { spawn } = await import("node:child_process");
      const { fileURLToPath } = await import("node:url");
      const path = await import("node:path");

      const scriptPath = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../scripts/youtube-culte-agent.mjs",
      );

      // Le script accepte --dry-run : il affiche le plan sans toucher à la base.
      const args = options.dryRun ? [scriptPath, "--dry-run"] : [scriptPath];

      return new Promise<string>((resolve, reject) => {
        const proc = spawn("node", args, {
          stdio: ["pipe", "pipe", "pipe"],
          env: { ...process.env },
        });

        let stdout = "";
        let stderr = "";

        proc.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
        proc.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

        proc.on("close", (code) => {
          if (code === 0) {
            resolve(stdout.trim() || "Agent exécuté avec succès");
          } else {
            reject(new Error(stderr.trim() || `Exit code ${code}`));
          }
        });

        proc.on("error", reject);
      });
    },
    { supportsDryRun: true },
  );

  registerAgent(
    "echo-test",
    "Test Echo",
    "Agent de test — renvoie un message de confirmation",
    "activity",
    async () => {
      await new Promise((r) => setTimeout(r, 2000));
      return `Test réussi à ${new Date().toLocaleTimeString("fr-FR")}`;
    },
  );
}
