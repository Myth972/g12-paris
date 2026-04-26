import { useState, useEffect, useRef, useCallback } from "react";
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
  Loader2
} from "lucide-react";
import { useAiProvider } from "@/hooks/useAiProvider";
import { AIProviderSelect } from "@/components/AIProviderSelect";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useBlobUpload } from "@/hooks/useBlobUpload";
import RichTextEditor from "@/components/RichTextEditor";

export default function AdminBibliothequeEditor() {
  const { user, loading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isNew = params.id === "new";
  const contentId = isNew ? null : Number(params.id);
  
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [resourceType, setResourceType] = useState("livre");
  const [theme, setTheme] = useState("etude");
  const [price, setPrice] = useState("");
  const [featured, setFeatured] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [tags, setTags] = useState<string[]>(["prière", "enseignement"]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const { activeProvider } = useAiProvider();
  const { uploadFile } = useBlobUpload();
  const utils = trpc.useUtils();

  // Load existing content
  const { data: existingArticle, isLoading: loadingContent } =
    trpc.articles.byId.useQuery({ id: contentId! }, { enabled: !!contentId });

  useEffect(() => {
    if (existingArticle) {
      setTitle(existingArticle.title);
      setSubtitle(existingArticle.excerpt ?? "");
      setContent(existingArticle.content);
      // We'll parse the category if it was structured differently, 
      // but for now let's assume it's just 'bibliothèque' and extra info is in meta or we just stick to what we have.
      // If we want to support themes and types properly, we should have columns for them.
      // Since we don't, I'll store them in the 'category' field separated by colons: "bibliothèque:livre:etude"
      if (existingArticle.category.startsWith("bibliothèque:")) {
        const parts = existingArticle.category.split(":");
        if (parts[1]) setResourceType(parts[1]);
        if (parts[2]) setTheme(parts[2]);
      }
      setCoverImageUrl(existingArticle.coverImageUrl ?? "");
      // Mocking other fields for now as they aren't in schema
    }
  }, [existingArticle]);

  const generateDescriptionMutation = trpc.ai.generateDescription.useMutation({
    onSuccess: generated => {
      setSubtitle(generated);
      toast.success("Description générée avec succès");
    },
    onError: err => toast.error(err.message || "Erreur lors de la génération"),
  });

  const createMutation = trpc.articles.create.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      toast.success("Contenu créé avec succès");
      setLocation("/admin/bibliotheque");
    },
    onError: err => toast.error(err.message || "Erreur lors de la création"),
  });

  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      toast.success("Contenu mis à jour");
      setLocation("/admin/bibliotheque");
    },
    onError: err => toast.error(err.message || "Erreur lors de la mise à jour"),
  });

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
      toast.success("Fichier téléchargé");
    } catch {
      toast.error("Erreur lors du téléchargement");
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setSaving(true);
    try {
      // Store resourceType and theme in the category field for now
      const categoryString = `bibliothèque:${resourceType}:${theme}`;
      
      const payload = {
        title: title.trim(),
        excerpt: subtitle.trim() || undefined,
        content: content.trim(),
        category: categoryString,
        coverImageUrl: coverImageUrl || undefined,
        published: true, // Auto publish for now
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

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  if (authLoading || (!isNew && loadingContent)) {
    return <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      {/* Top Bar */}
      <div className="bg-card border-b sticky top-0 z-20 shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/bibliotheque")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Éditeur Bibliothèque
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                  Brouillon
                </span>
              </div>
              <h1 className="text-xl font-bold">{isNew ? "Nouveau Contenu" : "Édition: Bible d'Étude Vie Nouvelle"}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Eye className="w-4 h-4" />
              Aperçu
            </Button>
            <Button className="gap-2" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isNew ? "Publier" : "Mettre à jour"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8 max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* AI Provider */}
            <div className="bg-card rounded-xl border p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Assistant IA pour la rédaction
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Générez vos descriptions automatiquement avec l'intelligence artificielle.
                </p>
              </div>
              <AIProviderSelect size="sm" />
            </div>

            {/* Titres & Description */}
            <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
              <h2 className="font-serif font-bold text-lg border-b pb-2">Informations Générales</h2>
              
              <div className="space-y-2">
                <label htmlFor="content-title" className="text-sm font-medium">Titre du contenu *</label>
                <Input 
                  id="content-title"
                  name="title"
                  placeholder="Ex: Bible d'Étude Vie Nouvelle" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-medium" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="content-subtitle" className="text-sm font-medium">Sous-titre / Description courte</label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[10px] gap-1 text-primary hover:bg-primary/10"
                    disabled={generateDescriptionMutation.isPending || !title}
                    onClick={() => generateDescriptionMutation.mutate({ title, contentType: resourceType })}
                  >
                    {generateDescriptionMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Rédiger avec {activeProvider.label}
                  </Button>
                </div>
                <Textarea 
                  id="content-subtitle"
                  name="subtitle"
                  placeholder="Une phrase d'accroche ou un bref résumé..." 
                  className="resize-none" 
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground text-right">{subtitle.length} / 160 caractères</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="rich-content" className="text-sm font-medium">Description Longue (Rich Text)</label>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-[10px] gap-1 text-primary hover:bg-primary/10"
                      disabled={generateDescriptionMutation.isPending || !title}
                      onClick={() => generateDescriptionMutation.mutate({ title, contentType: "description détaillée" })}
                    >
                      {generateDescriptionMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Générer avec {activeProvider.label}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 text-xs">Mode Plein Écran</Button>
                  </div>
                </div>
                <div className="border rounded-md min-h-[300px] flex flex-col bg-background overflow-hidden">
                  <RichTextEditor
                    content={content}
                    onChange={setContent}
                    placeholder="Rédigez la description détaillée..."
                    minHeight="300px"
                  />
                </div>
              </div>
            </div>

            {/* Fichiers Joints */}
            <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
              <h2 className="font-serif font-bold text-lg border-b pb-2 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-primary" />
                Médias & Fichiers
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Vignette */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Image de couverture (Vignette)</label>
                  <div 
                    className="border-2 border-dashed rounded-xl aspect-[3/4] flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors relative overflow-hidden"
                    onClick={() => document.getElementById('cover-upload')?.click()}
                  >
                    {coverImageUrl ? (
                      <>
                        <img src={coverImageUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button size="sm" variant="secondary">Remplacer</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        {uploading === 'cover' ? <Loader2 className="w-10 h-10 animate-spin text-primary" /> : <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />}
                        <span className="text-sm font-medium text-muted-foreground">{uploading === 'cover' ? 'Téléchargement...' : 'Cliquez pour parcourir'}</span>
                        <span className="text-xs text-muted-foreground/70 mt-1">JPEG, PNG • Max 5Mo</span>
                      </>
                    )}
                  </div>
                  <input id="cover-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'cover')} />
                </div>

                {/* Fichier de contenu */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fichier principal (PDF, Vidéo, Audio)</label>
                  <div 
                    className="border-2 border-dashed rounded-xl h-full min-h-[200px] flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    {fileUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-10 h-10 text-primary" />
                        <span className="text-sm font-medium truncate max-w-[150px]">{fileUrl.split('/').pop()}</span>
                        <Button size="xs" variant="outline">Changer</Button>
                      </div>
                    ) : (
                      <>
                        {uploading === 'file' ? <Loader2 className="w-10 h-10 animate-spin text-primary" /> : <UploadCloud className="w-10 h-10 text-primary mb-2" />}
                        <span className="text-sm font-medium text-primary">{uploading === 'file' ? 'Téléchargement...' : 'Sélectionner un fichier'}</span>
                        <span className="text-xs text-muted-foreground mt-2 max-w-[200px]">Si ce contenu est un fichier téléchargeable ou une vidéo hébergée</span>
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
              <h3 className="font-bold border-b pb-2">Classification</h3>
              
              <div className="space-y-2">
                <label htmlFor="resource-type" className="text-sm font-medium text-muted-foreground">Type de ressource</label>
                <Select value={resourceType} onValueChange={setResourceType}>
                  <SelectTrigger id="resource-type" name="resourceType">
                    <SelectValue placeholder="Sélectionner un type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="livre">Livre physique</SelectItem>
                    <SelectItem value="bible">Bible</SelectItem>
                    <SelectItem value="pdf">Ressource PDF</SelectItem>
                    <SelectItem value="video">Vidéo / Enseignement</SelectItem>
                    <SelectItem value="audio">Audio / Podcast</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="resource-theme" className="text-sm font-medium text-muted-foreground">Thème principal</label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="resource-theme" name="theme">
                    <SelectValue placeholder="Sélectionner un thème..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foi">Foi & Fondements</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="famille">Famille</SelectItem>
                    <SelectItem value="jeunesse">Jeunesse</SelectItem>
                    <SelectItem value="prieres">Prières & Méditation</SelectItem>
                    <SelectItem value="etude">Étude Biblique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold border-b pb-2">Mots-clés (Tags)</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-1 gap-1 flex items-center">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:bg-muted/50 rounded-full p-0.5">
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="relative">
                <Input 
                  id="tag-input"
                  name="tagInput"
                  placeholder="Ajouter un tag + Entrée" 
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  className="pr-10"
                />
                <Button size="icon" variant="ghost" className="absolute right-1 top-1 bottom-1 h-auto" onClick={(e) => addTag({ key: 'Enter', preventDefault: () => {} } as any)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Appuyez sur Entrée pour ajouter un mot-clé</p>
            </div>

            {/* Prix & E-commerce */}
            <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold border-b pb-2">Prix & Options (Optionnel)</h3>
              
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium text-muted-foreground">Prix régulier (€)</label>
                <Input 
                  id="price" 
                  name="price"
                  type="number" 
                  placeholder="0.00" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Laissez vide si gratuit</p>
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
                <label htmlFor="featured" className="text-sm font-medium select-none cursor-pointer">Mettre en avant (Bestseller / Nouveauté)</label>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
