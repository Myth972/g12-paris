import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Image as ImageIcon, 
  FileText, 
  UploadCloud,
  X,
  Plus,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  EyeOff,
  FileEdit,
  Keyboard,
  Megaphone,
} from "lucide-react";
import { useAiProvider } from "@/hooks/useAiProvider";
import { AIProviderSelect } from "@/components/AIProviderSelect";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useBlobUpload } from "@/hooks/useBlobUpload";
import { useTranslation } from "react-i18next";
import RichTextEditor from "@/components/RichTextEditor";

export default function AdminBibliothequeEditor() {
  const { user, loading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isNew = params.id === "new";
  const { t } = useTranslation();
  const contentId = isNew ? null : Number(params.id);
  
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  // Determine initial type from query params if new
  const searchParams = new URLSearchParams(window.location.search);
  const initialType = isNew ? (searchParams.get("type") || "livre") : "livre";
  const [resourceType, setResourceType] = useState(initialType);
  const [selectedThemes, setSelectedThemes] = useState<string[]>(["etude"]);
  const [price, setPrice] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [featured, setFeatured] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [tags, setTags] = useState<string[]>(["prière", "seignement"]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Détails du livre
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [language, setLanguage] = useState("français");
  const [bookFormat, setBookFormat] = useState("ebook");
  const [publishedDate, setPublishedDate] = useState("");
  const [isbn, setIsbn] = useState("");
  const [pageCount, setPageCount] = useState("");

  const { activeProvider } = useAiProvider();
  const { uploadFile } = useBlobUpload();
  const utils = trpc.useUtils();

  // Load library metadata
  const { data: libCategories } = trpc.bibliotheque.listCategories.useQuery();
  const { data: libThemes } = trpc.bibliotheque.listThemes.useQuery();

  // Load existing content
  const { data: existingArticle, isLoading: loadingContent } =
    trpc.articles.byId.useQuery({ id: contentId! }, { enabled: !!contentId });

  useEffect(() => {
    if (existingArticle) {
      setTitle(existingArticle.title);
      setSubtitle(existingArticle.excerpt ?? "");
      setContent(existingArticle.content);
      if (existingArticle.category.startsWith("bibliothèque:")) {
        const parts = existingArticle.category.split(":");
        if (parts[1]) setResourceType(parts[1]);
        if (parts[2]) {
          const themesList = parts.slice(2).filter((part: string) => part);
          setSelectedThemes(themesList.length > 0 ? themesList : ["etude"]);
        }
      }
      setCoverImageUrl(existingArticle.coverImageUrl ?? "");
      setPrice(existingArticle.price ? (existingArticle.price / 100).toString() : "");
      setAffiliateUrl((existingArticle as any).affiliateUrl ?? "");
      
      // Charger les détails du livre depuis meta
      const meta = JSON.parse(existingArticle.meta || "{}");
      if (meta.author) setAuthor(meta.author);
      if (meta.publisher) setPublisher(meta.publisher);
      if (meta.language) setLanguage(meta.language);
      if (meta.format) setBookFormat(meta.format);
      if (meta.publishedDate) setPublishedDate(meta.publishedDate);
      if (meta.isbn) setIsbn(meta.isbn);
      if (meta.pageCount) setPageCount(meta.pageCount.toString());
      if (meta.tags) setTags(meta.tags);
    }
  }, [existingArticle]);

  const generateDescriptionMutation = trpc.ai.generateDescription.useMutation({
    onSuccess: generated => {
      setSubtitle(generated);
      toast.success(t('admin.bibliothequeEditor.toastGenerated'));
    },
    onError: err => toast.error(err.message || t('admin.bibliothequeEditor.toastGenError')),
  });

  const createMutation = trpc.articles.create.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      toast.success(t('admin.bibliothequeEditor.toastCreated'));
      setLocation("/admin/bibliotheque");
    },
    onError: err => toast.error(err.message || t('admin.bibliothequeEditor.toastCreateError')),
  });

  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      toast.success(t('admin.bibliothequeEditor.toastUpdated'));
      setLocation("/admin/bibliotheque");
    },
    onError: err => toast.error(err.message || t('admin.bibliothequeEditor.toastUpdateError')),
  });

  const addToAnnouncementsMutation = trpc.announcements.create.useMutation({
    onSuccess: () => {
      utils.announcements.adminList.invalidate();
      utils.announcements.list.invalidate();
      toast.success(t('admin.bibliothequeEditor.toastBookAdded'));
    },
    onError: (err) => toast.error(err.message || t('admin.bibliothequeEditor.toastUploadError2')),
  });
  const updateAnnouncementMutation = trpc.announcements.update.useMutation({
    onSuccess: () => {
      utils.announcements.adminList.invalidate();
      utils.announcements.list.invalidate();
      toast.success(t('admin.bibliothequeEditor.toastAnnouncementUpdated'));
    },
    onError: (err) => toast.error(err.message || t('admin.bibliothequeEditor.toastUploadError2')),
  });
  const addToAnnouncementsPending = addToAnnouncementsMutation.isPending || updateAnnouncementMutation.isPending;

  const [isInAnnouncements, setIsInAnnouncements] = useState(false);
  const [announcementId, setAnnouncementId] = useState<number | null>(null);

  // Check if this book is already in announcements
  const { data: existingAnnouncements } = trpc.announcements.adminList.useQuery({ type: "announcement" });
  useEffect(() => {
    if (!existingAnnouncements) return;
    const match = existingAnnouncements.find((a: any) =>
      contentId ? a.ctaHref === `/bibliotheque/${contentId}` : a.title === title.trim()
    );
    if (match) {
      setIsInAnnouncements(true);
      setAnnouncementId(match.id);
    }
  }, [existingAnnouncements, contentId, title]);

  const handleAddToAnnouncements = async () => {
    if (!title.trim() || !coverImageUrl) {
      toast.error(t('admin.bibliothequeEditor.toastCoverRequired'));
      return;
    }
    const meta = {
      author: author.trim() || undefined,
      publisher: publisher.trim() || undefined,
    };
    const payload = {
      type: "announcement" as const,
      title: title.trim(),
      description: subtitle.trim() || (meta.author ? `Par ${meta.author}` : "Livre du mois G12 Paris"),
      mediaUrl: coverImageUrl,
      badge: "Livre du mois",
      ctaLabel: "Découvrir",
      ctaHref: `/bibliotheque/${contentId || ""}`,
      variant: "poster" as const,
    };
    if (announcementId) {
      await updateAnnouncementMutation.mutateAsync({ id: announcementId, ...payload });
    } else {
      const result = await addToAnnouncementsMutation.mutateAsync(payload);
      setAnnouncementId(result.id);
    }
    setIsInAnnouncements(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(type);
    try {
      const uploaderId = user?.id ?? "admin";
      const result = await uploadFile({
        file,
        folder: `bibliotheque/${uploaderId}`,
      });
      if (type === 'cover') setCoverImageUrl(result.url);
      if (type === 'file') setFileUrl(result.url);
      toast.success(t('admin.bibliothequeEditor.toastFileDownloaded'));
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err?.message || t('admin.bibliothequeEditor.toastUploadError'));
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(t('admin.bibliothequeEditor.toastTitleRequired'));
      return;
    }

    setSaving(true);
    try {
      const categoryString = `bibliothèque:${resourceType}:${selectedThemes.join(":")}`;
      
      const meta = {
        author: author.trim() || undefined,
        publisher: publisher.trim() || undefined,
        language,
        format: bookFormat,
        publishedDate: publishedDate.trim() || undefined,
        isbn: isbn.trim() || undefined,
        pageCount: pageCount ? parseInt(pageCount) : undefined,
        tags: tags.length > 0 ? tags : undefined,
      };
      
      const payload = {
        title: title.trim(),
        excerpt: subtitle.trim() || undefined,
        content: content.trim(),
        category: categoryString,
        coverImageUrl: coverImageUrl || undefined,
        price: price ? Math.round(parseFloat(price) * 100) : undefined,
        affiliateUrl: affiliateUrl.trim() || undefined,
        published: true,
        meta: JSON.stringify(meta),
      };

      if (isNew) {
        await createMutation.mutateAsync(payload);
      } else if (contentId) {
        await updateMutation.mutateAsync({ id: contentId, ...payload });
      }
    } finally {
      setSaving(false);
    }
  };

  const addTag = (e: any) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      if (e.preventDefault) e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (e: React.MouseEvent, tagToRemove: string) => {
    e.preventDefault();
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Auto-save draft every 30 seconds if there are unsaved changes
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!hasUnsavedChanges || !title.trim() || autoSaveStatus === "saving") return;
      
      setAutoSaveStatus("saving");
      try {
        const categoryString = `bibliothèque:${resourceType}:${selectedThemes.join(":")}`;
        const meta = {
          author: author.trim() || undefined,
          publisher: publisher.trim() || undefined,
          language,
          format: bookFormat,
          publishedDate: publishedDate.trim() || undefined,
          isbn: isbn.trim() || undefined,
          pageCount: pageCount ? parseInt(pageCount) : undefined,
          tags: tags.length > 0 ? tags : undefined,
        };
        
        const payload = {
          title: title.trim(),
          excerpt: subtitle.trim() || undefined,
          content: content.trim(),
          category: categoryString,
          coverImageUrl: coverImageUrl || undefined,
          price: price ? Math.round(parseFloat(price) * 100) : undefined,
          affiliateUrl: affiliateUrl.trim() || undefined,
          published: false,
          meta: JSON.stringify(meta),
        };
        
        if (isNew) {
          await createMutation.mutateAsync({ ...payload, content: payload.content || " " });
        } else if (contentId) {
          await updateMutation.mutateAsync({ id: contentId, ...payload });
        }
        setAutoSaveStatus("saved");
        setLastAutoSave(new Date());
        setHasUnsavedChanges(false);
        setTimeout(() => setAutoSaveStatus("idle"), 3000);
      } catch {
        setAutoSaveStatus("error");
        setTimeout(() => setAutoSaveStatus("idle"), 5000);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [hasUnsavedChanges, title, subtitle, content, resourceType, selectedThemes, author, publisher, language, bookFormat, publishedDate, isbn, pageCount, tags, coverImageUrl, price, affiliateUrl, contentId, isNew]);

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [title, subtitle, content, resourceType, selectedThemes, author, publisher, language, bookFormat, publishedDate, isbn, pageCount, tags, coverImageUrl, price, affiliateUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [title, subtitle, content]);

  if (authLoading || (!isNew && loadingContent)) {
    return <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      {/* Top Bar */}
      <div className="bg-card border-b sticky top-0 z-20 shadow-sm">
        <div className="container py-2 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="touch-manipulation" onClick={() => setLocation("/admin/bibliotheque")} aria-label="Retour">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-base sm:text-xl font-bold truncate max-w-[150px] sm:max-w-none">
                {isNew ? t('admin.bibliothequeEditor.new') : t('admin.bibliothequeEditor.edit')}
              </h1>
              {lastAutoSave && (
                <p className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {lastAutoSave.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            {autoSaveStatus === "saving" && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
              </span>
            )}
            {autoSaveStatus === "saved" && (
              <span className="text-xs text-green-600 flex items-center gap-1 hidden sm:flex">
                <CheckCircle2 className="w-3 h-3" />
              </span>
            )}
            {autoSaveStatus === "error" && (
              <span className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
              </span>
            )}
            {hasUnsavedChanges && autoSaveStatus === "idle" && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <FileEdit className="w-3 h-3" />
              </span>
            )}
            <Button variant="outline" className="gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation" onClick={() => setIsPreviewMode(!isPreviewMode)}>
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">{isPreviewMode ? t('admin.bibliothequeEditor.editMode') : t('admin.bibliothequeEditor.preview')}</span>
            </Button>
            <Button className="gap-1 sm:gap-2 text-xs sm:text-sm mobile-button touch-manipulation" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isNew ? t('admin.bibliothequeEditor.publish') : t('admin.bibliothequeEditor.update')}
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-4 sm:py-8 max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">

            {/* AI Provider */}
            <div className="bg-card rounded-xl border p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">{t('admin.bibliothequeEditor.aiAssistant')}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                  {t('admin.bibliothequeEditor.aiDesc')}
                </p>
              </div>
              <AIProviderSelect size="sm" />
            </div>

            {/* Titres & Description */}
            <div className="bg-card border rounded-xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
              <h2 className="font-serif font-bold text-base sm:text-lg border-b pb-2">{t('admin.bibliothequeEditor.infoTitle')}</h2>

              <div className="space-y-2">
                <label htmlFor="content-title" className="text-sm font-medium">{t('admin.bibliothequeEditor.titleLabel')}</label>
                <Input
                  id="content-title"
                  name="title"
                  placeholder={t('admin.bibliothequeEditor.titlePlaceholder')} 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-base font-medium mobile-input"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="content-subtitle" className="text-sm font-medium">{t('admin.bibliothequeEditor.subtitleLabel')}</label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[10px] gap-1 text-primary hover:bg-primary/10"
                    disabled={generateDescriptionMutation.isPending || !title}
                    onClick={() => generateDescriptionMutation.mutate({ title, contentType: resourceType })}
                  >
                    {generateDescriptionMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {t('admin.bibliothequeEditor.writeWith', { provider: activeProvider.label })}
                  </Button>
                </div>
                <Textarea 
                  id="content-subtitle"
                  name="subtitle"
                  placeholder={t('admin.bibliothequeEditor.subtitlePlaceholder')} 
                  className="resize-none" 
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground text-right">{t('admin.bibliothequeEditor.charCount', { count: subtitle.length })}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="rich-content" className="text-sm font-medium">{t('admin.bibliothequeEditor.longDescription')}</label>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-[10px] gap-1 text-primary hover:bg-primary/10"
                      disabled={generateDescriptionMutation.isPending || !title}
                      onClick={() => generateDescriptionMutation.mutate({ title, contentType: "description détaillée" })}
                    >
                      {generateDescriptionMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {t('admin.bibliothequeEditor.generateWith', { provider: activeProvider.label })}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 text-xs">{t('admin.bibliothequeEditor.fullScreenMode')}</Button>
                  </div>
                </div>
                <div className="border rounded-md min-h-[300px] flex flex-col bg-background overflow-hidden">
                  <RichTextEditor
                    content={content}
                    onChange={setContent}
                    placeholder={t('admin.bibliothequeEditor.richTextPlaceholder')}
                    minHeight="300px"
                  />
                </div>
              </div>
            </div>

            {/* Détails du livre */}
            <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
              <h2 className="font-serif font-bold text-lg border-b pb-2">{t('admin.bibliothequeEditor.bookDetails')}</h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="author" className="text-sm font-medium">{t('admin.bibliothequeEditor.author')}</label>
                  <Input 
                    id="author"
                    placeholder={t('admin.bibliothequeEditor.authorPlaceholder')} 
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="publisher" className="text-sm font-medium">{t('admin.bibliothequeEditor.publisher')}</label>
                  <Input 
                    id="publisher"
                    placeholder={t('admin.bibliothequeEditor.publisherPlaceholder')} 
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="language" className="text-sm font-medium">{t('admin.bibliothequeEditor.language')}</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="français">Français</SelectItem>
                      <SelectItem value="anglais">Anglais</SelectItem>
                      <SelectItem value="espagnol">Espagnol</SelectItem>
                      <SelectItem value="portugais">Portugais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="book-format" className="text-sm font-medium">{t('admin.bibliothequeEditor.format')}</label>
                  <Select value={bookFormat} onValueChange={setBookFormat}>
                    <SelectTrigger id="book-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ebook">ebook (Kindle)</SelectItem>
                      <SelectItem value="broché">Broché</SelectItem>
                      <SelectItem value="relié">Relié</SelectItem>
                      <SelectItem value="audio">Audiobook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="published-date" className="text-sm font-medium">{t('admin.bibliothequeEditor.publicationDate')}</label>
                  <Input 
                    id="published-date"
                    type="date"
                    value={publishedDate}
                    onChange={(e) => setPublishedDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="isbn" className="text-sm font-medium">{t('admin.bibliothequeEditor.isbn')}</label>
                  <Input 
                    id="isbn"
                    placeholder={t('admin.bibliothequeEditor.isbnPlaceholder')} 
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="page-count" className="text-sm font-medium">{t('admin.bibliothequeEditor.pageCount')}</label>
                  <Input 
                    id="page-count"
                    type="number"
                    placeholder={t('admin.bibliothequeEditor.pageCountPlaceholder')} 
                    value={pageCount}
                    onChange={(e) => setPageCount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Fichiers Joints */}
            <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
              <h2 className="font-serif font-bold text-lg border-b pb-2 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-primary" />
                {t('admin.bibliothequeEditor.mediaFiles')}
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Vignette */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('admin.bibliothequeEditor.coverImage')}</label>
                  <div 
                    className="border-2 border-dashed rounded-xl aspect-[3/4] flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors relative overflow-hidden"
                    onClick={() => document.getElementById('cover-upload')?.click()}
                  >
                    {coverImageUrl ? (
                      <>
                        <img src={coverImageUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover object-center" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button size="sm" variant="secondary">{t('admin.bibliothequeEditor.replace')}</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        {uploading === 'cover' ? <Loader2 className="w-10 h-10 animate-spin text-primary" /> : <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />}
                        <span className="text-sm font-medium text-muted-foreground">{uploading === 'cover' ? t('admin.bibliothequeEditor.uploading') : t('admin.bibliothequeEditor.clickToBrowse')}</span>
                        <span className="text-xs text-muted-foreground/70 mt-1">{t('admin.bibliothequeEditor.jpegPngMax')}</span>
                      </>
                    )}
                  </div>
                  <input id="cover-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'cover')} />
                </div>

                {/* Fichier de contenu */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('admin.bibliothequeEditor.mainFile')}</label>
                  <div 
                    className="border-2 border-dashed rounded-xl h-full min-h-[200px] flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    {fileUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-10 h-10 text-primary" />
                        <span className="text-sm font-medium truncate max-w-[150px]">{fileUrl.split('/').pop()}</span>
                        <Button size="sm" variant="outline">{t('admin.bibliothequeEditor.changeFile')}</Button>
                      </div>
                    ) : (
                      <>
                        {uploading === 'file' ? <Loader2 className="w-10 h-10 animate-spin text-primary" /> : <UploadCloud className="w-10 h-10 text-primary mb-2" />}
                        <span className="text-sm font-medium text-primary">{uploading === 'file' ? t('admin.bibliothequeEditor.uploading') : t('admin.bibliothequeEditor.selectFile')}</span>
                        <span className="text-xs text-muted-foreground mt-2 max-w-[200px]">{t('admin.bibliothequeEditor.fileUploadHelp')}</span>
                      </>
                    )}
                  </div>
                  <input id="file-upload" type="file" className="hidden" accept=".pdf,.mp4,.mp3,.wav" onChange={(e) => handleUpload(e, 'file')} />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            
            {/* Classification */}
            <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold border-b pb-2">{t('admin.bibliothequeEditor.classification')}</h3>
              
              <div className="space-y-2">
                <label htmlFor="resource-type" className="text-sm font-medium text-muted-foreground">{t('admin.bibliothequeEditor.resourceType')}</label>
                <Select value={resourceType} onValueChange={setResourceType}>
                  <SelectTrigger id="resource-type" name="resourceType">
                    <SelectValue placeholder={t('admin.bibliothequeEditor.selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offre">Offre / Pack</SelectItem>
                    {libCategories?.map((c: any) => (
                      <SelectItem key={c.id} value={c.name} className="capitalize">{c.name}</SelectItem>
                    )) || (
                      <>
                        <SelectItem value="livre">Livre</SelectItem>
                        <SelectItem value="Livres">Livres</SelectItem>
                        <SelectItem value="Livres PDF">Livres PDF</SelectItem>
                        <SelectItem value="bible">Bible</SelectItem>
                        <SelectItem value="Bibles">Bibles</SelectItem>
                        <SelectItem value="etude">Étude</SelectItem>
                        <SelectItem value="etude-biblique">Étude Biblique</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{t('admin.bibliothequeEditor.themes')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(libThemes?.map((theme: any) => theme.name) || ["foi", "Foi", "Leadership", "Famille", "famille", "Etude Biblique", "bibles", "prière", "prophétie", "évangélisation", "guérison", "finance", "danse", "louange"]).map((themeOption: string) => (
                    <label key={themeOption} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedThemes.includes(themeOption)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedThemes([...selectedThemes, themeOption]);
                          } else {
                            setSelectedThemes(selectedThemes.filter(theme => theme !== themeOption));
                          }
                        }}
                        className="rounded border-input text-primary focus:ring-primary w-4 h-4" 
                      />
                      <span className="text-sm capitalize">{themeOption}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold border-b pb-2">{t('admin.bibliothequeEditor.tags')}</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-1 gap-1 flex items-center">
                    {tag}
                    <button type="button" onClick={(e) => removeTag(e, tag)} className="hover:bg-muted/50 rounded-full p-0.5">
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="relative">
                <Input 
                  id="tag-input"
                  name="tagInput"
                  placeholder={t('admin.bibliothequeEditor.addTagPlaceholder')} 
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  className="pr-10"
                />
                <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1 bottom-1 h-auto" onClick={(e) => addTag({ key: 'Enter', preventDefault: () => e.preventDefault() } as any)} aria-label="Ajouter un tag">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t('admin.bibliothequeEditor.addTagHelp')}</p>
            </div>

            {/* Prix & E-commerce */}
            <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold border-b pb-2">{t('admin.bibliothequeEditor.priceOptions')}</h3>
              
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium text-muted-foreground">{t('admin.bibliothequeEditor.regularPrice')}</label>
                <Input 
                  id="price" 
                  name="price"
                  type="number" 
                  placeholder="0.00" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t('admin.bibliothequeEditor.leaveEmptyFree')}</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="affiliateUrl" className="text-sm font-medium text-muted-foreground">{t('admin.bibliothequeEditor.affiliateLink')}</label>
                <Input 
                  id="affiliateUrl" 
                  name="affiliateUrl"
                  type="url" 
                  placeholder="https://amazon.fr/..." 
                  value={affiliateUrl}
                  onChange={(e) => setAffiliateUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t('admin.bibliothequeEditor.affiliateHelp')}</p>
              </div>
              
              <div className="flex items-center gap-2 pt-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  id="featured" 
                  name="featured"
                  className="rounded text-primary focus:ring-primary w-4 h-4" 
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                />
                <label htmlFor="featured" className="text-sm font-medium select-none cursor-pointer">{t('admin.bibliothequeEditor.featured')}</label>
              </div>
            </div>

            {/* Ajouter aux annonces */}
            <div className="bg-card border rounded-xl p-6 shadow-sm space-y-3">
              <h3 className="font-bold border-b pb-2 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary" />
                {t('admin.bibliothequeEditor.bookOfMonth')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('admin.bibliothequeEditor.addToAnnouncements')}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5 text-xs"
                disabled={!coverImageUrl || !title.trim() || addToAnnouncementsPending}
                onClick={handleAddToAnnouncements}
              >
                {addToAnnouncementsPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                {isInAnnouncements ? t('admin.bibliothequeEditor.updateAnnouncement') : t('admin.bibliothequeEditor.addAnnouncement')}
              </Button>
            </div>

            {/* SEO Score */}
            {(() => {
              const issues: string[] = [];
              const suggestions: string[] = [];
              
              if (!title.trim()) {
                  issues.push(t('admin.bibliothequeEditor.seoIssues.titleMissing'));
              } else if (title.length < 30) {
                  suggestions.push(t('admin.bibliothequeEditor.seoIssues.titleShort'));
              } else if (title.length > 60) {
                  suggestions.push(t('admin.bibliothequeEditor.seoIssues.titleLong'));
              }
              
              if (!subtitle.trim()) {
                  suggestions.push(t('admin.bibliothequeEditor.seoIssues.descMissing'));
              } else if (subtitle.length < 80) {
                  suggestions.push(t('admin.bibliothequeEditor.seoIssues.descShort'));
              }
              
              if (!content.trim() || content.length < 200) {
                  suggestions.push(t('admin.bibliothequeEditor.seoIssues.contentShort'));
              }
              
              if (!coverImageUrl) {
                  suggestions.push(t('admin.bibliothequeEditor.seoIssues.noCover'));
              }
              
              if (!price && resourceType !== "offre") {
                  suggestions.push(t('admin.bibliothequeEditor.seoIssues.noPrice'));
              }
              
              const score = Math.max(0, 100 - (issues.length * 20) - (suggestions.length * 5));
              
              return (
                <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold border-b pb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    {t('admin.bibliothequeEditor.seoAnalysis')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('admin.bibliothequeEditor.seoScore')}</span>
                      <span className={`text-lg font-bold ${score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        {score}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    {issues.length > 0 && (
                      <div className="space-y-1">
                        {issues.map((issue, i) => (
                          <p key={i} className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {issue}
                          </p>
                        ))}
                      </div>
                    )}
                    {suggestions.length > 0 && (
                      <div className="space-y-1">
                        {suggestions.map((suggestion, i) => (
                          <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> {suggestion}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      </div>
    </div>
  );
}
