import { useState, useRef, useEffect } from "react";
import { Search, Sparkles, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AISearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const searchMutation = trpc.ai.search.useMutation();
  const statusQuery = trpc.ai.status.useQuery();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || searchMutation.isPending) return;

    setHasSearched(true);
    searchMutation.mutate({ query: query.trim() });
  };

  return (
    <>
      <Button
        className="fixed bottom-4 right-4 h-12 w-12 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:scale-105 z-50 p-0"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] gap-0 p-0">
          <div className="p-6 border-b border-border/40">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Ask G12
                <span className="ml-2 text-[10px] font-medium uppercase tracking-wider flex items-center gap-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      statusQuery.isLoading
                        ? "bg-muted-foreground/50"
                        : statusQuery.data?.ok
                          ? "bg-emerald-500"
                          : "bg-red-500"
                    }`}
                  />
                  {statusQuery.isLoading
                    ? "Vérification..."
                    : statusQuery.data?.ok
                      ? `IA en ligne (${statusQuery.data?.provider})`
                      : "IA indisponible"}
                </span>
              </DialogTitle>
              <DialogDescription>
                Posez une question à notre assistant IA sur les publications or
                un sujet spirituel.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSearch}
              className="mt-4 relative flex items-center gap-2"
            >
              <Input
                autoFocus
                placeholder="Ex: Que dit la Bible sur l'amour ? ou Quels sont les derniers articles ?"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full text-base py-6 shadow-sm border-2 focus-visible:ring-primary h-14 pr-14"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 h-10 w-10 text-primary-foreground"
                disabled={!query.trim() || searchMutation.isPending}
              >
                {searchMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>

          <div className="bg-secondary/20 p-6 min-h-[250px] max-h-[500px] overflow-y-auto">
            {!hasSearched && !searchMutation.data ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground pt-12 pb-8">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p>
                  L'assistant cherche dans nos articles et la sagesse biblique
                  pour vous répondre.
                </p>
              </div>
            ) : searchMutation.isPending ? (
              <div className="h-full flex flex-col items-center justify-center text-center pt-12 pb-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground animate-pulse">
                  Recherche et réflexion en cours...
                </p>
              </div>
            ) : searchMutation.isError ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                Une erreur est survenue lors de la recherche. Veuillez
                réessayer.
              </div>
            ) : searchMutation.data ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed"
                dangerouslySetInnerHTML={{
                  // Very naive conversion of markdown paragraphs / bold text for quick display
                  __html: searchMutation.data
                    .replace(/\n\n/g, "<br/><br/>")
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                }}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
