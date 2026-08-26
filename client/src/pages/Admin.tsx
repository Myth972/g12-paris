import { useAuth } from "@/_core/hooks/useAuth";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  Shield,
  Newspaper,
  Bell,
  Send,
  Info,
  AlertTriangle,
  Sparkles,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Mail,
  Wand2,
  Loader2,
  Library,
  Palette,
  Users,
  FileText,
  ImageIcon,
  TrendingUp,
  User,
  Bot,
  LayoutDashboard,
  MessageCircle,
  Globe,
  Layout,
  Lightbulb,
} from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { useAiProvider } from "@/hooks/useAiProvider";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

// Lazy-loaded components for admin tabs
const PageContentManager = lazy(() => import("@/components/PageContentManager"));
const VersesManager = lazy(() => import("@/components/VersesManager"));
const GalleryManager = lazy(() => import("@/components/GalleryManager"));
const SuggestionsManager = lazy(() => import("@/components/SuggestionsManager"));
const NewsletterAdmin = lazy(() => import("./NewsletterAdmin"));
const KlingStudio = lazy(() => import("./KlingStudio"));
const AIChatBox = lazy(() => import("@/components/AIChatBox").then(m => ({ default: m.AIChatBox })));
const HomeContentManager = lazy(() => import("@/components/HomeContentManager"));
const AIDashboard = lazy(() => import("@/components/AIDashboard"));
const ApiKeyConnector = lazy(() => import("@/components/ApiKeyConnector"));
const CMSManager = lazy(() => import("@/components/CMSManager"));
const AIArticleWriter = lazy(() => import("./AIArticleWriter"));

import HomeHeroBackgroundSettings from "@/components/HomeHeroBackgroundSettings";
import CulteHeroBackgroundSettings from "@/components/CulteHeroBackgroundSettings";
import CulteBannerSettings from "@/components/CulteBannerSettings";
import CulteVideoSettings from "@/components/CulteVideoSettings";

import { Message } from "@/components/AIChatBox";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const NOTIF_TYPE_CONFIG = {
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50", label: "Info" },
  alerte: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-50",
    label: "Alerte",
  },
  nouveauté: {
    icon: Sparkles,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    label: "Nouveauté",
  },
  important: {
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Important",
  },
};

// ─── Articles Tab ──────────────────────────────────────────────

