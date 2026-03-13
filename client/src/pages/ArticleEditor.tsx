import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
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
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageKey, setCoverImageKey] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  // Load existing article
  const { data: existingArticle, isLoading: loadingArticle } = trpc.articles.byId.useQuery(
    { id: articleId! },
    { enabled: !!articleId }
  );

  useEffect(() => {
    if (existingArticle) {
      setTitle(existingArticle.title);
      setExcerpt(existingArticle.excerpt ?? "");
      setContent(existingArticle.content);
      setCategory(existingArticle.category);
      setYoutubeUrl(existingArticle.youtubeUrl ?? "");
      setPublished(existingArticle.published);
      setCoverImageUrl(existingArticle.coverImageUrl ?? "");
      setCoverImageKey(existingArticle.coverImageKey ?? "");
    }
  }, [existingArticle]);

  const createMutation = trpc.articles.create.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      utils.articles.list.invalidate();
      toast.success("Article créé avec succès");
      setLocation("/admin");
    },
    onError: (err) => toast.error(err.message || "Erreur lors de la création"),
  });

  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      utils.articles.list.invalidate();
      toast.success("Article mis à jour");
      setLocation("/admin");
    },
    onError: (err) => toast.error(err.message || "Erreur lors de la mise à jour"),
  });

  const uploadMutation = trpc.articles.uploadImage.useMutation();

  const generateExcerptMutation = trpc.ai.generateDescription.useMutation({
    onSuccess: (generated) => {
      setExcerpt(generated);
      toast.success("Résumé généré avec succès");
    },
    onError: (err) => toast.error(err.message || "Erreur lors de la génération"),
  });

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({
          base64,
          filename: file.name,
          contentType: file.type,
        });
        setCoverImageUrl(result.url);
        setCoverImageKey(result.key);
        toast.success("Image téléchargée");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Erreur lors du téléchargement de l'image");
      setUploading(false);
    }
  }, [uploadMutation]);

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
        category,
        youtubeUrl: youtubeUrl.trim() || undefined,
        coverImageUrl: coverImageUrl || undefined,
        coverImageKey: coverImageKey || undefined,
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
      <div className="container max-w-4xl mx-auto py-10">
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
        <p className="text-muted-foreground">Cette page est réservée aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
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
      <div className="container max-w-4xl mx-auto py-8">
        <div className="space-y-6">
          {/* Title */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <Label className="text-sm font-semibold text-foreground mb-2 block">
              Titre de l'article *
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
                onClick={() => generateExcerptMutation.mutate({
                  title,
                  contentType: "article"
                })}
              >
                {generateExcerptMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Rédiger avec Groq
              </Button>
            </div>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Un court résumé de l'article (optionnel)..."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Category */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <Label className="text-sm font-semibold text-foreground mb-2 block">
              Catégorie
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
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
                  {uploading ? "Téléchargement en cours..." : "Cliquez pour ajouter une image"}
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
                  onChange={(e) => setCoverImageUrl(e.target.value)}
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
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {youtubeUrl && (
              <div className="mt-4">
                <YouTubeEmbed url={youtubeUrl} />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <Label className="text-sm font-semibold text-foreground mb-2 block">
              Contenu de l'article * (Markdown supporté)
            </Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Rédigez le contenu de votre article ici... Le format Markdown est supporté."
              rows={16}
              className="font-mono text-sm leading-relaxed"
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
