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
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlobUpload } from "@/hooks/useBlobUpload";

interface GalleryFormData {
  title: string;
  type: "image" | "video";
  mediaUrl: string;
  youtubeUrl?: string;
  verseId?: number | null;
  featured: boolean;
  loop: boolean;
}

export default function GalleryManager() {
  const [open, setOpen] = useState(false);
  const [contentType, setContentType] = useState<"image" | "video">("image");
  const [formData, setFormData] = useState<GalleryFormData>({
    title: "",
    type: "image",
    mediaUrl: "",
    youtubeUrl: "",
    verseId: null,
    featured: true,
    loop: false,
  });

  const utils = trpc.useUtils();
  const { data: galleryData, isLoading } = trpc.gallery.listAdmin.useQuery();
  const { data: versesData } = trpc.verses.adminList.useQuery();
  const { uploadFile, isUploading } = useBlobUpload();

  const items = galleryData?.items ?? [];
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
      youtubeUrl: "",
      verseId: null,
      featured: true,
      loop: false,
    });
    setContentType("image");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile({
        file,
        folder: "gallery",
      });
      setFormData(prev => ({ ...prev, mediaUrl: result.url }));
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

    createMutation.mutate({
      ...formData,
      type: contentType,
      verseId: formData.verseId || undefined,
    });
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
                <DialogTitle>Ajouter à la galerie</DialogTitle>
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
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                    disabled={
                      createMutation.isPending || isUploading
                    }
                >
                  {createMutation.isPending ? "Création..." : "Ajouter"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Média</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead>À la une</TableHead>
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
                      <div className="w-16 h-12 bg-muted rounded flex items-center justify-center text-xs">
                        YT
                      </div>
                    ) : (
                      <video
                        src={item.mediaUrl}
                        className="w-16 h-12 object-cover rounded"
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
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
                        title={item.visible !== false ? "Masquer" : "Afficher"}
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
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
