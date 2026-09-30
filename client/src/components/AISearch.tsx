import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Sparkles, Loader2, Send, Lock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { Streamdown } from "streamdown";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  buildArticleIndex,
  searchArticles,
  type ArticleSearchDoc,
} from "@/lib/articleSearch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MAX_RESULTS = 8;

export function AISearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  // L'IA n'est sollicitée que sur demande explicite : la recherche par
  // mot-clé est locale, instantanée et sans coût d'appel.
  const [askedAi, setAskedAi] = useState(false);
  const { user } = useAuth();

  const searchMutation = trpc.ai.search.useMutation();
  const statusQuery = trpc.ai.status.useQuery();
  const indexQuery = trpc.articles.searchIndex.useQuery(undefined, {
    staleTime: 30 * 60 * 1000,
  });

  const docs = useMemo<ArticleSearchDoc[]>(
    () => (indexQuery.data as ArticleSearchDoc[]) ?? [],
    [indexQuery.data]
  );

  const index = useMemo(() => buildArticleIndex(docs), [docs]);

  // Recherche locale dès que la requête change, sans debounce : l'index
  // étant en mémoire, le coût est négligeable et le résultat instantané.
  const localResults = useMemo(
    () => (hasSearched ? searchArticles(index, query, MAX_RESULTS) : []),
    [hasSearched, index, query]
  );

  const localTotal = useMemo(
    () =>
      hasSearched && query.trim()
        ? Math.min(index.search(query.trim()).length, 999)
        : 0,
    [hasSearched, index, query]
  );

  const lastQueryRef = useRef<string>("");

  const askAi = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setAskedAi(true);
    setHasSearched(true);
    lastQueryRef.current = trimmed;
    searchMutation.mutate({ query: trimmed });
  };

  useEffect(() => {
    const handleOpen = (e: any) => {
      setOpen(true);
      if (e.detail) {
        setQuery(e.detail);
        setHasSearched(true);
        // Les tuiles Bento de la page d'accueil posent des questions :
        // on affiche d'abord les articles correspondants, l'IA est
        // déclenchée si l'utilisateur le demande.
        lastQueryRef.current = String(e.detail);
      }
    };
    window.addEventListener("open-ai-search", handleOpen);
    return () => window.removeEventListener("open-ai-search", handleOpen);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasSearched(true);
    setAskedAi(false);
    searchMutation.reset();
    lastQueryRef.current = query.trim();
  };

  const showLocal = hasSearched && !askedAi;
  const showAi = askedAi && (searchMutation.isPending || searchMutation.data);

  const closeDialog = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setHasSearched(false);
      setAskedAi(false);
      searchMutation.reset();
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-4 right-4 h-12 w-12 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:scale-105 z-50 p-0"
        onClick={() => setOpen(true)}
        aria-label="Rechercher dans le site"
      >
        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>

      <Dialog open={open} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-[600px] gap-0 p-0">
          <div className="p-6 border-b border-border/40">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Ask G12
                {!user && (
                  <span className="ml-1 text-[10px] font-medium uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                    Démo
                  </span>
                )}
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
                {user
                  ? "Recherchez dans nos publications ou posez une question à notre assistant IA."
                  : "Recherchez dans nos publications. Connectez-vous pour poser des questions à l'IA."}
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSearch}
              className="mt-4 relative flex items-center gap-2"
            >
              <Input
                autoFocus
                placeholder={
                  user
                    ? "Ex: prière, entourage,versailles"
                    : "Ex: prière, entourage, versailles"
                }
                value={query}
                onChange={e => setQuery(e.target.value)}
                maxLength={user ? 500 : 200}
                className="w-full text-base py-6 shadow-sm border-2 focus-visible:ring-primary h-14 pr-14"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 h-10 w-10 text-primary-foreground"
                disabled={!query.trim() || indexQuery.isLoading}
                aria-label="Rechercher"
              >
                {indexQuery.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>

            {hasSearched && (
              <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                <FileText className="w-3 h-3" />
                {showLocal ? (
                  <>
                    <span>
                      {localResults.length === 0
                        ? "Aucun article ne correspond."
                        : localResults.length >= MAX_RESULTS
                          ? `${localResults.length} résultats sur ${localTotal}+`
                          : `${localResults.length} article${localResults.length > 1 ? "s" : ""} trouvé${localResults.length > 1 ? "s" : ""}`}
                    </span>
                    <button
                      type="button"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                      onClick={() => askAi(query || lastQueryRef.current)}
                      disabled={searchMutation.isPending}
                    >
                      {searchMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      Demander à l'IA
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => {
                      setAskedAi(false);
                      searchMutation.reset();
                    }}
                  >
                    Revenir aux articles trouvés
                  </button>
                )}
              </div>
            )}

            {!user && !hasSearched && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-3 h-3" />
                <span>
                  Mode démo — réponses courtes.{" "}
                  <Link
                    href="/login"
                    className="text-primary hover:underline"
                    onClick={() => closeDialog(false)}
                  >
                    Se connecter
                  </Link>{" "}
                  pour un accès complet.
                </span>
              </div>
            )}
          </div>

          <div className="bg-secondary/20 p-6 min-h-[250px] max-h-[500px] overflow-y-auto">
            {!hasSearched ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground pt-12 pb-8">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p>
                  {user
                    ? "Recherchez dans nos articles, ou posez une question à l'assistant."
                    : "Recherchez parmi nos publications."}
                </p>
              </div>
            ) : showAi ? (
              searchMutation.isError ? (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                  Une erreur est survenue lors de la recherche. Veuillez
                  réessayer.
                </div>
              ) : searchMutation.isPending ? (
                <div className="h-full flex flex-col items-center justify-center text-center pt-12 pb-8">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground animate-pulse">
                    Recherche et réflexion en cours...
                  </p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed"
                >
                  <Streamdown>{searchMutation.data}</Streamdown>
                </motion.div>
              )
            ) : showLocal ? (
              localResults.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center pt-8 pb-8">
                  <Search className="w-10 h-10 mb-4 opacity-20" />
                  <p className="text-muted-foreground mb-4">
                    Aucun article ne correspond à « {query.trim()} ».
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => askAi(query || lastQueryRef.current)}
                    disabled={searchMutation.isPending}
                    className="inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Demander à l'IA
                  </Button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {localResults.map((result, i) => (
                    <motion.li
                      key={result.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.2) }}
                    >
                      <Link
                        href={`/article/${result.slug}`}
                        onClick={() => closeDialog(false)}
                        className="block rounded-lg p-3 hover:bg-accent/60 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {result.coverImageUrl ? (
                            <img
                              src={result.coverImageUrl}
                              alt=""
                              loading="lazy"
                              className="w-16 h-16 rounded-md object-cover shrink-0"
                            />
                          ) : (
                            <span className="w-16 h-16 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <FileText className="w-6 h-6" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm leading-snug line-clamp-2">
                              {result.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {result.snippet || result.excerpt}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
