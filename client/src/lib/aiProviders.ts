export const AI_PROVIDERS = [
  {
    value: "groq",
    label: "Groq",
    model: "Llama 3.3 70B",
    description: "Rapide et très performant en rédaction longue.",
  },
  {
    value: "google",
    label: "Google",
    model: "Gemini 2.0 Flash",
    description: "Très bon en synthèse et réponses rapides.",
  },
] as const;

export type AiProvider = (typeof AI_PROVIDERS)[number]["value"];

export function getProviderInfo(value?: string) {
  const match = AI_PROVIDERS.find(p => p.value === value);
  return match ?? AI_PROVIDERS[0];
}
