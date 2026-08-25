import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Lightbulb, Trash2, MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "En attente", color: "text-amber-500", icon: Clock },
  reviewed: { label: "Consultée", color: "text-blue-500", icon: AlertCircle },
  accepted: { label: "Acceptée", color: "text-emerald-500", icon: CheckCircle },
  rejected: { label: "Rejetée", color: "text-muted-foreground", icon: AlertCircle },
};

export default function SuggestionsManager() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const utils = trpc.useUtils();
  const { data: suggestions, isLoading } = trpc.suggestions.list.useQuery();

  const updateMutation = trpc.suggestions.update.useMutation({
    onSuccess: () => {
      utils.suggestions.list.invalidate();
      toast.success("Suggestion mise à jour");
      setReplyId(null);
      setReplyText("");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const deleteMutation = trpc.suggestions.delete.useMutation({
    onSuccess: () => {
      utils.suggestions.list.invalidate();
      toast.success("Suggestion supprimée");
      setDeleteId(null);
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const bulkDeleteMutation = trpc.suggestions.bulkDelete.useMutation({
    onSuccess: () => {
      utils.suggestions.list.invalidate();
      toast.success(`${selectedItems.length} suggestion(s) supprimée(s)`);
      setSelectedItems([]);
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const items = suggestions ?? [];

  const toggleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((s: any) => s.id));
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleReply = () => {
    if (!replyId || !replyText.trim()) return;
    updateMutation.mutate({
      id: replyId,
      status: "reviewed",
      adminReply: replyText.trim(),
    });
  };

  const handleStatusChange = (id: number, status: string) => {
    updateMutation.mutate({ id, status });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} suggestion(s) au total
        </p>
      </div>

      {selectedItems.length > 0 && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">
          <span className="text-sm font-medium">{selectedItems.length} sélectionnée(s)</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedItems([])}>
              Annuler
            </Button>
            <Button variant="destructive" size="sm" onClick={() => {
              if (confirm(`Supprimer ${selectedItems.length} suggestion(s) ?`)) {
                bulkDeleteMutation.mutate({ ids: selectedItems });
              }
            }} disabled={bulkDeleteMutation.isPending}>
              <Trash2 className="w-4 h-4 mr-1" />
              Supprimer
            </Button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12">
          <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucune suggestion pour le moment.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30">
            <Checkbox
              checked={selectedItems.length > 0 && items.length === selectedItems.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-xs font-medium text-muted-foreground">Tout sélectionner</span>
          </div>
          <div className="divide-y divide-border">
            {items.map((suggestion: any) => {
              const statusConf = STATUS_CONFIG[suggestion.status] ?? STATUS_CONFIG.pending;
              const StatusIcon = statusConf.icon;
              return (
                <div key={suggestion.id} className="p-4 hover:bg-accent/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedItems.includes(suggestion.id)}
                      onCheckedChange={() => toggleSelectItem(suggestion.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-foreground">
                          {suggestion.title}
                        </h4>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {suggestion.category}
                        </Badge>
                        <span className={`flex items-center gap-1 text-xs ${statusConf.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConf.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {suggestion.message}
                      </p>
                      {suggestion.adminReply && (
                        <div className="bg-primary/5 rounded-lg p-2 text-sm mb-2">
                          <span className="font-medium">Réponse :</span> {suggestion.adminReply}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Select
                          value={suggestion.status}
                          onValueChange={(v) => handleStatusChange(suggestion.id, v)}
                        >
                          <SelectTrigger className="w-[140px] h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="reviewed">Consultée</SelectItem>
                            <SelectItem value="accepted">Acceptée</SelectItem>
                            <SelectItem value="rejected">Rejetée</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setReplyId(suggestion.id);
                            setReplyText(suggestion.adminReply || "");
                          }}
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Répondre
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(suggestion.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reply Dialog */}
      <AlertDialog open={replyId !== null} onOpenChange={() => setReplyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Répondre à la suggestion</AlertDialogTitle>
            <AlertDialogDescription>
              Votre réponse sera visible par l'utilisateur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Votre réponse..."
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleReply} disabled={!replyText.trim()}>
              Envoyer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette suggestion ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
