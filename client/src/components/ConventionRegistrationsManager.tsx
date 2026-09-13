import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { Users, Trash2, Download, Loader2, Mail, User, Search, BarChart3, FileText, QrCode } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

export default function ConventionRegistrationsManager() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const utils = trpc.useUtils();
  const { data: registrations, isLoading } = trpc.conventionRegistrations.list.useQuery();
  const { data: totalCount } = trpc.conventionRegistrations.count.useQuery();
  const statsQuery = trpc.conventionRegistrations.stats.useQuery();

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

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter((r: any) =>
      r.firstName.toLowerCase().includes(term) ||
      r.lastName.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      r.ticketCode?.toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

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
    const header = "Prénom,Nom,Email,Code,Date d'inscription\n";
    const rows = items.map((r: any) => {
      const date = new Date(r.createdAt).toLocaleDateString("fr-FR");
      return `${r.firstName},${r.lastName},${r.email},${r.ticketCode || ""},${date}`;
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

  const exportPDF = async () => {
    if (items.length === 0) {
      toast.error("Aucune inscription à exporter");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Inscriptions Convention G12 France", 14, 20);
    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} — ${items.length} inscrit(s)`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [["Prénom", "Nom", "Email", "Code", "Date"]],
      body: items.map((r: any) => [
        r.firstName,
        r.lastName,
        r.email,
        r.ticketCode || "",
        new Date(r.createdAt).toLocaleDateString("fr-FR"),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [217, 119, 6] },
    });

    let y = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("QR Codes d'entrée", 14, y);
    y += 10;

    for (const reg of items) {
      if (!reg.ticketCode) continue;
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      try {
        const qrDataUrl = await QRCode.toDataURL(
          `https://g12parismedia.com/convention/verify?code=${reg.ticketCode}`,
          { width: 150, margin: 1 }
        );
        doc.addImage(qrDataUrl, "PNG", 14, y, 25, 25);
        doc.setFontSize(9);
        doc.text(`${reg.firstName} ${reg.lastName}`, 44, y + 8);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(reg.ticketCode, 44, y + 14);
        doc.setTextColor(0);
        y += 32;
      } catch {
        y += 5;
      }
    }

    doc.save(`checkin-convention-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF exporté avec QR codes");
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
          <Button variant="outline" size="sm" onClick={exportPDF} className="gap-2">
            <FileText className="w-4 h-4" />
            Exporter PDF
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

      <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

      {statsQuery.data && statsQuery.data.length > 0 && (
        <div className="bg-muted/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Inscriptions par jour</span>
          </div>
          <div className="flex gap-1 items-end h-20">
            {(() => {
              const maxCount = Math.max(...statsQuery.data.map((s: any) => s.count));
              return statsQuery.data.map((stat: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary/60 rounded-t"
                    style={{ height: `${(stat.count / maxCount) * 100}%`, minHeight: "4px" }}
                    title={`${stat.date}: ${stat.count}`}
                  />
                  <span className="text-[9px] text-muted-foreground leading-none">
                    {new Date(stat.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                  </span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

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
                <th className="p-3 text-left font-medium">Code</th>
                <th className="p-3 text-left font-medium">Date</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((reg: any) => (
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
                  <td className="p-3">
                    <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">
                      {reg.ticketCode || "—"}
                    </span>
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
