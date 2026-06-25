const findBlobToken = () => {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  for (const key in process.env) {
    if (key.endsWith("READ_WRITE_TOKEN") && process.env[key]?.startsWith("vercel_blob_")) {
      return process.env[key] as string;
    }
  }
  return "";
};

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  googleApiKey: process.env.GOOGLE_API_KEY ?? "",
  minimaxApiKey: process.env.MINIMAX_API_KEY ?? "",
  aimlApiKey: process.env.AIMLAPI_KEY ?? "",
  blobToken: findBlobToken(),
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  ollamaModel: process.env.OLLAMA_MODEL ?? "",
  preferredAiProvider:
    (process.env.PREFERRED_AI_PROVIDER as
      | "google"
      | "groq"
      | "minimax"
      | "aimlapi"
      | "ollama") ?? "groq",
};
