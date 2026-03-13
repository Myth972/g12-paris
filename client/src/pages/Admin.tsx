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
import PageContentManager from "@/components/PageContentManager";
import VersesManager from "@/components/VersesManager";
import GalleryManager from "@/components/GalleryManager";
import { AIChatBox, Message } from "@/components/AIChatBox";
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
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const NOTIF_TYPE_CONFIG = {
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50", label: "Info" },
  alerte: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", label: "Alerte" },
  "nouveauté": { icon: Sparkles, color: "text-emerald-500", bg: "bg-emerald-50", label: "Nouveauté" },
  important: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50", label: "Important" },
};

// ─── Articles Tab ──────────────────────────────────────────────

function ArticlesTab() {
  const [, setLocation] = useLocation();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.articles.adminList.useQuery();
  const deleteMutation = trpc.articles.delete.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      toast.success("Article supprimé");
      setDeleteId(null);
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const togglePublish = trpc.articles.update.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      toast.success("Statut mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const articles = data?.items ?? [];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {data?.total ?? 0} article{(data?.total ?? 0) > 1 ? "s" : ""} au total
        </p>
        <Button size="sm" asChild>
          <Link href="/admin/article/new">
            <Plus className="w-4 h-4 mr-1" />
            Nouvel article
          </Link>
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-serif font-semibold text-foreground mb-1">Aucun article</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Créez votre premier article pour commencer.
            </p>
            <Button size="sm" asChild>
              <Link href="/admin/article/new">
                <Plus className="w-4 h-4 mr-1" />
                Créer un article
              </Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Titre</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article: any) => (
                <TableRow key={article.id}>
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
                      <span className="font-medium text-sm line-clamp-1">{article.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{article.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={article.published ? "default" : "secondary"} className="text-xs">
                      {article.published ? "Publié" : "Brouillon"}
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
                        title={article.published ? "Dépublier" : "Publier"}
                        onClick={() =>
                          togglePublish.mutate({ id: article.id, published: !article.published })
                        }
                      >
                        {article.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/admin/article/${article.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(article.id)}
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
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet article ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'article sera définitivement supprimé.
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
    </>
  );
}

// ─── Notifications Tab ─────────────────────────────────────────

function NotificationsTab() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
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
      toast.success("Notification envoyée");
      setShowCreateDialog(false);
      setNewNotif({ title: "", message: "", type: "info", linkUrl: "" });
    },
    onError: () => toast.error("Erreur lors de l'envoi"),
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.adminList.invalidate();
      toast.success("Notification supprimée");
      setDeleteId(null);
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const notifs = data?.items ?? [];

  const handleCreate = () => {
    if (!newNotif.title.trim() || !newNotif.message.trim()) {
      toast.error("Veuillez remplir le titre et le message");
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
          {data?.total ?? 0} notification{(data?.total ?? 0) > 1 ? "s" : ""} envoyée{(data?.total ?? 0) > 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Send className="w-4 h-4 mr-1" />
          Nouvelle notification
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-serif font-semibold text-foreground mb-1">Aucune notification</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Envoyez votre première notification aux utilisateurs.
            </p>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Send className="w-4 h-4 mr-1" />
              Envoyer une notification
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifs.map((notif: any) => {
              const config = NOTIF_TYPE_CONFIG[notif.type as keyof typeof NOTIF_TYPE_CONFIG] ?? NOTIF_TYPE_CONFIG.info;
              const Icon = config.icon;

              return (
                <div key={notif.id} className="flex items-start gap-4 p-4 hover:bg-accent/30 transition-colors">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-semibold text-foreground">{notif.title}</h4>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{notif.message}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-muted-foreground/70">
                        {formatDate(notif.createdAt)} par {notif.authorName || "Admin"}
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
            <DialogTitle className="font-serif">Nouvelle notification</DialogTitle>
            <DialogDescription>
              Envoyez une notification à tous les utilisateurs du site.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="notif-title">Titre *</Label>
              <Input
                id="notif-title"
                placeholder="Titre de la notification..."
                value={newNotif.title}
                onChange={(e) => setNewNotif({ ...newNotif, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-type">Type</Label>
              <Select
                value={newNotif.type}
                onValueChange={(v) => setNewNotif({ ...newNotif, type: v as typeof newNotif.type })}
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
              <Label htmlFor="notif-message">Message *</Label>
              <Textarea
                id="notif-message"
                placeholder="Contenu de la notification..."
                rows={3}
                value={newNotif.message}
                onChange={(e) => setNewNotif({ ...newNotif, message: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-link">Lien (optionnel)</Label>
              <Input
                id="notif-link"
                placeholder="/article/mon-article ou https://..."
                value={newNotif.linkUrl}
                onChange={(e) => setNewNotif({ ...newNotif, linkUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                URL vers laquelle l'utilisateur sera redirigé en cliquant sur la notification.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <Send className="w-4 h-4 mr-1" />
              {createMutation.isPending ? "Envoi..." : "Envoyer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette notification ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La notification sera définitivement supprimée pour tous les utilisateurs.
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
    </>
  );
}

// ─── AI Assistant Tab ──────────────────────────────────────────

function AIAssistantTab() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: "Tu es un assistant IA puissant et utile. Tu aides l'administrateur du site G12 Paris à gérer le contenu, rédiger des articles et répondre aux questions. Ton modèle actuel est Llama 3.3 70B via Groq." }
  ]);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (response) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: response
      }]);
    },
    onError: (error) => {
      toast.error("Erreur IA: " + error.message);
    }
  });

  const handleSend = (content: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    chatMutation.mutate({ messages: newMessages });
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <div>
          <h3 className="text-lg font-serif font-bold text-foreground">Assistant IA Groq</h3>
          <p className="text-xs text-muted-foreground">Llama 3.3 70B - Sans limites pour votre rédaction</p>
        </div>
      </div>
      
      <AIChatBox
        messages={messages}
        onSendMessage={handleSend}
        isLoading={chatMutation.isPending}
        height="650px"
        placeholder="Posez une question ou demandez de l'aide pour la rédaction..."
        suggestedPrompts={[
          "Rédige un message d'accueil pour la page d'accueil",
          "Donne-moi des idées d'articles sur la foi",
          "Comment optimiser mes descriptions ?",
          "Écris un verset biblique inspirant sur l'amour"
        ]}
      />
    </div>
  );
}

// ─── Main Admin Page ───────────────────────────────────────────

export default function Admin() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();

  if (authLoading) {
    return (
      <div className="container py-10">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="container py-20 text-center">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-serif font-bold mb-2">Accès restreint</h2>
        <p className="text-muted-foreground mb-6">
          Cette page est réservée aux administrateurs.
        </p>
        <Button variant="outline" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Admin header */}
      <div className="bg-card border-b border-border">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary font-sans">
                  Administration
                </span>
              </div>
              <h1 className="text-2xl font-serif font-bold text-foreground">
                Tableau de bord
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/tutorial">
                  <HelpCircle className="w-4 h-4 mr-1" />
                  Guide d'organisation
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Site
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container py-6">
        <Tabs defaultValue="articles" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="articles" className="gap-2">
              <Newspaper className="w-4 h-4" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-2">
              <Newspaper className="w-4 h-4" />
              Contenu des pages
            </TabsTrigger>
            <TabsTrigger value="publications" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Publications & Versets
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Assistant IA
            </TabsTrigger>
          </TabsList>
          <TabsContent value="articles">
            <ArticlesTab />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>
          <TabsContent value="pages">
            <div className="space-y-8">
              <PageContentManager pageId="home" pageName="Accueil" />
              <PageContentManager pageId="publication-du-jour" pageName="Publication du jour" />
              <PageContentManager pageId="galeries" pageName="Galeries" />
              <PageContentManager pageId="culte-en-ligne" pageName="Culte en ligne" />
              <PageContentManager pageId="bibliotheque" pageName="Bibliothèque" />
            </div>
          </TabsContent>
          <TabsContent value="publications" className="space-y-8">
            <GalleryManager />
            <div className="h-px bg-border my-8" />
            <VersesManager />
          </TabsContent>
          <TabsContent value="ai">
            <AIAssistantTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
