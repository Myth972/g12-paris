import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Trash2, Download, Loader2, Mail, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ConventionRegistrationsManager() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: registrations, isLoading } = trpc.conventionRegistrations.list.useQuery();
  const { data: totalCount } = trpc.conventionRegistrations.count.useQuery();

  const deleteMutation = trpc.conventionRegistrations.delete.useMutation({
    onSuccess: () => {
      utils.conventionRegistrations.list.invalidate();
      utils.conventionRegistrations.count.invalidate();
      toast.success("Inscription supprimée");
      setDeleteId(null);
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const bulkDeleteMutation = trpc.conventionRegistrations.bulkDelete.useMutation({
    onSuccess: () => {
      utils.conventionRegistrations.list.invalidate();
      utils.conventionRegistrations.count.invalidate();
      toast.success(`${selectedItems.length} inscription(s) supprimée(s)`);
      setSelectedItems([]);
      setBulkDeleteOpen(false);
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const items = registrations ?? [];

  const toggleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((r: any) => r.id));
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const exportCSV = () => {
    if (items.length === 0) {
      toast.error("Aucune inscription à exporter");
      return;
    }
    const header = "Prénom,Nom,Email,Date d'inscription\n";
    const rows = items.map((r: any) => {
      const date = new Date(r.createdAt).toLocaleDateString("fr-FR");
      return `${r.firstName},${r.lastName},${r.email},${date}`;
    }).join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inscriptions-convention-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exporté");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2 opacity-40" />
        Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold font-serif">Inscriptions Convention</h3>
          <span className="text-sm text-muted-foreground">({totalCount ?? items.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Exporter CSV
          </Button>
          {selectedItems.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer ({selectedItems.length})
            </Button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Aucune inscription pour le moment.</p>
          <p className="text-xs mt-1">Les inscriptions apparaîtront ici une fois que les utilisateurs se seront inscrits.</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 w-10">
                  <Checkbox
                    checked={items.length > 0 && selectedItems.length === items.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Tout sélectionner"
                  />
                </th>
                <th className="p-3 text-left font-medium">Prénom</th>
                <th className="p-3 text-left font-medium">Nom</th>
                <th className="p-3 text-left font-medium">Email</th>
                <th className="p-3 text-left font-medium">Date</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((reg: any) => (
                <tr key={reg.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedItems.includes(reg.id)}
                      onCheckedChange={() => toggleSelectItem(reg.id)}
                      aria-label={`Sélectionner ${reg.firstName}`}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      {reg.firstName}
                    </div>
                  </td>
                  <td className="p-3 font-medium">{reg.lastName}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {reg.email}
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(reg.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(reg.id)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete single */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette inscription ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'inscription sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {selectedItems.length} inscription(s) ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les inscriptions sélectionnées seront supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMutation.mutate({ ids: selectedItems })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer tout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