function ArticlesTab() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.articles.adminList.useQuery();
  const deleteMutation = trpc.articles.delete.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      toast.success(t('admin.articlesTab.toastDeleted'));
      setDeleteId(null);
    },
    onError: () => toast.error(t('admin.articlesTab.toastDeleteError')),
  });

  const togglePublish = trpc.articles.update.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      toast.success(t('admin.articlesTab.toastStatusUpdated'));
    },
    onError: () => toast.error(t('admin.articlesTab.toastStatusError')),
  });

  const articles = data?.items ?? [];

  const toggleArticleSelectAll = () => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(articles.map((a: any) => a.id));
    }
  };
  const toggleArticleSelect = (id: number) => {
    setSelectedArticles(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const bulkDeleteArticleMutation = trpc.articles.bulkDelete.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      toast.success(`${selectedArticles.length} article(s) supprimé(s)`);
      setSelectedArticles([]);
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {t('admin.articlesTab.totalCount', { count: data?.total ?? 0 })}
        </p>
        <Button size="sm" asChild>
          <Link href="/admin/article/new">
            <Plus className="w-4 h-4 mr-1" />
            {t('admin.articlesTab.newArticle')}
          </Link>
        </Button>
      </div>

      {selectedArticles.length > 0 && (
        <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2 mb-3">
          <span className="text-sm font-medium">
            {selectedArticles.length} article(s) sélectionné(s)
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => bulkDeleteArticleMutation.mutate({ ids: selectedArticles })}
            disabled={bulkDeleteArticleMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Supprimer ({selectedArticles.length})
          </Button>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-x-auto shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-serif font-semibold text-foreground mb-1">
              {t('admin.articlesTab.noArticles')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('admin.articlesTab.noArticlesDesc')}
            </p>
            <Button size="sm" asChild>
              <Link href="/admin/article/new">
                <Plus className="w-4 h-4 mr-1" />
                {t('admin.articlesTab.createFirst')}
              </Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedArticles.length > 0 && articles.length === selectedArticles.length}
                    onCheckedChange={toggleArticleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[40%]">{t('admin.articlesTab.columnTitle')}</TableHead>
                <TableHead>{t('admin.articlesTab.columnCategory')}</TableHead>
                <TableHead>{t('admin.articlesTab.columnStatus')}</TableHead>
                <TableHead>{t('admin.articlesTab.columnDate')}</TableHead>
                <TableHead className="text-right">{t('admin.articlesTab.columnActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article: any) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedArticles.includes(article.id)}
                      onCheckedChange={() => toggleArticleSelect(article.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {article.coverImageUrl ? (
                        <img
                          src={article.coverImageUrl}
                          alt=""
                          className="w-24 h-16 rounded-md object-cover flex-shrink-0 border border-border/50"
                        />
                      ) : (
                        <div className="w-24 h-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0 border border-dotted border-border">
                          <Newspaper className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium text-sm line-clamp-1">
                        {article.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {article.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={article.published ? "default" : "outline"}
                      className={`text-xs ${!article.published ? "bg-white text-blue-600 border-blue-300" : ""}`}
                    >
                      {article.published ? t('admin.articlesTab.published') : t('admin.articlesTab.draft')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(article.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={article.published ? t('admin.articlesTab.unpublish') : t('admin.articlesTab.publish')}
                        aria-label={article.published ? t('admin.articlesTab.unpublish') : t('admin.articlesTab.publish')}
                        onClick={() =>
                          togglePublish.mutate({
                            id: article.id,
                            published: !article.published,
                          })
                        }
                      >
                        {article.published ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                        aria-label="Modifier l'article"
                      >
                        <Link href={`/admin/article/${article.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(article.id)}
                        aria-label="Supprimer l'article"
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

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.dialogs.confirmDelete.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('admin.dialogs.confirmDelete.desc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.dialogs.confirmDelete.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteId && deleteMutation.mutate({ id: deleteId })
              }
            >
              {t('admin.dialogs.confirmDelete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Notifications Tab ─────────────────────────────────────────

function NotificationsTab() {
  const { t } = useTranslation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedNotifs, setSelectedNotifs] = useState<number[]>([]);
  const [newNotif, setNewNotif] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "alerte" | "nouveauté" | "important",
    linkUrl: "",
  });

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.notifications.adminList.useQuery();

  const createMutation = trpc.notifications.create.useMutation({
    onSuccess: () => {
      utils.notifications.adminList.invalidate();
      toast.success(t('admin.notificationsTab.toastSent'));
      setShowCreateDialog(false);
      setNewNotif({ title: "", message: "", type: "info", linkUrl: "" });
    },
    onError: () => toast.error(t('admin.notificationsTab.toastSendError')),
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.adminList.invalidate();
      toast.success(t('admin.notificationsTab.toastDeleted'));
      setDeleteId(null);
    },
    onError: () => toast.error(t('admin.notificationsTab.toastDeleteError')),
  });

  const notifs = data?.items ?? [];

  const toggleNotifSelectAll = () => {
    if (selectedNotifs.length === notifs.length) {
      setSelectedNotifs([]);
    } else {
      setSelectedNotifs(notifs.map((n: any) => n.id));
    }
  };
  const toggleNotifSelect = (id: number) => {
    setSelectedNotifs(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const bulkDeleteMutation = trpc.notifications.bulkDelete.useMutation({
    onSuccess: () => {
      utils.notifications.adminList.invalidate();
      toast.success(`${selectedNotifs.length} notification(s) supprimée(s)`);
      setSelectedNotifs([]);
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const handleCreate = () => {
    if (!newNotif.title.trim() || !newNotif.message.trim()) {
      toast.error(t('admin.notificationsTab.fillRequired'));
      return;
    }
    createMutation.mutate({
      title: newNotif.title.trim(),
      message: newNotif.message.trim(),
      type: newNotif.type,
      linkUrl: newNotif.linkUrl.trim() || undefined,
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {t('admin.notificationsTab.totalCount', { count: data?.total ?? 0 })}
        </p>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Send className="w-4 h-4 mr-1" />
          {t('admin.notificationsTab.sendNotification')}
        </Button>
      </div>

      {selectedNotifs.length > 0 && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 mb-3">
          <span className="text-sm font-medium">{selectedNotifs.length} sélectionnée(s)</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedNotifs([])}>Annuler</Button>
            <Button variant="destructive" size="sm" onClick={() => {
              if (confirm(`Supprimer ${selectedNotifs.length} notification(s) ?`)) {
                bulkDeleteMutation.mutate({ ids: selectedNotifs });
              }
            }} disabled={bulkDeleteMutation.isPending}>
              <Trash2 className="w-4 h-4 mr-1" />
              Supprimer
            </Button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-x-auto shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-serif font-semibold text-foreground mb-1">
              {t('admin.notifications.noNotifications')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('admin.notificationsTab.noNotificationsDesc')}
            </p>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Send className="w-4 h-4 mr-1" />
              {t('admin.notificationsTab.sendFirst')}
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30">
              <Checkbox
                checked={selectedNotifs.length > 0 && notifs.length === selectedNotifs.length}
                onCheckedChange={toggleNotifSelectAll}
              />
              <span className="text-xs font-medium text-muted-foreground">Tout sélectionner</span>
            </div>
            {notifs.map((notif: any) => {
              const config =
                NOTIF_TYPE_CONFIG[
                  notif.type as keyof typeof NOTIF_TYPE_CONFIG
                ] ?? NOTIF_TYPE_CONFIG.info;
              const Icon = config.icon;

              return (
                <div
                  key={notif.id}
                  className="flex items-start gap-4 p-4 hover:bg-accent/30 transition-colors"
                >
                  <Checkbox checked={selectedNotifs.includes(notif.id)} onCheckedChange={() => toggleNotifSelect(notif.id)} className="mt-3" />
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-semibold text-foreground">
                        {notif.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-muted-foreground/70">
                        {formatDate(notif.createdAt)} {t('admin.notificationsTab.by')}{" "}
                        {notif.authorName || "Admin"}
                      </span>
                      {notif.linkUrl && (
                        <span className="text-xs text-primary/70 truncate max-w-[200px]">
                          {notif.linkUrl}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() => setDeleteId(notif.id)}
                    aria-label="Supprimer la notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create notification dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {t('admin.notificationsTab.dialogTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.notificationsTab.dialogDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="notif-title">{t('admin.notificationsTab.titleLabel')}</Label>
              <Input
                id="notif-title"
                placeholder={t('admin.notificationsTab.titlePlaceholder')}
                value={newNotif.title}
                onChange={e =>
                  setNewNotif({ ...newNotif, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-type">{t('admin.notificationsTab.typeLabel')}</Label>
              <Select
                value={newNotif.type}
                onValueChange={v =>
                  setNewNotif({ ...newNotif, type: v as typeof newNotif.type })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="alerte">Alerte</SelectItem>
                  <SelectItem value="nouveauté">Nouveauté</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-message">{t('admin.notificationsTab.messageLabel')}</Label>
              <Textarea
                id="notif-message"
                placeholder={t('admin.notificationsTab.messagePlaceholder')}
                rows={3}
                value={newNotif.message}
                onChange={e =>
                  setNewNotif({ ...newNotif, message: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-link">{t('admin.notificationsTab.linkLabel')}</Label>
              <Input
                id="notif-link"
                placeholder={t('admin.notificationsTab.linkPlaceholder')}
                value={newNotif.linkUrl}
                onChange={e =>
                  setNewNotif({ ...newNotif, linkUrl: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.notificationsTab.linkHelp')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              {t('admin.dialogs.confirmDelete.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <Send className="w-4 h-4 mr-1" />
              {createMutation.isPending ? t('admin.notificationsTab.sending') : t('admin.notificationsTab.send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.notificationsTab.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.notificationsTab.deleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.dialogs.confirmDelete.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteId && deleteMutation.mutate({ id: deleteId })
              }
            >
              {t('admin.dialogs.confirmDelete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── AI Assistant Tab ──────────────────────────────────────────

function AIAssistantTab() {
  const { t } = useTranslation();
  const {
    providers,
    provider,
    activeProvider,
    setProvider,
    testProvider,
    isTesting,
  } = useAiProvider();

  // Chatbot toggle
  const chatbotQuery = trpc.siteSettings.get.useQuery({ key: "chatbot_enabled" });
  const chatbotMutation = trpc.siteSettings.set.useMutation({
    onSuccess: () => {
      chatbotQuery.refetch();
      toast.success("Paramètre chatbot mis à jour");
    },
  });
  const isChatbotEnabled = chatbotQuery.data === "true";

  const toggleChatbot = () => {
    chatbotMutation.mutate({
      key: "chatbot_enabled",
      value: isChatbotEnabled ? "false" : "true",
    });
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: `Tu es un assistant IA puissant et utile. Tu aides l'administrateur du site G12 Paris à gérer le contenu, rédiger des articles et répondre aux questions. Ton modèle actuel est ${activeProvider.model} via ${activeProvider.label}.`,
    },
  ]);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 0 || prev[0].role !== "system") return prev;
      const next = [...prev];
      next[0] = {
        ...next[0],
        content: `Tu es un assistant IA puissant et utile. Tu aides l'administrateur du site G12 Paris à gérer le contenu, rédiger des articles et répondre aux questions. Ton modèle actuel est ${activeProvider.model} via ${activeProvider.label}.`,
      };
      return next;
    });
  }, [activeProvider.label, activeProvider.model]);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: response => {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: response,
        },
      ]);
    },
    onError: error => {
      toast.error(t('admin.aiTab.errorPrefix') + error.message);
    },
  });

  const MAX_CHARS_AI = 16000;
  const [showClearWarningAI, setShowClearWarningAI] = useState(false);

  const totalCharsAI = messages.reduce((sum, m) => sum + m.content.length, 0);

  const handleSend = (content: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content }];
    const newTotal = newMessages.reduce((sum, m) => sum + m.content.length, 0);
    if (newTotal >= MAX_CHARS_AI) {
      setShowClearWarningAI(true);
      return;
    }
    setMessages(newMessages);
    chatMutation.mutate({ messages: newMessages });
  };

  const handleDeleteMessage = (displayIndex: number) => {
    setMessages(prev => {
      const systemMsg = prev.filter(m => m.role === "system");
      const nonSystem = prev.filter(m => m.role !== "system");
      nonSystem.splice(displayIndex, 1);
      return [...systemMsg, ...nonSystem];
    });
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: "system",
        content: `Tu es un assistant IA puissant et utile. Tu aides l'administrateur du site G12 Paris à gérer le contenu, rédiger des articles et répondre aux questions. Ton modèle actuel est ${activeProvider.model} via ${activeProvider.label}.`,
      },
    ]);
    setShowClearWarningAI(false);
  };

  const handleConfirmTrim = () => {
    setMessages(prev => {
      const systemMsg = prev.filter(m => m.role === "system");
      const nonSystem = prev.filter(m => m.role !== "system");
      return [...systemMsg, ...nonSystem.slice(-6)];
    });
    setShowClearWarningAI(false);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-4">
      {/* Chatbot Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-primary" />
          <div>
            <h4 className="text-sm font-medium">Chatbot public</h4>
            <p className="text-xs text-muted-foreground">
              Active ou désactive le chatbot visible par les visiteurs du site
            </p>
          </div>
        </div>
        <Switch
          checked={isChatbotEnabled}
          onCheckedChange={toggleChatbot}
          disabled={chatbotQuery.isLoading || chatbotMutation.isPending}
        />
      </div>

      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-lg font-serif font-bold text-foreground">
              Assistant IA — {activeProvider.label}
            </h3>
            <p className="text-xs text-muted-foreground">
              {activeProvider.model} • {activeProvider.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="min-w-[220px]">
            <Select
              value={provider}
              onValueChange={value => {
                setProvider(value as any);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providers.map(p => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label} — {p.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => testProvider(provider)}
            disabled={isTesting}
          >
            {isTesting ? t('admin.aiTab.testing') : t('admin.aiTab.testIA')}
          </Button>
        </div>
      </div>

      {/* Character limit warning */}
      {(totalCharsAI >= 14000 || showClearWarningAI) && (
        <div className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {showClearWarningAI
              ? "Limite de 16 000 caractères atteinte. Voulez-vous supprimer les anciens messages ?"
              : `Attention : ${totalCharsAI}/16 000 caractères utilisés.`}
          </p>
          {showClearWarningAI ? (
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleConfirmTrim}
                className="text-xs px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
              >
                Oui, supprimer les anciens
              </button>
              <button
                onClick={() => setShowClearWarningAI(false)}
                className="text-xs px-3 py-1 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              onClick={handleClearHistory}
              className="text-xs mt-1 text-amber-600 dark:text-amber-400 underline hover:no-underline"
            >
              Vider l'historique
            </button>
          )}
        </div>
      )}

      <AIChatBox
        messages={messages}
        onSendMessage={handleSend}
        isLoading={chatMutation.isPending}
        onDeleteMessage={handleDeleteMessage}
        onClearHistory={handleClearHistory}
        height="650px"
        placeholder="Pose une question sur la Bible..."
        emptyStateMessage="Pose une question sur un thème biblique"
        suggestedPrompts={[
          "Explique la signification de Pâques dans la tradition chrétienne",
          "Quels sont les thèmes principaux du livre des Psaumes ?",
          "Donne-moi un résumé de l'Évangile selon Jean",
          "Quelle est la différence entre l'Ancien et le Nouveau Testament ?",
          "Parle-moi de la vie de l'apôtre Paul",
          "Quels sont les enseignements de Jésus sur l'amour et le pardon ?",
          "Explique le livre de l'Apocalypse",
          "Qui sont les prophètes majeurs dans la Bible ?",
          "Quelle est l'histoire de Moïse et de l'Exode ?",
          "Parle-moi du fruit de l'Esprit selon Galates",
        ]}
      />
    </div>
  );
}

