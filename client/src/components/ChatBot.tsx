import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  User,
  Trash2,
} from "lucide-react";
import { useChatbot } from "@/hooks/useChatbot";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";

export function ChatBot() {
  const {
    messages,
    isOpen,
    isLoading,
    suggestedPrompts,
    sendMessage,
    clearHistory,
    confirmClearOldMessages,
    showClearWarning,
    setShowClearWarning,
    totalChars,
    isNearLimit,
    toggle,
    setIsOpen,
    messagesEndRef,
  } = useChatbot();

  const [input, setInput] = useState("");
  const chatbotSetting = trpc.siteSettings.get.useQuery({
    key: "chatbot_enabled",
  });

  // En production, vérifier le setting admin. En dev, toujours afficher.
  const isEnabled = import.meta.env.DEV || chatbotSetting.data === "true";
  if (!isEnabled) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <Button
        className={cn(
          "fixed bottom-4 right-4 h-12 w-12 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14 rounded-full shadow-xl transition-all duration-300 hover:scale-105 z-50 p-0",
          isOpen
            ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            : "bg-primary hover:bg-primary/90 text-primary-foreground"
        )}
        onClick={toggle}
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {isOpen ? (
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        ) : (
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
        )}
      </Button>

      {/* Chat panel - Sheet responsive */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          className="w-full sm:w-[420px] p-0 flex flex-col"
          side="right"
        >
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <SheetTitle className="text-lg">Assistant G12</SheetTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={clearHistory}
                  title="Effacer l'historique"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <SheetDescription className="text-xs text-muted-foreground">
              Assistant IA du site G12 Paris Infos Médias
            </SheetDescription>
          </SheetHeader>

          {/* Character limit warning */}
          {isNearLimit && (
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {showClearWarning
                  ? "Limite atteinte. Voulez-vous supprimer les anciens messages ?"
                  : `Attention : ${totalChars}/16 000 caractères utilisés.`}
              </p>
              {showClearWarning ? (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={confirmClearOldMessages}
                    className="text-xs px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                  >
                    Oui, supprimer
                  </button>
                  <button
                    onClick={() => setShowClearWarning(false)}
                    className="text-xs px-3 py-1 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  onClick={clearHistory}
                  className="text-xs mt-1 text-amber-600 dark:text-amber-400 underline hover:no-underline"
                >
                  Vider l'historique
                </button>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-3 p-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-2",
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="size-7 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="size-3.5 text-primary" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-3 py-2",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-xs dark:prose-invert max-w-none">
                          <Streamdown>{message.content}</Streamdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="size-7 shrink-0 mt-1 rounded-full bg-secondary flex items-center justify-center">
                        <User className="size-3.5 text-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2">
                    <div className="size-7 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="size-3.5 text-primary" />
                    </div>
                    <div className="rounded-lg bg-muted px-3 py-2">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}

                {/* Suggestions (si pas de messages user) */}
                {messages.length <= 1 && !isLoading && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {suggestedPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(prompt)}
                        disabled={isLoading}
                        className="text-xs rounded-full bg-primary text-primary-foreground px-3 py-1.5 transition-colors hover:bg-primary/90 disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t bg-background/50 flex gap-2 items-end"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              className="flex-1 max-h-24 resize-none min-h-9 text-sm"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-9 w-9"
              aria-label="Envoyer"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
