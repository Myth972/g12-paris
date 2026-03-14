export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  googleApiKey: process.env.GOOGLE_API_KEY ?? "",
  preferredAiProvider:
    (process.env.PREFERRED_AI_PROVIDER as "google" | "groq") ?? "google",
};
