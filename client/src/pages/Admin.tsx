import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminBreadcrumb } from "@/components/AdminNav";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
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
  Image as ImageIcon,
  Video,
  Quote,
  Type,
  Layout,
  ArrowUp,
  ArrowDown,
  Upload,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import axios from "axios";

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

function ArticlesTab({ enabled }: { enabled: boolean }) {
  const [, setLocation] = useLocation();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.articles.adminList.useQuery(undefined, {
    enabled,
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
  });
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
                <TableHead>Importance</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {article.coverImageUrl ? (
                        <img
                          src={article.coverImageUrl}
                          alt=""
                          className="w-12 h-8 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <Newspaper className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium text-sm line-clamp-1">{article.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={article.weight}
                      className="w-16 h-8 text-xs"
                      onChange={(e) =>
                        togglePublish.mutate({ id: article.id, weight: parseInt(e.target.value) || 0 })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{article.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={article.published ? "default" : "secondary"} className="text-xs">
                      {article.published ? "Publié" : "Brouillon"}
                    </Badge>
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

function NotificationsTab({ enabled }: { enabled: boolean }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [newNotif, setNewNotif] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "alerte" | "nouveauté" | "important",
    linkUrl: "",
  });

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.notifications.adminList.useQuery(undefined, {
    enabled,
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
  });

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
            {notifs.map((notif) => {
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

// ─── Gallery Tab ───────────────────────────────────────────────

function GalleryTab({ enabled }: { enabled: boolean }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newAlt, setNewAlt] = useState("");
  const [newWeight, setNewWeight] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const utils = trpc.useUtils();
  const { data: images, isLoading } = trpc.galleries.list.useQuery(undefined, {
    enabled,
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
  });

  const createMutation = trpc.galleries.create.useMutation({
    onSuccess: () => {
      utils.galleries.list.invalidate();
      toast.success("Image ajoutée");
      setShowAdd(false);
      setNewUrl("");
      setNewAlt("");
      setNewWeight(0);
    },
  });

  const uploadMutation = trpc.media.upload.useMutation();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({
          base64,
          filename: file.name,
          contentType: file.type,
          prefix: "gallery",
        });
        setNewUrl(result.url);
        toast.success("Image importée avec succès");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      toast.error("Erreur lors de l'import");
      setIsUploading(false);
    }
  };

  const deleteMutation = trpc.galleries.delete.useMutation({
    onSuccess: () => {
      utils.galleries.list.invalidate();
      toast.success("Image supprimée");
    },
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{images?.length ?? 0} image(s)</p>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Ajouter une image
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)
        ) : (
          images?.map((img) => (
            <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden bg-muted border border-border">
              <img src={img.src} alt={img.alt || ""} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <div className="flex bg-background/20 rounded-md p-1 backdrop-blur-sm">
                  <span className="text-white text-[10px] font-bold px-1">W: {img.weight}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => deleteMutation.mutate({ id: img.id })}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter à la Galerie</DialogTitle>
            <DialogDescription className="sr-only">
              Importez ou liez une nouvelle image pour la galerie.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Source de l'image</Label>
              <div className="flex gap-2">
                <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." className="flex-1" />
                <Button variant="outline" size="icon" className="shrink-0 relative">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </Button>
              </div>
              {isUploading && <p className="text-[10px] text-primary animate-pulse">Chargement...</p>}
            </div>
            <div className="space-y-2">
              <Label>Description (Alt)</Label>
              <Input value={newAlt} onChange={(e) => setNewAlt(e.target.value)} placeholder="Description..." />
            </div>
            <div className="space-y-2">
              <Label>Importance (Poids)</Label>
              <Input type="number" value={newWeight} onChange={(e) => setNewWeight(parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!newUrl || createMutation.isPending}
              onClick={() => createMutation.mutate({ src: newUrl, alt: newAlt, weight: newWeight })}
            >
              {createMutation.isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Publications Tab ──────────────────────────────────────────

function PublicationsTab({ enabled }: { enabled: boolean }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ type: "image", content: "", title: "", weight: 0 });
  const [isUploading, setIsUploading] = useState(false);

  const utils = trpc.useUtils();
  const { data: items, isLoading } = trpc.publications.list.useQuery(undefined, {
    enabled,
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
  });

  const createMutation = trpc.publications.create.useMutation({
    onSuccess: () => {
      utils.publications.list.invalidate();
      toast.success("Élément ajouté");
      setShowAdd(false);
      setNewItem({ type: "image", content: "", title: "", weight: 0 });
    },
  });

  const uploadMutation = trpc.media.upload.useMutation();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({
          base64,
          filename: file.name,
          contentType: file.type,
          prefix: "publications",
        });
        setNewItem({ ...newItem, content: result.url });
        toast.success("Image importée avec succès");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      toast.error("Erreur lors de l'import");
      setIsUploading(false);
    }
  };

  const deleteMutation = trpc.publications.delete.useMutation({
    onSuccess: () => {
      utils.publications.list.invalidate();
      toast.success("Élément supprimé");
    },
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{items?.length ?? 0} publication(s)</p>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Nouveau contenu
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          items?.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                {item.type === "image" && <ImageIcon className="w-5 h-5" />}
                {item.type === "video" && <Video className="w-5 h-5" />}
                {item.type === "verse" && <Quote className="w-5 h-5" />}
                {item.type === "summary" && <Type className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold truncate">{item.title || item.type}</h4>
                <p className="text-xs text-muted-foreground truncate">{item.content}</p>
              </div>
              <div className="text-xs font-bold bg-muted px-2 py-1 rounded shrink-0">W: {item.weight}</div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive h-8 w-8 hover:bg-destructive/10"
                onClick={() => deleteMutation.mutate({ id: item.id })}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une Publication</DialogTitle>
            <DialogDescription className="sr-only">
              Créez une nouvelle publication quotidienne (image, vidéo, verset ou résumé).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Type de contenu</Label>
              <Select value={newItem.type} onValueChange={(v) => setNewItem({ ...newItem, type: v, content: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image du Jour</SelectItem>
                  <SelectItem value="video">Vidéo YouTube</SelectItem>
                  <SelectItem value="verse">Verset du Jour</SelectItem>
                  <SelectItem value="summary">Résumé Biblique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{newItem.type === "verse" || newItem.type === "summary" ? "Texte du contenu" : "URL / Fichier"}</Label>
              <div className="flex gap-2">
                <Textarea
                  placeholder={newItem.type === "verse" ? "Saisissez le verset..." : newItem.type === "summary" ? "Saisissez le résumé..." : "https://..."}
                  value={newItem.content}
                  onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                  className="flex-1"
                  rows={newItem.type === "image" || newItem.type === "video" ? 1 : 4}
                />
                {newItem.type === "image" && (
                  <Button variant="outline" size="icon" className="shrink-0 relative h-10">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </Button>
                )}
              </div>
              {isUploading && <p className="text-[10px] text-primary animate-pulse">Chargement...</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Titre / Légende (Optionnel)</Label>
                <div className="flex gap-2">
                  {["Image du Jour", "Image Animé du Jour", "Image Animée du Jour Précédent"].map(suggestedTitle => (
                    <button
                      key={suggestedTitle}
                      type="button"
                      onClick={() => setNewItem({ ...newItem, title: suggestedTitle })}
                      className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary px-1.5 py-0.5 rounded transition-colors"
                    >
                      {suggestedTitle.split(" ").slice(0, 3).join(" ")}...
                    </button>
                  ))}
                </div>
              </div>
              <Input
                placeholder="Ex: Jean 3:16 ou Légende image..."
                value={newItem.title || ""}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              />
              <p className="text-[10px] text-muted-foreground">
                Utilisez les titres suggérés pour placer le contenu dans la grille "du Jour".
              </p>
            </div>
            <div className="space-y-2">
              <Label>Importance (Poids)</Label>
              <Input type="number" value={newItem.weight} onChange={(e) => setNewItem({ ...newItem, weight: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button disabled={!newItem.content || createMutation.isPending} onClick={() => createMutation.mutate(newItem)}>
              {createMutation.isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Pages Tab ────────────────────────────────────────────────

function PagesTab({ enabled }: { enabled: boolean }) {
  const [editingPage, setEditingPage] = useState<any>(null);
  const utils = trpc.useUtils();
  const { data: pages, isLoading } = trpc.pages.list.useQuery(undefined, {
    enabled,
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
  });

  const upsertMutation = trpc.pages.upsert.useMutation({
    onSuccess: () => {
      utils.pages.list.invalidate();
      toast.success("Page mise à jour");
      setEditingPage(null);
    },
  });

  const PAGE_DESCRIPTIONS: Record<string, string> = {
    galeries: "Gérez le titre et la description de la page Galerie.",
    publications: "Gérez le titre et la description de la page Publications.",
    home: "Gérez les métadonnées de la page d'accueil.",
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
        ) : (
          pages?.map((page) => (
            <Card key={page.id} className="overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-muted/30 pb-3">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <Layout className="w-4 h-4 text-primary" />
                  {page.title}
                </CardTitle>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-sans">Slug: {page.slug}</p>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                  {page.description || "Aucune description."}
                </p>
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setEditingPage(page)}>
                  <Pencil className="w-4 h-4" />
                  Modifier
                </Button>
              </CardContent>
            </Card>
          ))
        )}

        {/* Helper for missing pages */}
        {!isLoading && !pages?.find(p => p.slug === "galeries") && (
          <Card className="border-dashed border-2 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <p className="text-sm mb-4">Initialisez la configuration de la Galerie</p>
            <Button size="sm" onClick={() => upsertMutation.mutate({ slug: "galeries", title: "Galeries d'Images", description: "Découvrez les moments forts de notre communauté." })}>Initialiser</Button>
          </Card>
        )}
        {!isLoading && !pages?.find(p => p.slug === "publications") && (
          <Card className="border-dashed border-2 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <p className="text-sm mb-4">Initialisez la configuration des Publications</p>
            <Button size="sm" onClick={() => upsertMutation.mutate({ slug: "publications", title: "Publications du Jour", description: "Inspirations quotidiennes et enseignements." })}>Initialiser</Button>
          </Card>
        )}
        {!isLoading && !pages?.find(p => p.slug === "home") && (
          <Card className="border-dashed border-2 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <p className="text-sm mb-4">Initialisez la configuration de l'Accueil</p>
            <Button size="sm" onClick={() => upsertMutation.mutate({ slug: "home", title: "G12 Paris Infos Médias", description: "L'actualité qui compte, racontée avec rigueur." })}>Initialiser</Button>
          </Card>
        )}
      </div>

      <Dialog open={editingPage !== null} onOpenChange={() => setEditingPage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la page : {editingPage?.title}</DialogTitle>
            <DialogDescription>{PAGE_DESCRIPTIONS[editingPage?.slug] || "Configurez les informations de cette page."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Titre de la page</Label>
              <Input
                value={editingPage?.title || ""}
                onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description / Sous-titre</Label>
              <Textarea
                value={editingPage?.description || ""}
                onChange={(e) => setEditingPage({ ...editingPage, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={upsertMutation.isPending}
              onClick={() => upsertMutation.mutate({
                slug: editingPage.slug,
                title: editingPage.title,
                description: editingPage.description,
              })}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main Admin Page ───────────────────────────────────────────

export default function Admin() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTabState] = useState("articles");

  // Sync activeTab with URL on mount and when URL changes
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tabFromUrl = searchParams.get("tab") || "articles";
    setActiveTabState(tabFromUrl);
  }, [location]);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    setLocation(`/admin?tab=${tab}`);
  };

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

        {import.meta.env.DEV && (
          <div className="mt-12 p-6 border border-amber-200 bg-amber-50/50 rounded-xl max-w-md mx-auto">
            <h3 className="text-amber-800 font-semibold flex items-center gap-2 justify-center mb-2">
              <Shield className="w-4 h-4" />
              Mode Développement
            </h3>
            <p className="text-sm text-amber-700 mb-4">
              L'authentification OAuth n'est pas configurée. Utilisez ce bouton pour accéder à l'administration en local.
            </p>
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              onClick={async () => {
                const loadingToast = toast.loading("Connexion dev...");
                try {
                  await axios.post("/api/dev/login", { role: "admin" });
                  toast.success("Connecté en tant qu'admin !", { id: loadingToast });
                  window.location.reload();
                } catch (err) {
                  toast.error("Erreur bypass dev", { id: loadingToast });
                }
              }}
            >
              Forcer la connexion Admin
            </Button>
          </div>
        )}
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
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Site
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container py-6">
        {/* Breadcrumb Navigation */}
        <AdminBreadcrumb
          items={[
            {
              label: activeTab === "articles" ? "Articles" : 
                     activeTab === "gallery" ? "Galerie" :
                     activeTab === "publications" ? "Publications" :
                     activeTab === "pages" ? "Pages" :
                     activeTab === "notifications" ? "Notifications" :
                     activeTab === "theme" ? "Thème" :
                     activeTab === "typography" ? "Typographie" : "Tableau de bord",
              active: true,
            },
          ]}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="articles" className="gap-2">
              <Newspaper className="w-4 h-4" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Galerie
            </TabsTrigger>
            <TabsTrigger value="publications" className="gap-2">
              <Layout className="w-4 h-4" />
              Publications
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-2">
              <Settings className="w-4 h-4" />
              Pages
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="theme" className="gap-2">
              <Settings className="w-4 h-4" />
              Thème
            </TabsTrigger>
            <TabsTrigger value="typography" className="gap-2">
              <Type className="w-4 h-4" />
              Typographie
            </TabsTrigger>
          </TabsList>
          <TabsContent value="articles">
            <ArticlesTab enabled={activeTab === "articles"} />
          </TabsContent>
          <TabsContent value="gallery">
            <GalleryTab enabled={activeTab === "gallery"} />
          </TabsContent>
          <TabsContent value="publications">
            <PublicationsTab enabled={activeTab === "publications"} />
          </TabsContent>
          <TabsContent value="pages">
            <PagesTab enabled={activeTab === "pages"} />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationsTab enabled={activeTab === "notifications"} />
          </TabsContent>
          <TabsContent value="theme">
            <Card>
              <CardHeader>
                <CardTitle>Personnalisation du thème</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Accédez à la page de personnalisation du thème pour modifier les couleurs et le mode sombre/clair.</p>
                <Button asChild>
                  <Link href="/theme">
                    <Settings className="w-4 h-4 mr-2" />
                    Ouvrir le personnalisateur de thème
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="typography">
            <Card>
              <CardHeader>
                <CardTitle>Personnalisation de la typographie</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Personnalisez les polices, les tailles et les espacements du texte.</p>
                <Button asChild>
                  <Link href="/typography">
                    <Type className="w-4 h-4 mr-2" />
                    Ouvrir le personnalisateur de typographie
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
