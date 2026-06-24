import { useState, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import type { Message } from "@/components/AIChatBox";

type ChatMessage = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "g12-chatbot-history";
const STORAGE_TS_KEY = "g12-chatbot-timestamp";
const MAX_MESSAGES = 30;
const EXPIRATION_DAYS = 30;

const SUGGESTED_PROMPTS = [
  "Quels sont les derniers articles ?",
  "Quel est le verset du jour ?",
  "Y a-t-il des événements à venir ?",
  "Parle-moi de G12 Paris",
  "Un verset pour m'encourager",
];

function isExpired(): boolean {
  try {
    const ts = localStorage.getItem(STORAGE_TS_KEY);
    if (!ts) return false;
    const elapsed = Date.now() - Number(ts);
    return elapsed > EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function loadHistory(): Message[] {
  try {
    if (isExpired()) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TS_KEY);
      return [];
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Message[];
    return parsed.slice(-20);
  } catch {
    return [];
  }
}

function saveHistory(messages: Message[]) {
  try {
    const toSave = messages.slice(-MAX_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    localStorage.setItem(STORAGE_TS_KEY, Date.now().toString());
  } catch {}
}

export function useChatbot() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const history = loadHistory();
    return history.length > 0
      ? history
      : [
          {
            role: "assistant",
            content:
              "Bienvenue ! Je suis l'assistant de G12 Paris Infos Médias. Comment puis-je vous aider aujourd'hui ?",
          },
        ];
  });
  const [isOpen, setIsOpen] = useState(false);
  const chatMutation = trpc.ai.chatbot.useMutation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || chatMutation.isPending) return;

      const userMessage: Message = { role: "user", content: content.trim() };
      const newMessages = [...messages, userMessage];

      setMessages(newMessages);
      saveHistory(newMessages);

      const chatMessages: ChatMessage[] = newMessages
        .filter((m): m is Message & { role: "user" | "assistant" } => m.role === "user" || m.role === "assistant")
        .slice(-MAX_MESSAGES);

      chatMutation.mutate(
        { messages: chatMessages },
        {
          onSuccess: (response) => {
            const assistantMessage: Message = {
              role: "assistant",
              content: response,
            };
            setMessages((prev) => {
              const updated = [...prev, assistantMessage];
              saveHistory(updated);
              return updated;
            });
          },
          onError: (error) => {
            const errorMessage: Message = {
              role: "assistant",
              content: error.message.includes("désactivé")
                ? "Le chatbot est actuellement désactivé par l'administrateur."
                : "Désolé, une erreur est survenue. Veuillez réessayer.",
            };
            setMessages((prev) => [...prev, errorMessage]);
          },
        }
      );
    },
    [messages, chatMutation]
  );

  const clearHistory = useCallback(() => {
    const welcome: Message[] = [
      {
        role: "assistant",
        content:
          "Bienvenue ! Je suis l'assistant de G12 Paris Infos Médias. Comment puis-je vous aider aujourd'hui ?",
      },
    ];
    setMessages(welcome);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TS_KEY);
  }, []);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    messages,
    isOpen,
    isLoading: chatMutation.isPending,
    suggestedPrompts: SUGGESTED_PROMPTS,
    sendMessage,
    clearHistory,
    toggle,
    setIsOpen,
    messagesEndRef,
  };
}
