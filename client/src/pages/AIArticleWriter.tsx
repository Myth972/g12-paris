import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  FileText,
  BookOpen,
  Quote,
  Search,
  Send,
  Eye,
  Edit3,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  ThumbsUp,
  ListChecks,
  XCircle,
  Image,
  Wand2,
  Upload,
  X,
} from "lucide-react";

const TONES = [
  { value: "spirituel", label: "Spirituel ✝️" },
  { value: "biblique", label: "Biblique 📖" },
  { value: "inspirationnel", label: "Inspirationnel ✨" },
  { value: "informatif", label: "Informatif 📰" },
] as const;

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
] as const;

const CATEGORIES = [
  { value: "actualité", label: "Actualité" },
  { value: "publication du jour", label: "Publication du jour" },
  { value: "culte en ligne", label: "Culte en ligne" },
  { value: "économie", label: "Économie" },
  { value: "technologie", label: "Technologie" },
  { value: "société", label: "Société" },
] as const;

type Phase = "idle" | "planning" | "writing" | "reviewing" | "enriching" | "done" | "error";

const PHASE_CONFIG: Record<Phase, { label: string; icon: typeof Sparkles }> = {
  idle: { label: "Prêt", icon: Sparkles },
  planning: { label: "Planification (Maker)", icon: Search },
  writing: { label: "Rédaction (Maker)", icon: Edit3 },
  reviewing: { label: "Vérification (Checker)", icon: Eye },
  enriching: { label: "Corrections", icon: ListChecks },
  done: { label: "Terminé", icon: CheckCircle2 },
  error: { label: "Erreur", icon: RefreshCw },
};

const PHASE_ORDER: Phase[] = ["planning", "writing", "reviewing", "enriching"];

interface ArticleReview {
  approved: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}

interface WriteArticleResult {
  title: string;
  excerpt: string;
  content: string;
  sections: string[];
  suggestedVerse: {
    reference: string;
    text: string;
    summary: string;
  } | null;
  seo: {
    metaDescription: string;
    tags: string[];
  };
  review: ArticleReview;
}

