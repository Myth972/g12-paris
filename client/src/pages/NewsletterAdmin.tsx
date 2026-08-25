import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Send, Mail, Trash } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NewsletterAdmin() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedSubscribers, setSelectedSubscribers] = useState<number[]>([]);
  const { t } = useTranslation();
  const [newsletterSubject, setNewsletterSubject] = useState("Les dernières actualités de G12 Paris");
  const utils = trpc.useUtils();

  const toggleSelectAll = () => {
    if (!subscribers) return;
    if (selectedSubscribers.length === subscribers.length) {
      setSelectedSubscribers([]);
    } else {
      setSelectedSubscribers(subscribers.map((s: { id: number }) => s.id));
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedSubscribers((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const { data: subscribersData, isLoading } =
    trpc.newsletter.listSubscribers.useQuery();
  const subscribers = subscribersData?.items;

  const deleteMutation = trpc.newsletter.deleteSubscriber.useMutation({
    onSuccess: () => {
      utils.newsletter.listSubscribers.invalidate();
      toast.success(t('admin.newsletterAdmin.toastDeleted'));
      setDeleteId(null);
    },
    onError: () => toast.error(t('admin.newsletterAdmin.toastDeleteError')),
  });

  const bulkDeleteMutation = trpc.newsletter.bulkDeleteSubscribers.useMutation({
    onSuccess: (res) => {
      utils.newsletter.listSubscribers.invalidate();
      toast.success(t('admin.newsletterAdmin.toastDeleted'));
      setSelectedSubscribers([]);
    },
    onError: () => toast.error(t('admin.newsletterAdmin.toastDeleteError')),
  });

  const sendDigestMutation = trpc.newsletter.sendDigest.useMutation({
    onSuccess: res => {
      toast.success(t('admin.newsletterAdmin.toastSent', { count: res.count }));
    },
    onError: e => {
      toast.error(t('admin.newsletterAdmin.toastSendError') + e.message);
    },
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4 mt-8 max-w-4xl mx-auto">
        <div>
          <h2 className="text-xl font-serif font-bold flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Newsletter
          </h2>
          <p className="text-sm text-muted-foreground">
            {subscribers?.length ?? 0} subscriber{(subscribers?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-64">
            <input 
              type="text" 
              placeholder={t('admin.newsletterAdmin.emailSubjectPlaceholder')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={newsletterSubject}
              onChange={(e) => setNewsletterSubject(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            onClick={() => sendDigestMutation.mutate({ 
              category: "actualité",
              subject: newsletterSubject
            })}
            disabled={sendDigestMutation.isPending || !subscribers?.length}
          >
            <Send className="w-4 h-4 mr-1" />
            {sendDigestMutation.isPending
              ? t('admin.newsletterAdmin.sending')
              : t('admin.newsletterAdmin.send')}
          </Button>
        </div>
      </div>

      {selectedSubscribers.length > 0 && (
        <div className="flex items-center gap-2 mb-2 max-w-4xl mx-auto">
          <span className="text-sm text-muted-foreground">
            {selectedSubscribers.length} sélectionné{(selectedSubscribers.length) !== 1 ? 's' : ''}
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => bulkDeleteMutation.mutate({ ids: selectedSubscribers })}
            disabled={bulkDeleteMutation.isPending}
          >
            <Trash className="w-4 h-4 mr-1" />
            {bulkDeleteMutation.isPending ? '...' : 'Supprimer'}
          </Button>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm max-w-4xl mx-auto">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : subscribers?.length === 0 ? (
          <div className="text-center py-16">
            <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-serif font-semibold text-foreground mb-1">
              {t('admin.newsletterAdmin.noSubscribers')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('admin.newsletterAdmin.noSubscribersDesc')}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  {subscribers && subscribers.length > 0 && (
                    <Checkbox
                      checked={selectedSubscribers.length === subscribers.length && subscribers.length > 0}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Tout sélectionner"
                    />
                  )}
                </TableHead>
                <TableHead>{t('admin.newsletterAdmin.colEmail')}</TableHead>
                <TableHead>{t('admin.newsletterAdmin.colName')}</TableHead>
                <TableHead>{t('admin.newsletterAdmin.colDate')}</TableHead>
                <TableHead className="text-right">{t('admin.newsletterAdmin.colActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers?.map((sub: any) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedSubscribers.includes(sub.id)}
                      onCheckedChange={() => toggleSelectItem(sub.id)}
                      aria-label={`Sélectionner ${sub.email}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{sub.email}</TableCell>
                  <TableCell>
                    {sub.name ? (
                      sub.name
                    ) : (
                      <span className="text-muted-foreground italic">
                        {t('admin.newsletterAdmin.notProvided')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(sub.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(sub.id)}
                      aria-label="Supprimer l'abonné"
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

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.newsletterAdmin.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.newsletterAdmin.deleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.newsletterAdmin.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteId && deleteMutation.mutate({ id: deleteId })
              }
            >
              {t('admin.newsletterAdmin.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
