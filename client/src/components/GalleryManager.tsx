import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Video,
  BookOpen,
  Crown,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlobUpload } from "@/hooks/useBlobUpload";

interface GalleryFormData {
  title: string;
  type: "image" | "video";
  mediaUrl: string;
  mediaKey?: string;
  coverImageUrl?: string;
  coverImageKey?: string;
  youtubeUrl?: string;
  verseId?: number | null;
  category: string;
  featured: boolean;
  loop: boolean;
}

function getYouTubeThumbnail(url: string) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

type FilterType = "all" | "image" | "video";

export default function GalleryManager() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [contentType, setContentType] = useState<"image" | "video">("image");
  const [formData, setFormData] = useState<GalleryFormData>({
    title: "",
    type: "image",
    mediaUrl: "",
    coverImageUrl: "",
    coverImageKey: "",
    youtubeUrl: "",
    verseId: null,
    category: "general",
    featured: true,
    loop: false,
  });

  const utils = trpc.useUtils();
  const { data: galleryData, isLoading } = trpc.gallery.listAdmin.useQuery();
  const { data: versesData } = trpc.verses.adminList.useQuery();
  const { uploadFile, isUploading } = useBlobUpload();

  const items = (galleryData?.items ?? []).filter((item: any) =>
    filterType === "all" ? true : item.type === filterType
  );
  const verses = versesData?.items ?? [];

  const createMutation = trpc.gallery.create.useMutation({
    onSuccess: () => {
      utils.gallery.listAdmin.invalidate();
      utils.gallery.list.invalidate();
      utils.gallery.featured.invalidate();
      toast.success("Élément ajouté avec succès");
      setOpen(false);
      resetForm();
    },
    onError: err => toast.error("Erreur : " + err.message),
  });

  const updateMutation = trpc.gallery.update.useMutation({
    onSuccess: () => {
      utils.gallery.listAdmin.invalidate();
      utils.gallery.list.invalidate();
      utils.gallery.featured.invalidate();
      toast.success("Média mis à jour");
      setOpen(false);
      resetForm();
    },
    onError: err => toast.error("Erreur : " + err.message),
  });

  const deleteMutation = trpc.gallery.delete.useMutation({
    onSuccess: () => {
      utils.gallery.listAdmin.invalidate();
      utils.gallery.list.invalidate();
      utils.gallery.featured.invalidate();
      toast.success("Élément supprimé");
    },
    onError: err => toast.error("Erreur : " + err.message),
  });

  const resetForm = () => {
    setFormData({
      title: "",
      type: "image",
      mediaUrl: "",
      mediaKey: "",
      coverImageUrl: "",
      coverImageKey: "",
      youtubeUrl: "",
      verseId: null,
      category: "general",
      featured: true,
      loop: false,
    });
    setContentType("image");
    setEditingId(null);
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      title: item.title || "",
      type: item.type || "image",
      mediaUrl: item.mediaUrl || "",
      mediaKey: item.mediaKey || "",
      coverImageUrl: item.coverImageUrl || "",
      coverImageKey: item.coverImageKey || "",
      youtubeUrl: item.youtubeUrl || "",
      verseId: item.verseId || null,
      category: item.category || "general",
      featured: item.featured ?? true,
      loop: item.loop ?? false,
    });
    setContentType(item.type || "image");
    setOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile({
        file,
        folder: "gallery",
      });
      setFormData(prev => ({ ...prev, mediaUrl: result.url, mediaKey: result.key || "" }));
      toast.success("Fichier uploadé avec succès");
    } catch (error) {
      toast.error(
        "Erreur d'upload : " +
          (error instanceof Error ? error.message : "Erreur inconnue")
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error("Le titre est requis");
      return;
    }
    if (contentType === "image" && !formData.mediaUrl) {
      toast.error("Veuillez uploader une image");
      return;
    }
    if (contentType === "video" && !formData.mediaUrl && !formData.youtubeUrl) {
      toast.error("Veuillez uploader une vidéo ou fournir une URL YouTube");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        title: formData.title,
        verseId: formData.verseId === null ? null : formData.verseId || undefined,
        category: formData.category,
        featured: formData.featured,
        loop: formData.loop,
        coverImageUrl: formData.coverImageUrl || undefined,
        coverImageKey: formData.coverImageKey || undefined,
        mediaUrl: formData.mediaUrl || undefined,
        mediaKey: formData.mediaKey || undefined,
        youtubeUrl: formData.youtubeUrl || undefined,
      });
    } else {
      createMutation.mutate({
        title: formData.title,
        type: contentType,
        mediaUrl: formData.mediaUrl,
        coverImageUrl: formData.coverImageUrl || undefined,
        coverImageKey: formData.coverImageKey || undefined,
        youtubeUrl: formData.youtubeUrl || undefined,
        verseId: formData.verseId || undefined,
        category: formData.category,
        featured: formData.featured,
        loop: formData.loop,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Éléments de la Galerie
          </h3>
          <p className="text-sm text-muted-foreground">
            Gérez les images et vidéos affichées dans les pages (Publication du
            Jour, etc.)
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un média
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Modifier le média" : "Ajouter à la galerie"}
                </DialogTitle>
              </DialogHeader>

              <Tabs
                value={contentType}
                onValueChange={v => setContentType(v as "image" | "video")}
                className="my-4"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="image">Image</TabsTrigger>
                  <TabsTrigger value="video">Vidéo (MP4 / YouTube)</TabsTrigger>
                </TabsList>

                <TabsContent value="image" className="space-y-4 pt-4">
                  {editingId && formData.mediaUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-border/50">
                      <img
                        src={formData.mediaUrl}
                        alt="Aperçu"
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Upload d'image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="video" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>URL YouTube (Prioritaire)</Label>
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      value={formData.youtubeUrl || ""}
                      onChange={e =>
                        setFormData({ ...formData, youtubeUrl: e.target.value })
                      }
                    />
                    {formData.youtubeUrl && (
                      <img
                        src={getYouTubeThumbnail(formData.youtubeUrl) || ""}
                        alt="Aperçu YouTube"
                        className="w-full h-24 object-cover rounded-lg mt-2"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Ou
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Upload Vidéo MP4</Label>
                    <Input
                      type="file"
                      accept="video/mp4"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <Label>Image de couverture / vignette</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const result = await uploadFile({ file, folder: "gallery/covers" });
                        setFormData(prev => ({ ...prev, coverImageUrl: result.url, coverImageKey: result.key || "" }));
                      }}
                      disabled={isUploading}
                    />
                    {formData.coverImageUrl && (
                      <img
                        src={formData.coverImageUrl}
                        alt="Aperçu couverture"
                        className="w-full h-24 object-cover rounded-lg mt-2"
                      />
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {contentType === "video" && (
                <div className="flex items-center space-x-2 py-4 border-b border-border/50">
                  <Switch
                    id="loop-mode"
                    checked={formData.loop}
                    onCheckedChange={c => setFormData({ ...formData, loop: c })}
                  />
                  <Label htmlFor="loop-mode">
                    Lecture en boucle de la vidéo
                  </Label>
                </div>
              )}

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Titre / Légende</Label>
                  <Input
                    placeholder="Titre de l'image ou de la vidéo"
                    value={formData.title}
                    onChange={e =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Associer un Verset du Jour (Optionnel)</Label>
                  <Select
                    value={
                      formData.verseId ? formData.verseId.toString() : "none"
                    }
                    onValueChange={v =>
                      setFormData({
                        ...formData,
                        verseId: v === "none" ? null : parseInt(v),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucun verset associé" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun verset</SelectItem>
                      {verses.map((v: any) => (
                        <SelectItem key={v.id} value={v.id.toString()}>
                          {v.reference}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Catégorie thématique</Label>
                  <Select
                    value={formData.category}
                    onValueChange={v =>
                      setFormData({ ...formData, category: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Général</SelectItem>
                      <SelectItem value="foi">🙏 Foi</SelectItem>
                      <SelectItem value="louange">🎵 Louange</SelectItem>
                      <SelectItem value="esperance">✨ Espérance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="featured-mode"
                    checked={formData.featured}
                    onCheckedChange={c =>
                      setFormData({ ...formData, featured: c })
                    }
                  />
                  <Label htmlFor="featured-mode">
                    À la une (Afficher dans Publication du Jour)
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending || isUploading
                  }
                >
                  {editingId
                    ? updateMutation.isPending ? "Enregistrement..." : "Enregistrer"
                    : createMutation.isPending ? "Création..." : "Ajouter"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-2 pb-2">
        {(["all", "image", "video"] as const).map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterType === t
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted border border-border/40"
            }`}
          >
            {t === "all" ? "Tous" : t === "image" ? "📷 Images" : "🎥 Vidéos"}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">Aucun média</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Média</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead>À la une</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Verset lié</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.type === "image" ? (
                        <img
                          src={item.mediaUrl}
                          alt={item.title}
                          className="w-16 h-12 object-cover rounded"
                        />
                      ) : item.youtubeUrl ? (
                        <img
                          src={getYouTubeThumbnail(item.youtubeUrl) || ""}
                          alt={item.title}
                          className="w-16 h-12 object-cover rounded bg-muted"
                          onError={e => {
                            (e.target as HTMLImageElement).style.display = "none";
                            (e.target as HTMLImageElement).parentElement!.classList.add("flex", "items-center", "justify-center", "bg-muted");
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-xs text-muted-foreground">YT</span>';
                          }}
                        />
                      ) : (
                        <video
                          src={item.mediaUrl}
                          className="w-16 h-12 object-cover rounded bg-muted"
                          preload="metadata"
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {item.title}
                    </TableCell>
                    <TableCell>
                      {item.type === "image" ? (
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Video className="w-4 h-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      {item.visible !== false ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      {item.featured && (
                        <Crown className="w-4 h-4 text-amber-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
                        {item.category === "foi" && "🙏 Foi"}
                        {item.category === "louange" && "🎵 Louange"}
                        {item.category === "esperance" && "✨ Espérance"}
                        {(!item.category || item.category === "general") && "Général"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.verseId ? (
                        <BookOpen className="w-4 h-4 text-primary" />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Modifier"
                          aria-label="Modifier"
                          onClick={() => startEdit(item)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={item.visible !== false ? "Masquer" : "Afficher"}
                          aria-label={item.visible !== false ? "Masquer" : "Afficher"}
                          onClick={() =>
                            updateMutation.mutate({
                              id: item.id,
                              visible: item.visible === false ? true : false,
                            })
                          }
                        >
                          {item.visible !== false ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            if (confirm("Supprimer ce média ?"))
                              deleteMutation.mutate({ id: item.id });
                          }}
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}