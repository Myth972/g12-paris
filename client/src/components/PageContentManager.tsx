import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trash2,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  Youtube,
  Video,
  Music,
  Sparkles,
  Loader2,
} from "lucide-react";
import { extractYouTubeId } from "./YouTubeEmbed";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PageContentManagerProps {
  pageId: string;
  pageName: string;
}

export default function PageContentManager({
  pageId,
  pageName,
}: PageContentManagerProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [contentType, setContentType] = useState<
    "image" | "youtube_video" | "mp4_video"
  >("image");
  const [formData, setFormData] = useState({
    title: "",
    mediaUrl: "",
    youtubeUrl: "",
    displayOrder: 0,
    description: "",
    loop: false,
  });

  const { data, isLoading, refetch } = trpc.pageContent.adminList.useQuery({
    pageId,
    limit: 50,
  });

  const createMutation = trpc.pageContent.create.useMutation({
    onSuccess: () => {
      toast.success("Contenu créé avec succès");
      resetForm();
      refetch();
    },
    onError: error => {
      toast.error(error.message || "Erreur lors de la création");
    },
  });

  const updateMutation = trpc.pageContent.update.useMutation({
    onSuccess: () => {
      toast.success("Contenu mis à jour avec succès");
      resetForm();
      refetch();
    },
    onError: error => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    },
  });

  const deleteMutation = trpc.pageContent.delete.useMutation({
    onSuccess: () => {
      toast.success("Contenu supprimé avec succès");
      refetch();
    },
    onError: error => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });

  const uploadMutation = trpc.pageContent.uploadMedia.useMutation({
    onSuccess: result => {
      setFormData(prev => ({ ...prev, mediaUrl: result.url }));
      toast.success("Fichier uploadé avec succès");
    },
    onError: error => {
      toast.error(error.message || "Erreur lors de l'upload");
    },
  });

  const generateDescriptionMutation = trpc.ai.generateDescription.useMutation({
    onSuccess: description => {
      setFormData(prev => ({ ...prev, description }));
      toast.success("Description générée avec succès");
    },
    onError: error => {
      toast.error(error.message || "Erreur lors de la génération");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      mediaUrl: "",
      youtubeUrl: "",
      displayOrder: 0,
      description: "",
      loop: false,
    });
    setEditingId(null);
    setOpen(false);
    setContentType("image");
  };

  const handleSubmit = async () => {
    const isYoutube = contentType === "youtube_video";
    const mediaUrlToUse = isYoutube
      ? formData.mediaUrl || formData.youtubeUrl
      : formData.mediaUrl;

    if (!formData.title || !mediaUrlToUse) {
      toast.error(
        isYoutube
          ? "Veuillez saisir une URL YouTube"
          : "Veuillez remplir les champs obligatoires"
      );
      return;
    }

    const finalData = {
      ...formData,
      mediaUrl: mediaUrlToUse,
    };

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...finalData,
      });
    } else {
      createMutation.mutate({
        pageId,
        contentType,
        ...finalData,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      const base64 = (event.target?.result as string).split(",")[1];
      uploadMutation.mutate({
        base64,
        filename: file.name,
        contentType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const items = data?.items ?? [];
  const isLoading_mutation =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Contenu de {pageName}
          </h3>
          <p className="text-sm text-muted-foreground">
            Gérez les images, vidéos YouTube et vidéos MP4 de cette page
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter du contenu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Modifier le contenu" : "Ajouter du contenu"}
              </DialogTitle>
            </DialogHeader>

            <Tabs
              value={contentType}
              onValueChange={v => setContentType(v as any)}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="image">Image</TabsTrigger>
                <TabsTrigger value="youtube_video">YouTube</TabsTrigger>
                <TabsTrigger value="mp4_video">Vidéo MP4</TabsTrigger>
              </TabsList>

              <TabsContent value="image" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Upload d'image</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadMutation.isPending}
                  />
                </div>
              </TabsContent>

              <TabsContent value="youtube_video" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">URL YouTube</label>
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={formData.youtubeUrl}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        youtubeUrl: e.target.value,
                      }))
                    }
                  />
                </div>
              </TabsContent>

              <TabsContent value="mp4_video" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Upload vidéo MP4
                  </label>
                  <Input
                    type="file"
                    accept="video/mp4"
                    onChange={handleFileUpload}
                    disabled={uploadMutation.isPending}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {(contentType === "youtube_video" ||
              contentType === "mp4_video") && (
              <div className="flex items-center space-x-2 py-2">
                <Switch
                  id="loop-mode"
                  checked={formData.loop}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, loop: checked }))
                  }
                />
                <Label
                  htmlFor="loop-mode"
                  className="text-sm font-medium cursor-pointer"
                >
                  Lecture en boucle
                </Label>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Titre</label>
                <Input
                  placeholder="Titre du contenu"
                  value={formData.title}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Description (optionnel)
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                    disabled={
                      generateDescriptionMutation.isPending || !formData.title
                    }
                    onClick={() =>
                      generateDescriptionMutation.mutate({
                        title: formData.title,
                        contentType: contentType,
                      })
                    }
                  >
                    {generateDescriptionMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    Rédiger avec Groq
                  </Button>
                </div>
                <Textarea
                  placeholder="Description du contenu"
                  value={formData.description}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Ordre d'affichage</label>
                <Input
                  type="number"
                  value={formData.displayOrder}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      displayOrder: parseInt(e.target.value),
                    }))
                  }
                />
              </div>

              {formData.mediaUrl && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">
                    URL du média:
                  </p>
                  <p className="text-xs break-all font-mono">
                    {formData.mediaUrl}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={resetForm}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading_mutation}>
                {editingId ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content list */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Aucun contenu pour cette page
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item: any) => {
            const videoId =
              item.contentType === "youtube_video"
                ? extractYouTubeId(item.youtubeUrl || "")
                : null;
            const thumbnailUrl =
              item.contentType === "image"
                ? item.mediaUrl
                : videoId
                  ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
                  : null;

            return (
              <Card key={item.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Thumbnail / Icon Section */}
                  <div className="w-full sm:w-48 h-32 bg-muted flex-shrink-0 relative overflow-hidden border-b sm:border-b-0 sm:border-r border-border/50">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {item.contentType === "mp4_video" ? (
                          <Film className="w-10 h-10 text-muted-foreground/40" />
                        ) : (
                          <Video className="w-10 h-10 text-muted-foreground/40" />
                        )}
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        {item.contentType === "image" && (
                          <ImageIcon className="w-3 h-3" />
                        )}
                        {item.contentType === "youtube_video" && (
                          <Youtube className="w-3 h-3" />
                        )}
                        {item.contentType === "mp4_video" && (
                          <Film className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <CardHeader className="pb-3 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base line-clamp-1">
                            {item.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            {item.contentType === "image" && "📷 Image"}
                            {item.contentType === "youtube_video" &&
                              "🎥 Vidéo YouTube"}
                            {item.contentType === "mp4_video" && "🎬 Vidéo MP4"}
                            <span className="w-1 h-1 rounded-full bg-border" />
                            Ordre: {item.displayOrder}
                          </CardDescription>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-4 pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setFormData({
                                title: item.title,
                                mediaUrl: item.mediaUrl,
                                youtubeUrl: item.youtubeUrl || "",
                                displayOrder: item.displayOrder,
                                description: item.description || "",
                                loop: item.loop || false,
                              });
                              setEditingId(item.id);
                              setContentType(item.contentType as any);
                              setOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() =>
                              deleteMutation.mutate({ id: item.id })
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