// ─── Main Admin Page ───────────────────────────────────────────

export default function Admin() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const [, setLocation] = useLocation();

  const { data: articlesData } = trpc.articles.adminList.useQuery();
  const { data: nlData } = trpc.newsletter.listSubscribers.useQuery();
  const { data: galleryListData } = trpc.gallery.list.useQuery();
  const { data: catData } = trpc.bibliotheque.listCategories.useQuery();

  const pubCount = articlesData?.items?.filter((a: any) => a.published).length ?? 0;
  const nlCount = nlData?.items?.length ?? 0;
  const mediaCount = galleryListData?.items?.length ?? 0;
  const catCount = catData?.length ?? 0;

if (authLoading) {
    return (
      <div className="container py-10">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const userRole = user?.role || "user";
  const isAdmin = userRole === "admin";
  const isEditeur = userRole === "editeur";
  const isBibliotheque = userRole === "bibliotheque";
  const hasAdminAccess = isAdmin || isEditeur || isBibliotheque;

  if (!isAdmin && !isEditeur && !isBibliotheque) {
    return (
      <div className="container py-20 text-center">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-serif font-bold mb-2">{t('admin.restrictedAccess')}</h2>
        <p className="text-muted-foreground mb-6">
          {t('admin.restrictedAccessDesc')}
        </p>
        <Button variant="outline" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('admin.backToHome')}
        </Button>
      </div>
);
  }

  return (
    <div className="min-h-screen bg-secondary/30 overflow-y-auto">
      {/* Admin header */}
      <div className="bg-card border-b border-border">
        <div className="container py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary font-sans">
                  {t('admin.title')}
                </span>
                <Badge variant="outline" className="text-xs">
                  {isAdmin ? t('admin.roles.admin') : isEditeur ? t('admin.roles.editeur') : isBibliotheque ? t('admin.roles.bibliotheque') : t('admin.roles.user')}
                </Badge>
<Button
  variant="outline"
  size="sm"
  onClick={() => i18n.changeLanguage(i18n.language === "en" ? "fr" : "en")}
  className="ml-2 flex items-center gap-1"
  title="Changer la langue"
>
  <Globe className="w-4 h-4" />
  {i18n.language === "en" ? "EN" : "FR"}
</Button>
              </div>
              <h1 className="text-2xl font-serif font-bold text-foreground">
                {t('admin.dashboard')}
              </h1>
              {user && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('admin.connectedAs')} <span className="font-medium">{user.name || user.openId}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasAdminAccess && (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/profile">
                      <User className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">{t('admin.myProfile')}</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/tutorial">
                      <HelpCircle className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">{t('admin.guide')}</span>
                    </Link>
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">{t('admin.backToSite')}</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview - identiques pour tous les rôles */}
      <div className="container pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pubCount}</p>
                <p className="text-xs text-muted-foreground">{t('admin.stats.articles')}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{nlCount}</p>
                <p className="text-xs text-muted-foreground">{t('admin.stats.subscribers')}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-600">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mediaCount}</p>
                <p className="text-xs text-muted-foreground">{t('admin.stats.gallery')}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-600">
                <Library className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{catCount}</p>
                <p className="text-xs text-muted-foreground">{t('admin.stats.library')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container pt-2">
        <h2 className="text-lg font-serif font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> {t('admin.quickAccess.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <Link href="/admin/bibliotheque">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-primary/50">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                <Library className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-serif mb-2">{t('admin.quickAccess.library')}</h3>
              <p className="text-sm text-muted-foreground">
                Gérez vos livres, études bibliques, vidéos et ressources premium.
              </p>
            </div>
          </Link>

          {isAdmin && (
          <Link href="/admin/design">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-primary/50">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-serif mb-2">{t('admin.quickAccess.design')}</h3>
              <p className="text-sm text-muted-foreground">
                Personnalisez les couleurs, polices, logos et le style visuel global.
              </p>
            </div>
          </Link>
          )}

          {isAdmin && (
          <Link href="/admin/visuals">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-primary/50">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-serif mb-2">Visuels</h3>
              <p className="text-sm text-muted-foreground">
                Gérez les animations, particules, effets de survol et transitions.
              </p>
            </div>
          </Link>
          )}

          {isAdmin && (
          <Link href="/admin/agents">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-primary/50">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-serif mb-2">Agents</h3>
              <p className="text-sm text-muted-foreground">
                Exécutez et surveillez les agents automatisés (YouTube, etc.).
              </p>
            </div>
          </Link>
          )}

          <Link href="/admin/article/new">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-primary/50">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-serif mb-2">{t('admin.quickAccess.newArticle')}</h3>
              <p className="text-sm text-muted-foreground">
                Rédigez un nouvel article pour le blog ou les actualités.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="container py-6">
        <Tabs defaultValue="articles" className="w-full">
          <TabsList className="mb-6 flex overflow-x-auto h-auto w-full justify-start gap-2 pb-2 scrollbar-thin">
            <TabsTrigger value="articles" className="gap-2">
              <Newspaper className="w-4 h-4" />
              {t('admin.tabs.articles')}
            </TabsTrigger>
            <TabsTrigger value="accueil" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              {t('admin.tabs.home')}
            </TabsTrigger>
            {hasAdminAccess && (
              <>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              {t('admin.tabs.notifications')}
            </TabsTrigger>
            <TabsTrigger value="newsletter" className="gap-2">
              <Mail className="w-4 h-4" />
              {t('admin.tabs.newsletter')}
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              IA
            </TabsTrigger>
            <TabsTrigger value="ai-writer" className="gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              Rédaction IA
            </TabsTrigger>
            <TabsTrigger value="kling" className="gap-2">
              <Wand2 className="w-4 h-4 text-violet-500" />
              AI Media Studio
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              {t('admin.tabs.users')}
            </TabsTrigger>
              </>
            )}
            <TabsTrigger value="pages" className="gap-2">
              <Newspaper className="w-4 h-4" />
              {t('admin.tabs.pages')}
            </TabsTrigger>
            <TabsTrigger value="publications" className="gap-2">
              <BookOpen className="w-4 h-4" />
              {t('admin.tabs.publications')}
            </TabsTrigger>
            <TabsTrigger value="cms" className="gap-2">
              <Layout className="w-4 h-4 text-emerald-500" />
              CMS
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Suggestions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="articles">
            <ArticlesTab />
          </TabsContent>
          <TabsContent value="accueil">
            <Suspense fallback={<div className="p-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 opacity-20" /> {t('admin.loading')}</div>}>
              <HomeContentManager />
            </Suspense>
          </TabsContent>
          {hasAdminAccess && (
            <>
          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>
          <TabsContent value="newsletter">
            <Suspense fallback={<div className="p-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 opacity-20" /> {t('admin.loading')}</div>}>
              <NewsletterAdmin />
            </Suspense>
          </TabsContent>
          <TabsContent value="ai">
            <AIAssistantTab />
            <div className="mt-8">
              <Suspense fallback={<div className="p-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 opacity-20" /> Chargement...</div>}>
                <ApiKeyConnector />
              </Suspense>
            </div>
            <div className="mt-8">
              <AIDashboard />
            </div>
          </TabsContent>
          <TabsContent value="ai-writer">
            <Suspense fallback={<div className="p-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 opacity-20" /> Chargement...</div>}>
              <AIArticleWriter />
            </Suspense>
          </TabsContent>
          <TabsContent value="kling" className="py-4">
            <KlingStudio />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
            </>
          )}
          <TabsContent value="pages">
            <Suspense fallback={<div className="p-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 opacity-20" /> {t('admin.main.loadingManager')}</div>}>
              <div className="space-y-8">
                <HomeHeroBackgroundSettings />
                <CulteHeroBackgroundSettings />
                <CulteBannerSettings />
                <CulteVideoSettings />
                <PageContentManager pageId="home" pageName="Accueil" />
                <PageContentManager
                  pageId="culte-en-ligne"
                  pageName="Culte en ligne"
                />
                <PageContentManager
                  pageId="bibliotheque"
                  pageName="Bibliothèque"
                />
              </div>
            </Suspense>
          </TabsContent>
          <TabsContent value="publications" className="space-y-8">
            <Suspense fallback={<div className="p-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 opacity-20" /> {t('admin.loading')}</div>}>
               <GalleryManager />
               {isAdmin && <><div className="h-px bg-border my-8" /><VersesManager /></>}
            </Suspense>
          </TabsContent>
          <TabsContent value="cms">
            <Suspense fallback={<div className="p-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 opacity-20" /> {t('admin.loading')}</div>}>
              <CMSManager />
            </Suspense>
          </TabsContent>
          <TabsContent value="suggestions">
            <Suspense fallback={<div className="p-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 opacity-20" /> {t('admin.loading')}</div>}>
              <SuggestionsManager />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Users Tab Component ─────────────────────────────────────────
function UsersTab() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { user } = useAuth();

  const { data: users, isLoading, refetch } = trpc.users.list.useQuery();

  const createUserMutation = trpc.users.create.useMutation({
    onSuccess: () => utils.users.list.invalidate(),
  });

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => utils.users.list.invalidate(),
  });

  const deleteUserMutation = trpc.users.delete.useMutation({
    onSuccess: () => utils.users.list.invalidate(),
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    openId: "",
    name: "",
    email: "",
    password: "",
    role: "editeur" as const,
  });

  const handleCreate = () => {
    if (!newUser.password) {
      toast.error(t('admin.users.passwordRequired'));
      return;
    }
    createUserMutation.mutate({
      openId: newUser.openId || `user-${Date.now()}`,
      name: newUser.name,
      email: newUser.email || undefined,
      role: newUser.role,
      password: newUser.password,
    });
    setIsCreateOpen(false);
    setNewUser({ openId: "", name: "", email: "", password: "", role: "editeur" });
  };

  const handleRoleChange = (userId: number, role: string) => {
    updateRoleMutation.mutate({ userId, role: role as any });
  };

  const handleDelete = (userId: number) => {
    if (confirm(t('admin.usersTab.confirmDelete'))) {
      deleteUserMutation.mutate({ userId });
    }
  };

  const roleLabels: Record<string, string> = {
    admin: t('admin.roles.admin'),
    editeur: t('admin.roles.editeur'),
    bibliotheque: t('admin.roles.bibliotheque'),
    user: t('admin.roles.user'),
  };

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800",
    editeur: "bg-blue-100 text-blue-800",
    bibliotheque: "bg-green-100 text-green-800",
    user: "bg-gray-100 text-gray-800",
  };

  if (user?.role !== "admin") {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
        <h2 className="text-xl font-semibold">{t('admin.usersTab.accessDenied')}</h2>
        <p className="text-muted-foreground">{t('admin.usersTab.accessDeniedDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('admin.usersTab.title')}</h2>
          <p className="text-muted-foreground">{t('admin.usersTab.description')}</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('admin.usersTab.addUser')}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.usersTab.columnName')}</TableHead>
              <TableHead>{t('admin.usersTab.columnEmail')}</TableHead>
              <TableHead>{t('admin.usersTab.columnRole')}</TableHead>
              <TableHead>{t('admin.usersTab.columnLastLogin')}</TableHead>
              <TableHead className="text-right">{t('admin.usersTab.columnActions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : users?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {t('admin.users.notFound')}
                </TableCell>
              </TableRow>
            ) : (
              users?.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name || t('admin.usersTab.noName')}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email || "-"}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(role) => handleRoleChange(u.id, role)}
                      disabled={u.role === "admin"}
                    >
                      <SelectTrigger className={`w-40 ${roleColors[u.role] || ""}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">{t('admin.roles.user')}</SelectItem>
                        <SelectItem value="editeur">{t('admin.roles.editeur')}</SelectItem>
                        <SelectItem value="bibliotheque">{t('admin.roles.bibliotheque')}</SelectItem>
                        <SelectItem value="admin">{t('admin.roles.admin')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.lastSignedIn
                      ? new Date(u.lastSignedIn).toLocaleDateString("fr-FR")
                      : t('admin.usersTab.never')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(u.id)}
                      disabled={u.role === "admin"}
                      aria-label="Supprimer l'utilisateur"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.users.createTitle')}</DialogTitle>
              <DialogDescription>{t('admin.users.createDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('admin.usersTab.nameLabel')}</Label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder={t('admin.usersTab.namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.usersTab.emailLabel')}</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="email@exemple.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.usersTab.passwordLabel')}</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder={t('admin.usersTab.passwordPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.usersTab.roleLabel')}</Label>
              <Select
                value={newUser.role}
                onValueChange={(role) => setNewUser({ ...newUser, role: role as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editeur">{t('admin.roles.editeur')}</SelectItem>
                  <SelectItem value="bibliotheque">{t('admin.roles.bibliotheque')}</SelectItem>
                  <SelectItem value="user">{t('admin.roles.user')}</SelectItem>
                  <SelectItem value="admin">{t('admin.roles.admin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                {t('admin.dialogs.confirmDelete.cancel')}
              </Button>
            <Button onClick={handleCreate} disabled={!newUser.name}>
              {t('admin.usersTab.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
