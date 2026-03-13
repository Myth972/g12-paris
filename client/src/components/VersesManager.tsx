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
import { Plus, Trash2, BookOpen, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function VersesManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ reference: "", text: "", summary: "" });
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.verses.adminList.useQuery();
  const verses = data?.items ?? [];

  const createMutation = trpc.verses.create.useMutation({
    onSuccess: () => {
      utils.verses.adminList.invalidate();
      toast.success("Verset créé avec succès");
      setIsOpen(false);
      setFormData({ reference: "", text: "", summary: "" });
    },
    onError: (error) => toast.error("Erreur : " + error.message),
  });

  const deleteMutation = trpc.verses.delete.useMutation({
    onSuccess: () => {
      utils.verses.adminList.invalidate();
      toast.success("Verset supprimé");
    },
    onError: (error) => toast.error("Erreur : " + error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const generateVerseMutation = trpc.ai.generateVerse.useMutation({
    onSuccess: (res) => {
      setFormData({
        reference: res.reference,
        text: res.text,
        summary: res.summary
      });
      toast.success("Verset et résumé générés avec succès !");
    },
    onError: (err) => toast.error(err.message),
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
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="gap-2 text-primary border-primary/20 hover:bg-primary/10"
                  onClick={() => generateVerseMutation.mutate({ reference: formData.reference || undefined })}
                  disabled={generateVerseMutation.isPending}
                >
                  {generateVerseMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {formData.reference ? "Générer depuis la référence" : "Suggérer un verset aléatoire"}
                </Button>
              </div>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="reference">Référence</Label>
                  <Input
                    id="reference"
                    placeholder="Ex: Jérémie 29:11"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text">Texte du verset</Label>
                  <Textarea
                    id="text"
                    placeholder="Car je connais les projets que j'ai formés sur vous..."
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    required
                    className="min-h-[120px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Création..." : "Créer le verset"}
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
            <p className="text-xs text-muted-foreground">Ajoutez votre premier verset biblique.</p>
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
                  <TableCell className="font-medium">{verse.reference}</TableCell>
                  <TableCell className="whitespace-normal min-w-[300px]">
                    <p className="text-sm line-clamp-1 italic">« {verse.text} »</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{verse.summary}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm("Supprimer ce verset ? (Il sera dissocié des publications)")) {
                          deleteMutation.mutate({ id: verse.id });
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
