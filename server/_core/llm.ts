import { TRPCError } from "@trpc/server";
import { ENV } from "./env.js";
import {
  classifyError,
  getProviderHealth,
  isProviderAvailable,
  recordFallback,
  recordProviderFailure,
  recordProviderSuccess,
} from "./providerHealth.js";

let detectedOllamaModel: string | null = null;

async function detectOllamaModel(): Promise<string> {
  if (detectedOllamaModel) return detectedOllamaModel;
  const prefer = ["llama3.2:3b", "llama3.2", "llama3.1", "llama3", "dolphin-llama3", "qwen2.5", "deepseek-r1"];
  try {
    const res = await fetch(`${ENV.ollamaBaseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json() as { models?: { name: string }[] };
      const names = data.models?.map(m => m.name) ?? [];
      for (const preferred of prefer) {
        const match = names.find(n => n.startsWith(preferred));
        if (match) { detectedOllamaModel = match; return match; }
      }
      if (names.length > 0) { detectedOllamaModel = names[0]; return names[0]; }
    }
  } catch {}
  return "llama3.2:3b";
}

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?:
      | "audio/mpeg"
      | "audio/wav"
      | "application/pdf"
      | "audio/mp4"
      | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  provider?: string;
  model?: string;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Unsupported message content part",
  });
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "tool_choice 'required' was provided but no tools were configured",
      });
    }

    if (tools.length > 1) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "tool_choice 'required' needs a single tool or specify the tool name explicitly",
      });
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "responseFormat json_schema requires a defined schema object",
      });
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "outputSchema requires both name and schema",
    });
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const provider = params.provider || ENV.preferredAiProvider || "groq";
  let apiUrl = "";
  let apiKey = "";
  let model = params.model || "";

  const { getApiKey } = await import("./apiKeys.js");
  const { getProviderConfig } = await import("./apiProviders.js");
  const providerConfig = await getProviderConfig(provider);

  if (provider === "minimax") {
    apiUrl = "https://api.minimaxi.chat/v1/text/chatcompletion_v2";
    apiKey = (await getApiKey("minimax")) || "";
    model = model || "MiniMax-M2.1";
    if (!apiKey)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "MINIMAX_API_KEY is not configured",
      });
  } else if (provider === "aimlapi") {
    apiUrl = "https://api.aimlapi.com/v1/chat/completions";
    apiKey = (await getApiKey("aimlapi")) || "";
    model = model || "mistralai/Mistral-7B-Instruct-v0.2";
    if (!apiKey)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "AIMLAPI_KEY is not configured",
      });
  } else if (provider === "groq") {
    apiUrl = "https://api.groq.com/openai/v1/chat/completions";
    apiKey = (await getApiKey("groq")) || "";
    model = model || "openai/gpt-oss-120b";
    if (!apiKey)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "GROQ_API_KEY is not configured",
      });
  } else if (provider === "ollama") {
    apiUrl = `${ENV.ollamaBaseUrl}/v1/chat/completions`;
    apiKey = "ollama";
    model = model || ENV.ollamaModel || await detectOllamaModel();
    // Pas de vérification de clé — Ollama fonctionne sans authentification en local
  } else if (providerConfig?.baseUrl) {
    // Provider personnalisé — endpoint OpenAI-compatible défini en base
    apiUrl = providerConfig.baseUrl;
    apiKey = (await getApiKey(provider)) || "";
    model = model || providerConfig.model;
    if (!apiKey)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `API Key for ${provider} is not configured`,
      });
  } else {
    // Google / Gemini — API OpenAI-compatible officielle
    apiUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    apiKey = (await getApiKey("google")) || "";
    model = model || "gemini-3.5-flash";
    if (!apiKey)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "AI API Key is not configured",
      });
  }

  // Remplacement automatique des modèles obsolètes
  const { resolveModel } = await import("./modelRegistry.js");
  const resolved = resolveModel(provider, model);
  if (resolved.replaced) {
    console.warn(
      `[AI Model] ${provider}: modèle obsolète "${resolved.from}" remplacé par "${resolved.model}"`
    );
  }
  model = resolved.model;

  const payload: Record<string, unknown> = {
    model,
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  // Provider specific adjustments
  if (provider === "google") {
    payload.max_tokens = 32768;
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `LLM invoke timeout (${provider}): requête annulée après 30s`,
      });
    }
    throw err;
  }
  clearTimeout(timeout);

  if (!response.ok) {
    const errorText = await response.text();
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `LLM invoke failed (${provider}): ${response.status} ${response.statusText} – ${errorText}`,
    });
  }

  return (await response.json()) as InvokeResult;
}

// Note : l'ordre de fallback est désormais dynamique (liste des providers activés en base).

/** Vérifie qu'un provider dispose bien d'une clé API configurée (DB ou .env). */
export async function isProviderConfigured(provider: string): Promise<boolean> {
  if (provider === "ollama") return true; // local, pas de clé
  const { getApiKey } = await import("./apiKeys.js");
  return !!(await getApiKey(provider));
}

/**
 * invokeLLMWithFallback — tente le provider demandé, puis les autres en cas d'échec.
 * Utilise un circuit breaker : les providers non configurés ou en cooldown
 * (3 échecs consécutifs) sont automatiquement sautés, et chaque bascule
 * est tracée dans le monitoring IA.
 */
export async function invokeLLMWithFallback(params: InvokeParams): Promise<InvokeResult> {
  const preferredProvider = params.provider || ENV.preferredAiProvider || "groq";

  // Liste dynamique des providers activés (base de données)
  const { listEnabledProviders } = await import("./apiProviders.js");
  const enabledProviders = await listEnabledProviders();

  // Construire la liste des providers à essayer (préféré d'abord, puis fallback)
  const providersToTry = [
    preferredProvider,
    ...enabledProviders.filter(p => p !== preferredProvider),
  ];

  const attempts: Array<{ provider: string; ok: boolean; error?: string; durationMs: number }> = [];
  let lastError: Error | null = null;
  let lastAttemptedProvider: string | null = null;

  for (const provider of providersToTry) {
    // Circuit breaker : sauter les providers indisponibles
    if (!(await isProviderConfigured(provider))) {
      console.warn(`[AI Fallback] ${provider} skipped (clé API non configurée)`);
      continue;
    }
    if (!isProviderAvailable(provider)) {
      const health = getProviderHealth(provider);
      console.warn(`[AI Fallback] ${provider} skipped (en cooldown, ${health.consecutiveFailures} échecs)`);
      continue;
    }

    const startedAt = Date.now();
    try {
      const result = await invokeLLM({ ...params, provider });
      recordProviderSuccess(provider);
      attempts.push({ provider, ok: true, durationMs: Date.now() - startedAt });
      if (lastAttemptedProvider && lastAttemptedProvider !== provider) {
        recordFallback(lastAttemptedProvider, provider, "server", "basculé automatiquement");
      }
      return result;
    } catch (err: any) {
      const kind = classifyError(err);
      recordProviderFailure(provider, kind, err.message);
      lastError = err;
      lastAttemptedProvider = provider;
      attempts.push({ provider, ok: false, error: err.message, durationMs: Date.now() - startedAt });
      console.warn(`[AI Fallback] Provider ${provider} failed (${kind}): ${err.message}`);
      // Configuration manquante ou erreur transitoire : essayer le suivant
      continue;
    }
  }

  // Tous les providers ont échoué — alerte structurée
  console.error(
    `[AI Fallback] TOUS LES PROVIDERS ONT ÉCHOUÉ (${attempts.length} tentatives)`,
    JSON.stringify(
      attempts.map(a => ({
        provider: a.provider,
        ok: a.ok,
        error: a.error,
        durationMs: a.durationMs,
      }))
    )
  );

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `Tous les providers IA ont échoué. Dernière erreur: ${lastError?.message || "inconnue"}`,
  });
}