export default function AIArticleWriter() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("spirituel");
  const [language, setLanguage] = useState("fr");
  const [category, setCategory] = useState("actualité");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<WriteArticleResult | null>(null);
  const [phaseMessages, setPhaseMessages] = useState<string[]>([]);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [improvedResult, setImprovedResult] = useState<WriteArticleResult | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverPrompt, setCoverPrompt] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [selectedBiblicalPrompt, setSelectedBiblicalPrompt] = useState<string>("");
  const [imageLoopPrompt, setImageLoopPrompt] = useState("");
  const [imageLoopPhase, setImageLoopPhase] = useState<"idle" | "generating" | "editing" | "done">("idle");
  const [imageLoopResult, setImageLoopResult] = useState<string | null>(null);
  const [imageEditFeedback, setImageEditFeedback] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BIBLICAL_PROMPTS = [
    "aube dorée, lumière céleste traversant des nuages, paysage paisible, style biblique",
    "colombe blanche volant au-dessus d'une montagne verdoyante, lumière douce, paix spirituelle",
    "main ouverte laissant échapper des éclats de lumière, fond sombre, espoir et foi",
    "olivier solitaire sur une colline au coucher du soleil, tons chauds, sérénité",
    "chemin de terre traversant un champ de blé, ciel infini, lumière divine",
    "eau calme reflétant un ciel étoilé, nuit paisible, méditation spirituelle",
    "livre ouvert posé sur une table en bois, lumière tamisée, étude biblique",
    "cœur lumineux suspendu dans l'obscurité, particules scintillantes, amour divin",
    "croix en bois sur une colline verdoyante, ciel orange-pourpre au coucher du soleil",
    "vigne portant des raisins mûrs, lumière du matin, abondance et bénédiction",
    "agneau blanc dans un pré fleuri, lumière douce, innocence et pureté",
    "phare sur une falaise éclairant une mer agitée, espoir et guidance",
  ];

  const writeMutation = trpc.ai.writeArticle.useMutation({
    onSuccess: (data) => {
      setResult(data as WriteArticleResult);
      setPhase("done");
    },
    onError: (err) => {
      setPhase("error");
      toast.error(err.message);
    },
  });

  const improveMutation = trpc.ai.improveArticle.useMutation({
    onSuccess: (data) => {
      const updated = { ...currentResult!, title: data.title, excerpt: data.excerpt || currentResult!.excerpt, content: data.content };
      setResult(updated);
      setImprovedResult(updated);
      setFeedbackMode(false);
      setFeedbackText("");
      toast.success(`Améliorations appliquées !\n${data.changelog}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const coverMutation = trpc.ai.generateArticleCover.useMutation({
    onSuccess: (data) => {
      setCoverImage(data.url);
      setCoverPrompt(data.prompt);
      toast.success("Image de couverture générée !");
    },
    onError: (err) => toast.error(err.message),
  });

  const imageLoopMutation = trpc.ai.generateImageLoop.useMutation({
    onSuccess: (data) => {
      setImageLoopResult(data.url);
      setImageLoopPhase("done");
      toast.success(data.phase === "editing" ? "Image éditée avec succès !" : "Image générée !");
    },
    onError: (err) => {
      setImageLoopPhase("idle");
      toast.error(err.message);
    },
  });

  const createMutation = trpc.articles.create.useMutation({
    onSuccess: (data) => {
      toast.success("Article sauvegardé comme brouillon !");
      setLocation(`/admin/article/${(data as { id: number }).id}`);
    },
    onError: (err) => {
      toast.error(`Erreur lors de la sauvegarde: ${err.message}`);
    },
  });

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setResult(null);
    setPhaseMessages([]);
    setPhase("writing");
    addPhaseMessage("Rédaction de l'article en cours...");

    writeMutation.mutate({
      topic: topic.trim(),
      keywords: keywords.trim() || undefined,
      tone: tone as "informatif" | "spirituel" | "inspirationnel" | "biblique",
      language: language as "fr" | "en" | "es",
      category,
    });
  };

  const addPhaseMessage = (msg: string) => {
    setPhaseMessages((prev) => [...prev, msg]);
  };

  const handleSaveAsDraft = async () => {
    if (!result) return;
    createMutation.mutate({
      title: result.title,
      excerpt: result.excerpt,
      content: result.content,
      category,
      published: false,
    });
  };

  const handleRegenerate = () => {
    setResult(null);
    setPhase("idle");
    setFeedbackMode(false);
    setCoverImage(null);
    setCoverPrompt(null);
  };

  const currentResult = improvedResult || result;

  const handleImprove = () => {
    if (!currentResult || !feedbackText.trim()) return;
    improveMutation.mutate({
      title: currentResult.title,
      excerpt: currentResult.excerpt,
      content: currentResult.content,
      feedback: feedbackText.trim(),
      tone: tone as "informatif" | "spirituel" | "inspirationnel" | "biblique",
      language: language as "fr" | "en" | "es",
    });
  };

  const handleGenerateCover = (customPrompt?: string) => {
    if (!currentResult) return;
    const verseText = currentResult.suggestedVerse
      ? `${currentResult.suggestedVerse.reference} — ${currentResult.suggestedVerse.text}`
      : "";
    coverMutation.mutate({
      title: customPrompt || currentResult.title,
      excerpt: currentResult.excerpt,
      tone: tone as "informatif" | "spirituel" | "inspirationnel" | "biblique",
      verse: verseText,
    });
  };

  const handleImageLoopGenerate = () => {
    if (!imageLoopPrompt.trim()) return;
    setImageLoopPhase("generating");
    imageLoopMutation.mutate({
      prompt: imageLoopPrompt.trim(),
      referenceImage: uploadedImage || undefined,
    });
  };

  const handleImageLoopEdit = () => {
    if (!imageLoopResult || !imageEditFeedback.trim()) return;
    setImageLoopPhase("editing");
    imageLoopMutation.mutate({
      prompt: imageLoopPrompt.trim(),
      referenceImage: uploadedImage || undefined,
      editFeedback: imageEditFeedback.trim(),
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSetAsCover = () => {
    if (!imageLoopResult) return;
    setCoverImage(imageLoopResult);
    toast.success("Image définie comme couverture !");
  };

  const currentPhaseIdx = PHASE_ORDER.indexOf(
    phase === "done" || phase === "error" ? "enriching" : phase === "idle" ? "enriching" : phase
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-serif">
              Assistant de rédaction IA
            </h2>
            <p className="text-sm text-muted-foreground">
              Loop Engineering — Planification → Rédaction → Relecture → Enrichissement
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Input form */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Paramètres de l'article
              </CardTitle>
              <CardDescription>
                Décris le sujet et choisis le style
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sujet de l'article *</Label>
                <Textarea
                  placeholder="Ex: La puissance de la prière dans la vie quotidienne..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                  disabled={phase !== "idle"}
                />
              </div>

              <div className="space-y-2">
                <Label>Mots-clés (optionnel)</Label>
                <Input
                  placeholder="prière, foi, spiritualité..."
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  disabled={phase !== "idle"}
                />
              </div>

              <div className="space-y-2">
                <Label>Ton éditorial</Label>
                <Select
                  value={tone}
                  onValueChange={setTone}
                  disabled={phase !== "idle"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Langue</Label>
                <Select
                  value={language}
                  onValueChange={setLanguage}
                  disabled={phase !== "idle"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  disabled={phase !== "idle"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {phase === "idle" && (
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleGenerate}
                  disabled={!topic.trim() || writeMutation.isPending}
                >
                  {writeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Générer l'article
                </Button>
              )}

              {result && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleSaveAsDraft}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Sauvegarder
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleRegenerate}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Re-générer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loop Status */}
          {phase !== "idle" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  Loop Engineering
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {PHASE_ORDER.map((p, idx) => {
                  const isActive = phase === p;
                  const isDone = PHASE_ORDER.indexOf(phase) > idx || phase === "done";
                  const isError = phase === "error" && isActive;
                  const PhaseIcon = PHASE_CONFIG[p].icon;
                  return (
                    <div key={p} className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                          isDone
                            ? "bg-green-500 text-white"
                            : isActive
                              ? "bg-primary text-primary-foreground animate-pulse"
                              : isError
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <PhaseIcon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            isDone
                              ? "text-green-600"
                              : isActive
                                ? "text-foreground"
                                : "text-muted-foreground"
                          }`}
                        >
                          {PHASE_CONFIG[p].label}
                        </p>
                      </div>
                      {isActive && (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      )}
                      {isDone && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Result preview */}
        <div className="lg:col-span-2">
          {phase === "idle" && !result && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 rounded-xl border-2 border-dashed border-muted-foreground/20">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-primary/40" />
              </div>
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Prêt à rédiger
              </h3>
              <p className="text-sm text-muted-foreground/60 max-w-md">
                Configure les paramètres à gauche puis clique sur "Générer l'article".
                L'IA va planifier, rédiger, relire et enrichir le contenu automatiquement.
              </p>
            </div>
          )}

          {writeMutation.isPending && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 rounded-xl border bg-card">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Génération en cours...
              </h3>
              <p className="text-sm text-muted-foreground">
                {phaseMessages[phaseMessages.length - 1] || "Traitement..."}
              </p>
            </div>
          )}

          {phase === "error" && !result && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 rounded-xl border border-destructive/20 bg-destructive/5">
              <RefreshCw className="w-10 h-10 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">Erreur de génération</h3>
              <p className="text-sm text-muted-foreground mb-4">
                La génération a échoué. Vérifie ta connexion et réessaie.
              </p>
              <Button variant="outline" onClick={handleRegenerate}>
                Réessayer
              </Button>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Title */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Badge variant="default" className="mb-2 bg-blue-900 text-white hover:bg-blue-800">
                        {category}
                      </Badge>
                      <h2 className="text-2xl font-bold font-serif leading-tight">
                        {result.title}
                      </h2>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground italic border-l-4 border-primary/30 pl-4">
                    {result.excerpt}
                  </p>

                  {/* Sections */}
                  {result.sections.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <ChevronRight className="w-3 h-3" />
                        Plan de l'article
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.sections.map((section, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {idx + 1}. {section}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Content preview */}
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-lg prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: result.content.slice(0, 2000) + "..." }}
                  />
                </CardContent>
              </Card>

              {/* Checker Review */}
              {result.review && (
                <Card className={result.review.approved ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {result.review.approved ? (
                        <ThumbsUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      Vérification qualité (Checker)
                      <Badge
                        variant="outline"
                        className={`ml-auto ${result.review.approved ? "border-green-500 text-green-600" : "border-amber-500 text-amber-600"}`}
                      >
                        {result.review.score}/10
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress
                      value={result.review.score * 10}
                      className={result.review.approved ? "[&>div]:bg-green-500" : "[&>div]:bg-amber-500"}
                    />
                    {result.review.issues.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1 flex items-center gap-1 text-amber-600">
                          <XCircle className="w-3.5 h-3.5" />
                          Problèmes
                        </p>
                        <ul className="space-y-1">
                          {result.review.issues.map((issue, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5">•</span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.review.suggestions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1 flex items-center gap-1">
                          <ListChecks className="w-3.5 h-3.5 text-primary" />
                          Suggestions
                        </p>
                        <ul className="space-y-1">
                          {result.review.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Suggested Verse */}
              {result.suggestedVerse && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Quote className="w-4 h-4 text-primary" />
                      Verset suggéré
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="font-semibold text-primary">
                      {result.suggestedVerse.reference}
                    </p>
                    <blockquote className="italic text-muted-foreground border-l-4 border-primary/30 pl-4">
                      "{result.suggestedVerse.text}"
                    </blockquote>
                    <p className="text-sm text-muted-foreground">
                      {result.suggestedVerse.summary}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* SEO */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    SEO & Métadonnées
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Meta Description
                    </p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {result.seo.metaDescription}
                    </p>
                  </div>
                  {result.seo.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.seo.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-white text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cover Image */}
              {coverImage && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Image className="w-4 h-4 text-purple-500" />
                      Image de couverture
                      <Badge variant="outline" className="ml-auto text-xs">Générée par IA</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border group">
                      <img
                        src={coverImage}
                        alt="Couverture"
                        className="w-full object-cover rounded-xl transition-all duration-300"
                        style={{
                          filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                          maxHeight: "320px",
                        }}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleGenerateCover()}
                        disabled={coverMutation.isPending}
                      >
                        {coverMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Régénérer
                      </Button>
                    </div>

                    {/* Image Editor */}
                    <div
                      className="flex items-center gap-4 flex-wrap p-3 bg-muted/50 rounded-lg cursor-pointer"
                      onClick={() => setShowImageEditor(!showImageEditor)}
                    >
                      <Image className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Ajuster l'image</span>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showImageEditor ? "rotate-90" : ""}`} />
                    </div>
                    {showImageEditor && (
                      <div className="space-y-3 p-3 bg-muted/20 rounded-lg">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Luminosité</span>
                            <span>{brightness}%</span>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="200"
                            value={brightness}
                            onChange={(e) => setBrightness(Number(e.target.value))}
                            className="w-full accent-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Contraste</span>
                            <span>{contrast}%</span>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="200"
                            value={contrast}
                            onChange={(e) => setContrast(Number(e.target.value))}
                            className="w-full accent-primary"
                          />
                        </div>
                      </div>
                    )}

                    {/* Prompts bibliques prédéfinis */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Prompts bibliques prédéfinis :</p>
                      <div className="flex flex-wrap gap-1.5">
                        {BIBLICAL_PROMPTS.map((prompt, idx) => (
                          <Badge
                            key={idx}
                            variant={selectedBiblicalPrompt === prompt ? "default" : "outline"}
                            className="cursor-pointer text-xs hover:bg-primary/10 transition-colors"
                            onClick={() => {
                              setSelectedBiblicalPrompt(prompt);
                              handleGenerateCover(prompt);
                            }}
                          >
                            {prompt.split(",")[0]}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {coverPrompt && (
                      <p className="text-xs text-muted-foreground italic">
                        Prompt : {coverPrompt}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Image Loop — Génération + Édition */}
              <Card className="border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-purple-500" />
                    Image Loop — Génération & Édition
                  </CardTitle>
                  <CardDescription>Génère, édite et associe une image de couverture</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload */}
                  <div className="flex items-center gap-3">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                      <Upload className="w-3.5 h-3.5" />
                      {uploadedImage ? "Changer l'image" : "Uploader une image"}
                    </Button>
                    {uploadedImage && (
                      <div className="flex items-center gap-2">
                        <img src={uploadedImage} alt="Référence" className="w-10 h-10 rounded object-cover border" />
                        <X className="w-3.5 h-3.5 cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => setUploadedImage(null)} />
                      </div>
                    )}
                  </div>

                  {/* Prompt */}
                  <div className="space-y-2">
                    <Label>Prompt de génération</Label>
                    <Textarea
                      placeholder="Décris l'image que tu veux générer..."
                      value={imageLoopPrompt}
                      onChange={(e) => setImageLoopPrompt(e.target.value)}
                      rows={2}
                    />
                  </div>

                  {/* Generate button */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleImageLoopGenerate}
                      disabled={!imageLoopPrompt.trim() || imageLoopMutation.isPending}
                      className="gap-2"
                    >
                      {imageLoopMutation.isPending && imageLoopPhase === "generating" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Générer l'image
                    </Button>
                    {imageLoopResult && (
                      <Button variant="outline" className="gap-2" onClick={handleSetAsCover}>
                        <Image className="w-3.5 h-3.5" />
                        Définir comme couverture
                      </Button>
                    )}
                  </div>

                  {/* Result */}
                  {imageLoopResult && (
                    <>
                      <div className="relative rounded-xl overflow-hidden border">
                        <img src={imageLoopResult} alt="Générée" className="w-full object-cover rounded-xl" style={{ maxHeight: "300px" }} />
                      </div>

                      {/* Edit feedback */}
                      <div className="space-y-2">
                        <Label>Modifier l'image</Label>
                        <Textarea
                          placeholder="Ex: Rendre plus lumineux, ajouter des nuages, changer le style..."
                          value={imageEditFeedback}
                          onChange={(e) => setImageEditFeedback(e.target.value)}
                          rows={2}
                        />
                        <Button
                          variant="secondary"
                          onClick={handleImageLoopEdit}
                          disabled={!imageEditFeedback.trim() || imageLoopMutation.isPending}
                          className="gap-2"
                        >
                          {imageLoopMutation.isPending && imageLoopPhase === "editing" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          Appliquer les modifications
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Phase indicator */}
                  {imageLoopPhase !== "idle" && imageLoopPhase !== "done" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {imageLoopPhase === "generating" ? "Génération en cours..." : "Édition en cours..."}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="gap-2 flex-1"
                  onClick={handleSaveAsDraft}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Sauvegarder comme brouillon
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={() =>
                    setLocation(`/admin/article/new?title=${encodeURIComponent(currentResult!.title)}`)
                  }
                >
                  <Edit3 className="w-4 h-4" />
                  Modifier dans l'éditeur
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 bg-white text-blue-700 border-blue-300 hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-300 dark:border-blue-700"
                  onClick={() => setFeedbackMode(!feedbackMode)}
                >
                  <RefreshCw className="w-4 h-4" />
                  Feedback
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 bg-white text-blue-700 border-blue-300 hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-300 dark:border-blue-700"
                  onClick={() => handleGenerateCover()}
                  disabled={coverMutation.isPending}
                >
                  {coverMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Image className="w-4 h-4" />
                  )}
                  {coverImage ? "Regénérer l'image" : "Générer une image"}
                </Button>
              </div>

              {/* Feedback Loop */}
              {feedbackMode && (
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-amber-500" />
                      Feedback Loop — Améliorer l'article
                    </CardTitle>
                    <CardDescription>
                      Dis à l'IA ce que tu veux améliorer (titre, ton, contenu, longueur, style...)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Ex: Rendre l'introduction plus percutante, ajouter une référence à Romains 8:28, réduire à 800 mots..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleImprove}
                        disabled={!feedbackText.trim() || improveMutation.isPending}
                        className="gap-2"
                      >
                        {improveMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Appliquer les améliorations
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => { setFeedbackMode(false); setFeedbackText(""); }}
                      >
                        Annuler
                      </Button>
                    </div>
                    {improveMutation.isPending && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Amélioration en cours...
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
