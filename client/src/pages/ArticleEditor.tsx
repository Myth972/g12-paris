import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Image as ImageIcon,
  Shield,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { AIProviderSelect } from "@/components/AIProviderSelect";
import { useAiProvider } from "@/hooks/useAiProvider";
import { useBlobUpload } from "@/hooks/useBlobUpload";

const CATEGORIES = [
  { value: "actualité", label: "Actualité" },
  { value: "publication du jour", label: "Publication du jour" },
  { value: "culte en ligne", label: "Culte en ligne" },
  { value: "bibliothèque", label: "Bibliothèque" },
  { value: "économie", label: "Économie" },
  { value: "technologie", label: "Technologie" },
  { value: "société", label: "Société" },
];

export default function ArticleEditor() {
  const { user, loading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isNew = params.id === "new";
  const articleId = isNew ? null : Number(params.id);

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("actualité");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [published, setPublished] = useState(false);
  const [verseId, setVerseId] = useState<string>("none");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageKey, setCoverImageKey] = useState("");
  const [libType, setLibType] = useState("livre");
  const [libTheme, setLibTheme] = useState("foi");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeProvider } = useAiProvider();
  const { uploadFile } = useBlobUpload();

  const utils = trpc.useUtils();

  // Load existing article
  const { data: existingArticle, isLoading: loadingArticle } =
    trpc.articles.byId.useQuery({ id: articleId! }, { enabled: !!articleId });

  // Load verses
  const { data: versesData } = trpc.verses.adminList.useQuery();
  const verses = versesData?.items ?? [];

  // Load library metadata
  const { data: libCategories } = trpc.bibliotheque.listCategories.useQuery();
  const { data: libThemes } = trpc.bibliotheque.listThemes.useQuery();

  useEffect(() => {
    if (existingArticle) {
      setTitle(existingArticle.title);
      setExcerpt(existingArticle.excerpt ?? "");
      setContent(existingArticle.content);
      
      if (existingArticle.category.startsWith("bibliothèque")) {
        const parts = existingArticle.category.split(":");
        setCategory("bibliothèque");
        setLibType(parts[1] || "livre");
        setLibTheme(parts[2] || "foi");
      } else {
        setCategory(existingArticle.category);
      }

      setYoutubeUrl(existingArticle.youtubeUrl ?? "");
      setPublished(existingArticle.published);
      setCoverImageUrl(existingArticle.coverImageUrl ?? "");
      setCoverImageKey(existingArticle.coverImageKey ?? "");
      setVerseId(
        existingArticle.verseId ? existingArticle.verseId.toString() : "none"
      );
    }
  }, [existingArticle]);

  const suggestVerseMutation = trpc.ai.suggestVerseForArticle.useMutation({
    onSuccess: async generated => {
      // automatically create the verse in db if we accept it? No, wait!
      // I'll just create the verse right away if the user accepts it, or just create it and select it.
      createVerseMutation.mutate({
        reference: generated.reference,
        text: generated.text,
        summary: generated.summary,
      });
      toast.success("Verset suggéré avec succès !");
    },
    onError: err => toast.error(err.message || "Erreur lors de la suggestion"),
  });

  const createVerseMutation = trpc.verses.create.useMutation({
    onSuccess: newVerse => {
      utils.verses.adminList.invalidate();
      setVerseId(newVerse.id.toString());
      toast.success("Nouveau verset enregistré et sélectionné");
    },
    onError: err =>
      toast.error(err.message || "Erreur d'enregistrement du verset"),
  });

  const createMutation = trpc.articles.create.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      utils.articles.list.invalidate();
      toast.success("Article créé avec succès");
      setLocation("/admin");
    },
    onError: err => toast.error(err.message || "Erreur lors de la création"),
  });

  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      utils.articles.list.invalidate();
      toast.success("Article mis à jour");
      setLocation("/admin");
    },
    onError: err => toast.error(err.message || "Erreur lors de la mise à jour"),
  });

  const generateExcerptMutation = trpc.ai.generateDescription.useMutation({
    onSuccess: generated => {
      setExcerpt(generated);
      toast.success("Résumé généré avec succès");
    },
    onError: err => toast.error(err.message || "Erreur lors de la génération"),
  });

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const uploaderId = user?.id ?? "admin";
        const result = await uploadFile({
          file,
          folder: `articles/${uploaderId}`,
        });
        setCoverImageUrl(result.url);
        setCoverImageKey(result.key);
        toast.success("Image téléchargée");
      } catch {
        toast.error("Erreur lors du téléchargement de l'image");
      } finally {
        setUploading(false);
      }
    },
    [uploadFile, user?.id]
  );

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    if (!content.trim()) {
      toast.error("Le contenu est requis");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        excerpt: excerpt.trim() || undefined,
        content: content.trim(),
        category: category === "bibliothèque" ? `bibliothèque:${libType}:${libTheme}` : category,
        youtubeUrl: youtubeUrl.trim() || undefined,
        coverImageUrl: coverImageUrl || undefined,
        coverImageKey: coverImageKey || undefined,
        verseId: verseId && verseId !== "none" ? parseInt(verseId, 10) : null,
        published,
      };

      if (isNew) {
        await createMutation.mutateAsync(payload);
      } else if (articleId) {
        await updateMutation.mutateAsync({ id: articleId, ...payload });
      }
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (!isNew && loadingArticle)) {
    return (
      <div className="container max-w-6xl mx-auto py-10">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="container py-20 text-center">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-serif font-bold mb-2">Accès restreint</h2>
        <p className="text-muted-foreground">
          Cette page est réservée aux administrateurs.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 overflow-y-auto">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/admin")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-serif font-bold text-foreground">
                {isNew ? "Nouvel article" : "Modifier l'article"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={published}
                  onCheckedChange={setPublished}
                  id="published"
                />
                <Label htmlFor="published" className="text-sm font-medium">
                  {published ? "Publié" : "Brouillon"}
                </Label>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container max-w-6xl mx-auto py-8">
        <div className="space-y-6">
          {/* AI Provider */}
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Fournisseur IA
              </p>
              <p className="text-xs text-muted-foreground">
                Utilisé pour les résumés et suggestions de versets.
              </p>
            </div>
            <AIProviderSelect size="sm" />
          </div>
          {/* Title */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <Label className="text-sm font-semibold text-foreground mb-2 block">
              Titre de l'article *
            </Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Saisissez le titre de l'article..."
              className="text-lg font-serif"
            />
          </div>

          {/* Excerpt */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold text-foreground">
                Résumé / Chapô
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                disabled={generateExcerptMutation.isPending || !title}
                onClick={() =>
                  generateExcerptMutation.mutate({
                    title,
                    contentType: "article",
                  })
                }
              >
                {generateExcerptMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Rédiger avec {activeProvider.label}
              </Button>
            </div>
            <Textarea
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder="Un court résumé de l'article (optionnel)..."
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
            <div>
              <Label className="text-sm font-semibold text-foreground mb-2 block">
                Catégorie
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {category === "bibliothèque" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">
                    Type de ressource
                  </Label>
                  <Select value={libType} onValueChange={setLibType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {libCategories?.map(c => (
                        <SelectItem key={c.id} value={c.name} className="capitalize">{c.name}</SelectItem>
                      )) || (
                        <>
                          <SelectItem value="livre">Livre</SelectItem>
                          <SelectItem value="bible">Bible</SelectItem>
                          <SelectItem value="etude">Étude</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">
                    Thème spirituel
                  </Label>
                  <Select value={libTheme} onValueChange={setLibTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {libThemes?.map(t => (
                        <SelectItem key={t.id} value={t.name} className="capitalize">{t.name}</SelectItem>
                      )) || (
                        <>
                          <SelectItem value="foi">Foi</SelectItem>
                          <SelectItem value="prière">Prière</SelectItem>
                          <SelectItem value="famille">Famille</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Verses */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold text-foreground">
                Verset biblique lié
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] gap-1.5 text-primary hover:bg-primary/10"
                disabled={
                  suggestVerseMutation.isPending ||
                  createVerseMutation.isPending ||
                  !title ||
                  !content
                }
                onClick={() => suggestVerseMutation.mutate({ title, content })}
              >
                {suggestVerseMutation.isPending ||
                createVerseMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Suggérer avec {activeProvider.label}
              </Button>
            </div>
            <Select value={verseId} onValueChange={setVerseId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Aucun verset sélectionné" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun verset sélectionné</SelectItem>
                {verses.map((v: any) => (
                  <SelectItem key={v.id} value={v.id.toString()}>
                    {v.reference} - {v.text.substring(0, 50)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cover image */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <Label className="text-sm font-semibold text-foreground mb-3 block">
              Image de couverture
            </Label>
            {coverImageUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={coverImageUrl}
                  alt="Couverture"
                  className="w-full max-h-64 object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => {
                    setCoverImageUrl("");
                    setCoverImageKey("");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-spin" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                )}
                <p className="text-sm text-muted-foreground">
                  {uploading
                    ? "Téléchargement en cours..."
                    : "Cliquez pour ajouter une image"}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  JPG, PNG ou WebP (max 5 Mo)
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageUpload}
            />
            {!coverImageUrl && (
              <div className="mt-3">
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Ou collez une URL d'image
                </Label>
                <Input
                  placeholder="https://exemple.com/image.jpg"
                  onChange={e => setCoverImageUrl(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* YouTube URL */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <Label className="text-sm font-semibold text-foreground mb-2 block">
              Vidéo YouTube
            </Label>
            <Input
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {youtubeUrl && (
              <div className="mt-4">
                <YouTubeEmbed url={youtubeUrl} />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-2">
              <Label className="text-sm font-semibold text-foreground">
                Contenu de l'article *
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Utilisez la barre d'outils pour mettre en forme votre texte
                (titres, couleurs, alignement…)
              </p>
            </div>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Rédigez le contenu de votre article ici..."
              minHeight="400px"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={() => setLocation("/admin")}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              {isNew ? "Créer l'article" : "Enregistrer les modifications"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
