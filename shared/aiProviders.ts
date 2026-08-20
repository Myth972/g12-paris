export const AI_PROVIDERS = [
  {
    value: "groq",
    label: "Groq",
    model: "GPT-OSS 120B",
    description: "Rapide et très performant en rédaction longue.",
  },
  {
    value: "google",
    label: "Google Gemini",
    model: "Gemini 3.5 Flash",
    description: "Très bon en synthèse et réponses rapides.",
  },
  {
    value: "minimax",
    label: "MiniMax",
    model: "MiniMax-M2.1",
    description: "Excellent pour la créativité et les nuances.",
  },
  {
    value: "ollama",
    label: "Ollama (local)",
    model: "llama3.2",
    description: "IA en local sur votre machine via Ollama.",
  },
] as const;

export type AiProvider = (typeof AI_PROVIDERS)[number]["value"];

export function getProviderInfo(value?: string) {
  const match = AI_PROVIDERS.find(p => p.value === value);
  return match ?? AI_PROVIDERS[0];
}
