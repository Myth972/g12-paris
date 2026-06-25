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
  Wand2,
  BookHeart,
  SpellCheck,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { AIProviderSelect } from "@/components/AIProviderSelect";
import { useAiProvider } from "@/hooks/useAiProvider";
import { useBlobUpload } from "@/hooks/useBlobUpload";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
      toast.success(t('admin.articleEditor.toastVerseSuggested'));
    },
    onError: err => toast.error(err.message || t('admin.articleEditor.toastVerseError')),
  });

  const createVerseMutation = trpc.verses.create.useMutation({
    onSuccess: newVerse => {
      utils.verses.adminList.invalidate();
      setVerseId(newVerse.id.toString());
      toast.success(t('admin.articleEditor.toastVerseSaved'));
    },
    onError: err =>
      toast.error(err.message || t('admin.articleEditor.toastVerseSaveError')),
  });

  const createMutation = trpc.articles.create.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      utils.articles.list.invalidate();
      toast.success(t('admin.articleEditor.toastCreated'));
      setLocation("/admin");
    },
    onError: err => toast.error(err.message || t('admin.articleEditor.toastCreateError')),
  });

  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      utils.articles.list.invalidate();
      toast.success(t('admin.articleEditor.toastUpdated'));
      setLocation("/admin");
    },
    onError: err => toast.error(err.message || t('admin.articleEditor.toastUpdateError')),
  });

  const generateExcerptMutation = trpc.ai.generateDescription.useMutation({
    onSuccess: generated => {
      setExcerpt(generated);
      toast.success(t('admin.articleEditor.toastExcerptGenerated'));
    },
    onError: err => toast.error(err.message || t('admin.articleEditor.toastGenError')),
  });

  const improveTextMutation = trpc.ai.improveText.useMutation({
    onSuccess: improved => {
      toast.success("Texte amélioré avec succès");
    },
    onError: err => toast.error(err.message || "Erreur lors de l'amélioration"),
  });

  const spellCheckMutation = trpc.ai.spellCheck.useMutation({
    onError: err => toast.error(err.message || "Erreur lors de la correction"),
  });

  const handleImproveExcerpt = (tone: "biblical" | "normal") => {
    improveTextMutation.mutate(
      { text: excerpt, tone, field: "excerpt" },
      { onSuccess: (improved) => setExcerpt(improved) },
    );
  };

  const handleImproveContent = (tone: "biblical" | "normal") => {
    const plainText = content.replace(/<[^>]*>/g, "").trim();
    if (!plainText) { toast.error("Le contenu est vide"); return; }
    improveTextMutation.mutate(
      { text: plainText, tone, field: "content" },
      {
        onSuccess: (improved) => {
          setContent(`<p>${improved.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`);
        },
      },
    );
  };

  const handleSpellCheckExcerpt = () => {
    spellCheckMutation.mutate(
      { text: excerpt },
      { onSuccess: (corrected) => setExcerpt(corrected) },
    );
  };

  const handleSpellCheckContent = () => {
    const plainText = content.replace(/<[^>]*>/g, "").trim();
    if (!plainText) { toast.error("Le contenu est vide"); return; }
    spellCheckMutation.mutate(
      { text: plainText },
      {
        onSuccess: (corrected) => {
          setContent(`<p>${corrected.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`);
          toast.success("Orthographe corrigée");
        },
      },
    );
  };

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
        toast.success(t('admin.articleEditor.toastImageUploaded'));
      } catch {
        toast.error(t('admin.articleEditor.toastImageError'));
      } finally {
        setUploading(false);
      }
    },
    [uploadFile, user?.id]
  );

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(t('admin.articleEditor.toastTitleRequired'));
      return;
    }
    if (!content.trim()) {
      toast.error(t('admin.articleEditor.toastContentRequired'));
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
        <h2 className="text-xl font-serif font-bold mb-2">{t('admin.articleEditor.restrictedAccess')}</h2>
        <p className="text-muted-foreground">
          {t('admin.articleEditor.restrictedAccessDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="touch-manipulation"
                onClick={() => setLocation("/admin")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-base sm:text-lg font-serif font-bold text-foreground">
                {isNew ? t('admin.articleEditor.newArticle') : t('admin.articleEditor.edit')}
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={published}
                  onCheckedChange={setPublished}
                  id="published"
                />
                <Label htmlFor="published" className="text-xs sm:text-sm font-medium hidden sm:block">
                  {published ? t('admin.articleEditor.published') : t('admin.articleEditor.draft')}
                </Label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="mobile-button touch-manipulation text-sm px-3 sm:px-4">
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                <span className="hidden sm:inline">{t('admin.articleEditor.save')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container max-w-6xl mx-auto py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* AI Provider */}
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t('admin.articleEditor.aiProvider')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('admin.articleEditor.aiProviderDesc')}
              </p>
            </div>
            <AIProviderSelect size="sm" />
          </div>
          {/* Title */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm">
            <Label className="text-sm font-semibold text-foreground mb-2 block">
              {t('admin.articleEditor.articleTitle')}
            </Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('admin.articleEditor.titlePlaceholder')}
              className="text-base sm:text-lg font-serif mobile-input"
            />
          </div>

          {/* Excerpt */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <Label className="text-sm font-semibold text-foreground">
                {t('admin.articleEditor.excerpt')}
              </Label>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                  disabled={generateExcerptMutation.isPending || !title}
                  onClick={() =>
                    generateExcerptMutation.mutate({ title, contentType: "article" })
                  }
                >
                  {generateExcerptMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">Générer</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1 text-amber-600 hover:text-amber-600 hover:bg-amber-500/10"
                  disabled={improveTextMutation.isPending || !excerpt}
                  onClick={() => handleImproveExcerpt("biblical")}
                >
                  {improveTextMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <BookHeart className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">Biblique</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  disabled={improveTextMutation.isPending || !excerpt}
                  onClick={() => handleImproveExcerpt("normal")}
                >
                  <Wand2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Améliorer</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1 text-blue-600 hover:text-blue-600 hover:bg-blue-500/10"
                  disabled={spellCheckMutation.isPending || !excerpt}
                  onClick={handleSpellCheckExcerpt}
                >
                  {spellCheckMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <SpellCheck className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">Corriger</span>
                </Button>
              </div>
            </div>
            <Textarea
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder={t('admin.articleEditor.excerptPlaceholder')}
              rows={2}
              className="resize-none mobile-input text-sm break-words"
              spellCheck
            />
          </div>

          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm space-y-4">
            <div>
              <Label className="text-sm font-semibold text-foreground mb-2 block">
                {t('admin.articleEditor.category')}
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full mobile-select-trigger">
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
                    Type
                  </Label>
                  <Select value={libType} onValueChange={setLibType}>
                    <SelectTrigger className="mobile-select-trigger">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {libCategories?.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.name)} className="capitalize">{String(c.name)}</SelectItem>
                      )) || (
                        <>
                          <SelectItem value="livre">Livre</SelectItem>
                          <SelectItem value="Livres">Livres</SelectItem>
                          <SelectItem value="Livres PDF">Livres PDF</SelectItem>
                          <SelectItem value="bible">Bible</SelectItem>
                          <SelectItem value="Bibles">Bibles</SelectItem>
                          <SelectItem value="offre">Offre / Pack</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">
                    Thème
                  </Label>
                  <Select value={libTheme} onValueChange={setLibTheme}>
                    <SelectTrigger className="mobile-select-trigger">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {libThemes?.map((t: any) => (
                        <SelectItem key={t.id} value={String(t.name)} className="capitalize">{String(t.name)}</SelectItem>
                      )) || (
                        <>
                          <SelectItem value="foi">Foi</SelectItem>
                          <SelectItem value="Foi">Foi</SelectItem>
                          <SelectItem value="Leadership">Leadership</SelectItem>
                          <SelectItem value="Famille">Famille</SelectItem>
                          <SelectItem value="famille">Famille</SelectItem>
                          <SelectItem value="Etude Biblique">Étude Biblique</SelectItem>
                          <SelectItem value="prière">Prière</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Versets */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <Label className="text-sm font-semibold text-foreground">
                {t('admin.articleEditor.verse')}
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1.5 text-primary hover:bg-primary/10 touch-manipulation self-start"
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
                <span className="hidden sm:inline">IA</span>
              </Button>
            </div>
            <Select value={verseId} onValueChange={setVerseId}>
              <SelectTrigger className="w-full mobile-select-trigger">
                <SelectValue placeholder="Aucun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {verses.map((v: any) => (
                  <SelectItem key={v.id} value={v.id.toString()}>
                    {v.reference}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cover image */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm">
            <Label className="text-sm font-semibold text-foreground mb-3 block">
              {t('admin.articleEditor.coverImage')}
            </Label>
            {coverImageUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={coverImageUrl}
                  alt={t('admin.articleEditor.coverAlt')}
                  className="w-full max-h-48 sm:max-h-64 object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 touch-manipulation"
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
                className="border-2 border-dashed border-border rounded-lg p-4 sm:p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-colors touch-manipulation"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-spin" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                )}
                <p className="text-sm text-muted-foreground">
                  {uploading
                    ? t('admin.articleEditor.uploading')
                    : t('admin.articleEditor.addImage')}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {t('admin.articleEditor.jpgPngWebP')}
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
                  {t('admin.articleEditor.orUrl')}
                </Label>
                <Input
                  placeholder="https://..."
                  onChange={e => setCoverImageUrl(e.target.value)}
                  className="mobile-input"
                />
              </div>
            )}
          </div>

          {/* YouTube URL */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm">
            <Label className="text-sm font-semibold text-foreground mb-2 block">
              {t('admin.articleEditor.youtubeVideo')}
            </Label>
            <Input
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="mobile-input"
            />
            {youtubeUrl && (
              <div className="mt-4">
                <YouTubeEmbed url={youtubeUrl} />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden break-words">
            <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <Label className="text-sm font-semibold text-foreground">
                  {t('admin.articleEditor.content')}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                  {t('admin.articleEditor.contentHelp')}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1 text-amber-600 hover:text-amber-600 hover:bg-amber-500/10"
                  disabled={improveTextMutation.isPending || !content}
                  onClick={() => handleImproveContent("biblical")}
                >
                  {improveTextMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <BookHeart className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">Biblique</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  disabled={improveTextMutation.isPending || !content}
                  onClick={() => handleImproveContent("normal")}
                >
                  <Wand2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Améliorer</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1 text-blue-600 hover:text-blue-600 hover:bg-blue-500/10"
                  disabled={spellCheckMutation.isPending || !content}
                  onClick={handleSpellCheckContent}
                >
                  {spellCheckMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <SpellCheck className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">Corriger</span>
                </Button>
              </div>
            </div>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder={t('admin.articleEditor.contentPlaceholder')}
              minHeight="300px sm:400px"
              spellcheck={true}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Button variant="outline" onClick={() => setLocation("/admin")} className="w-full sm:w-auto touch-manipulation">
              {t('admin.articleEditor.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving} size="lg" className="w-full sm:w-auto mobile-button touch-manipulation">
              {saving ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              {isNew ? t('admin.articleEditor.create') : t('admin.articleEditor.save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
