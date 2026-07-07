import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, BookOpen, Sparkles, Loader2, Pencil, Image, Upload } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AIProviderSelect } from "@/components/AIProviderSelect";
import { useAiProvider } from "@/hooks/useAiProvider";
import { useBlobUpload } from "@/hooks/useBlobUpload";

export default function VersesManager() {
  const [isOpen, setIsOpen] = useState(false);
  const formDefaults = { reference: "", text: "", summary: "", imageUrl: "" };
  const [formData, setFormData] = useState({ ...formDefaults });
  const [editOpen, setEditOpen] = useState(false);
  const [editingVerse, setEditingVerse] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({ ...formDefaults });
  const utils = trpc.useUtils();
  const { activeProvider } = useAiProvider();
  const { uploadFile, isUploading } = useBlobUpload();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "create" | "edit") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadFile({ file, folder: "verses" });
    if (target === "create") {
      setFormData(prev => ({ ...prev, imageUrl: result.url }));
    } else {
      setEditFormData(prev => ({ ...prev, imageUrl: result.url }));
    }
  };

  const { data, isLoading } = trpc.verses.adminList.useQuery();
  const verses = data?.items ?? [];

  const createMutation = trpc.verses.create.useMutation({
    onSuccess: () => {
      utils.verses.adminList.invalidate();
      toast.success("Verset créé avec succès");
      setIsOpen(false);
      setFormData({ ...formDefaults });
    },
    onError: error => toast.error("Erreur : " + error.message),
  });

  const updateMutation = trpc.verses.update.useMutation({
    onSuccess: () => {
      utils.verses.adminList.invalidate();
      toast.success("Verset mis à jour");
      setEditOpen(false);
      setEditingVerse(null);
    },
    onError: error => toast.error("Erreur : " + error.message),
  });

  const deleteMutation = trpc.verses.delete.useMutation({
    onSuccess: () => {
      utils.verses.adminList.invalidate();
      toast.success("Verset supprimé");
    },
    onError: error => toast.error("Erreur : " + error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { imageUrl: _, ...cleanData } = formData;
    createMutation.mutate(cleanData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVerse) return;
    const payload: Record<string, unknown> = {};
    if (editFormData.reference !== editingVerse.reference) payload.reference = editFormData.reference;
    if (editFormData.text !== editingVerse.text) payload.text = editFormData.text;
    if (editFormData.summary !== editingVerse.summary) payload.summary = editFormData.summary;
    if (editFormData.imageUrl !== (editingVerse.imageUrl ?? "")) payload.imageUrl = editFormData.imageUrl || null;
    updateMutation.mutate({ id: editingVerse.id, ...payload });
  };

  const openEdit = (verse: any) => {
    setEditingVerse(verse);
    setEditFormData({
      reference: verse.reference,
      text: verse.text,
      summary: verse.summary,
      imageUrl: verse.imageUrl ?? "",
    });
    setEditOpen(true);
  };

  const generateVerseMutation = trpc.ai.generateVerse.useMutation({
    onSuccess: res => {
      setFormData({
        reference: res.reference,
        text: res.text,
        summary: res.summary,
        imageUrl: formData.imageUrl,
      });
      toast.success("Verset et résumé générés avec succès !");
    },
    onError: err => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Verset du Jour
          </h3>
          <p className="text-sm text-muted-foreground">
            Gérez la banque de versets et résumés bibliques
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Verset
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Ajouter un verset</DialogTitle>
                <DialogDescription>
                  Ce verset pourra être associé à une publication du jour.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-between gap-3 pt-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Fournisseur IA
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    Utilisé pour la génération des versets.
                  </p>
                </div>
                <AIProviderSelect size="sm" showTestButton={false} />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="gap-2 text-primary border-primary/20 hover:bg-primary/10"
                  onClick={() =>
                    generateVerseMutation.mutate({
                      reference: formData.reference || undefined,
                    })
                  }
                  disabled={generateVerseMutation.isPending}
                >
                  {generateVerseMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {formData.reference
                    ? `Générer avec ${activeProvider.label}`
                    : `Suggérer avec ${activeProvider.label}`}
                </Button>
              </div>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="reference">Référence</Label>
                  <Input
                    id="reference"
                    placeholder="Ex: Jérémie 29:11"
                    value={formData.reference}
                    onChange={e =>
                      setFormData({ ...formData, reference: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text">Texte du verset</Label>
                  <Textarea
                    id="text"
                    placeholder="Car je connais les projets que j'ai formés sur vous..."
                    value={formData.text}
                    onChange={e =>
                      setFormData({ ...formData, text: e.target.value })
                    }
                    required
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary">Résumé biblique</Label>
                  <Textarea
                    id="summary"
                    placeholder="Ce verset nous rappelle que Dieu a un plan bienveillant..."
                    value={formData.summary}
                    onChange={e =>
                      setFormData({ ...formData, summary: e.target.value })
                    }
                    required
                    className="min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image (URL ou upload)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={formData.imageUrl}
                      onChange={e =>
                        setFormData({ ...formData, imageUrl: e.target.value })
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      disabled={isUploading}
                      className="relative shrink-0"
                      aria-label="Uploader une image"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={e => handleImageUpload(e, "create")}
                      />
                    </Button>
                  </div>
                  {formData.imageUrl && (
                    <img
                      src={formData.imageUrl}
                      alt="Aperçu"
                      className="w-full max-h-32 object-cover rounded-lg border"
                    />
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Création..." : "Créer le verset"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Modifier le verset</DialogTitle>
                <DialogDescription>
                  Modifiez les champs ci-dessous.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-reference">Référence</Label>
                  <Input
                    id="edit-reference"
                    value={editFormData.reference}
                    onChange={e =>
                      setEditFormData({ ...editFormData, reference: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-text">Texte du verset</Label>
                  <Textarea
                    id="edit-text"
                    value={editFormData.text}
                    onChange={e =>
                      setEditFormData({ ...editFormData, text: e.target.value })
                    }
                    required
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-summary">Résumé biblique</Label>
                  <Textarea
                    id="edit-summary"
                    value={editFormData.summary}
                    onChange={e =>
                      setEditFormData({ ...editFormData, summary: e.target.value })
                    }
                    required
                    className="min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image (URL ou upload)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={editFormData.imageUrl}
                      onChange={e =>
                        setEditFormData({ ...editFormData, imageUrl: e.target.value })
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      disabled={isUploading}
                      className="relative shrink-0"
                      aria-label="Uploader une image"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={e => handleImageUpload(e, "edit")}
                      />
                    </Button>
                  </div>
                  {editFormData.imageUrl && (
                    <img
                      src={editFormData.imageUrl}
                      alt="Aperçu"
                      className="w-full max-h-32 object-cover rounded-lg border"
                    />
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setEditOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
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
            <Skeleton className="h-10 w-full" />
          </div>
        ) : verses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Aucun verset</p>
            <p className="text-xs text-muted-foreground">
              Ajoutez votre premier verset biblique.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Référence</TableHead>
                <TableHead>Texte</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verses.map((verse: any) => (
                <TableRow key={verse.id}>
                  <TableCell className="font-medium">
                    {verse.reference}
                  </TableCell>
                  <TableCell className="whitespace-normal min-w-[300px]">
                    <p className="text-sm line-clamp-1 italic">
                      « {verse.text} »
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {verse.summary}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {verse.imageUrl && (
                        <Image className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(verse)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (
                            confirm(
                              "Supprimer ce verset ? (Il sera dissocié des publications)"
                            )
                          ) {
                            deleteMutation.mutate({ id: verse.id });
                          }
                        }}
                        disabled={deleteMutation.isPending}
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
