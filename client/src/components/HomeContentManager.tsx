import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useBlobUpload } from "@/hooks/useBlobUpload";
import {
  Trash2,
  Plus,
  Image as ImageIcon,
  MessageCircle,
  LayoutDashboard,
  Loader2,
  Link,
  Megaphone,
  Zap,
  Church,
  BookOpen,
  Mic2,
  Calendar,
} from "lucide-react";

export default function HomeContentManager() {
  return (
    <div className="space-y-10">
      <WhatsAppSliderSection />
      <AnnouncementsSection />
      <FlashEventsSection />
    </div>
  );
}

// ─── WhatsApp Slider ─────────────────────────────────────────────

function WhatsAppSliderSection() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.pageContent.adminList.useQuery({ pageId: "whatsapp" });
  const { uploadFile, isUploading } = useBlobUpload();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", description: "", mediaUrl: "", textColor: "", titleColor: "", ctaLabel: "", ctaHref: "" });

  const createMutation = trpc.pageContent.create.useMutation({
    onSuccess: () => { utils.pageContent.adminList.invalidate(); utils.pageContent.featuredHome.invalidate(); toast.success("Slide ajouté"); resetForm(); },
    onError: (e) => toast.error("Erreur: " + e.message),
  });

  const updateMutation = trpc.pageContent.update.useMutation({
    onSuccess: () => { utils.pageContent.adminList.invalidate(); utils.pageContent.featuredHome.invalidate(); toast.success("Slide mis à jour"); },
    onError: (e) => toast.error("Erreur: " + e.message),
  });

  const deleteMutation = trpc.pageContent.delete.useMutation({
    onSuccess: () => { utils.pageContent.adminList.invalidate(); utils.pageContent.featuredHome.invalidate(); toast.success("Slide supprimé"); },
    onError: (e) => toast.error("Erreur: " + e.message),
  });

  const items = data?.items ?? [];

  function resetForm() { setForm({ title: "", description: "", mediaUrl: "", textColor: "", titleColor: "", ctaLabel: "", ctaHref: "" }); setEditingId(null); setOpen(false); }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadFile({ file, folder: "page-content" });
      setForm(p => ({ ...p, mediaUrl: result.url, title: p.title || file.name.replace(/\.[^.]+$/, "") }));
      toast.success("Image uploadée");
    } catch { toast.error("Échec de l'upload"); }
  }

  function handleSubmit() {
    if (!form.title.trim() || !form.mediaUrl.trim()) {
      toast.error("Titre et image requis");
      return;
    }
    const textColor = form.textColor.trim() || undefined;
    const titleColor = form.titleColor.trim() || undefined;
    const ctaLabel = form.ctaLabel.trim() || undefined;
    const ctaHref = form.ctaHref.trim() || undefined;
    if (editingId) {
      updateMutation.mutate({ id: editingId, title: form.title.trim(), description: form.description.trim(), mediaUrl: form.mediaUrl, textColor, titleColor, ctaLabel, ctaHref });
    } else {
      createMutation.mutate({
        pageId: "whatsapp",
        contentType: "image",
        title: form.title.trim(),
        mediaUrl: form.mediaUrl,
        description: form.description.trim(),
        displayOrder: 0,
        featuredHome: true,
        textColor,
        titleColor,
        ctaLabel,
        ctaHref,
      });
    }
  }

  function handleEdit(item: any) {
    setForm({ title: item.title, description: item.description || "", mediaUrl: item.mediaUrl, textColor: item.textColor || "", titleColor: item.titleColor || "", ctaLabel: item.ctaLabel || "", ctaHref: item.ctaHref || "" });
    setEditingId(item.id);
    setOpen(true);
  }

  const editIcon = (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-lg font-serif font-bold text-foreground">Slider WhatsApp</h3>
            <p className="text-xs text-muted-foreground">
              {items.length} slide{items.length > 1 ? "s" : ""} — MetaSlider de l'accueil (au-dessus des annonces)
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement...
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <MessageCircle className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-1">Aucun slide WhatsApp</p>
            <p className="text-xs text-muted-foreground/70">
              Ajoutez des images pour le slider de l'accueil
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item: any) => (
            <Card key={item.id} className="overflow-hidden group hover:shadow-md transition-shadow">
              <div className="h-32 sm:h-36 relative bg-muted overflow-hidden">
                {item.mediaUrl ? (
                  <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-8 h-8 text-foreground/20" />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className="bg-green-500/90 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm">WhatsApp</span>
                </div>
              </div>
              <CardContent className="p-2.5 sm:p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{item.title}</p>
                    {item.description && (
                      <p className="text-[11px] text-foreground/70 mt-0.5 leading-snug line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground/60 hover:text-foreground" onClick={() => handleEdit(item)}>{editIcon}</Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => { if (confirm("Supprimer ce slide ?")) deleteMutation.mutate({ id: item.id }); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={v => { if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="font-serif">{editingId ? "Modifier le slide" : "Nouveau slide WhatsApp"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Message du Pasteur" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Texte d'information..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Upload image</Label>
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploading} className="text-xs" />
                {isUploading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
              <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-card px-2 text-muted-foreground">ou URL directe</span></div>
            </div>
            <div className="space-y-2">
              <Label>URL de l'image</Label>
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input value={form.mediaUrl} onChange={e => setForm(p => ({ ...p, mediaUrl: e.target.value }))} placeholder="https://exemple.com/image.jpg" />
              </div>
              {form.mediaUrl && (
                <div className="mt-2 rounded-md overflow-hidden border">
                  <img src={form.mediaUrl} alt="" className="max-h-32 w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Texte du bouton</Label>
                <Input value={form.ctaLabel} onChange={e => setForm(p => ({ ...p, ctaLabel: e.target.value }))} placeholder="En savoir plus" />
              </div>
              <div className="space-y-2">
                <Label>Lien du bouton</Label>
                <Input value={form.ctaHref} onChange={e => setForm(p => ({ ...p, ctaHref: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Couleur de la description</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.textColor || "#ffffff"}
                  onChange={e => setForm(p => ({ ...p, textColor: e.target.value }))}
                  className="w-9 h-9 rounded-md border border-border/50 cursor-pointer bg-transparent p-0.5"
                />
                <Input
                  value={form.textColor}
                  onChange={e => setForm(p => ({ ...p, textColor: e.target.value }))}
                  placeholder="#ffffff"
                  className="text-xs font-mono"
                />
              </div>
              {form.description && form.textColor && (
                <div className="mt-2 p-3 rounded-md border text-sm leading-relaxed" style={{ backgroundColor: "rgba(0,0,0,0.4)", color: form.textColor }}>
                  {form.description}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Couleur du titre</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.titleColor || "#ffffff"}
                  onChange={e => setForm(p => ({ ...p, titleColor: e.target.value }))}
                  className="w-9 h-9 rounded-md border border-border/50 cursor-pointer bg-transparent p-0.5"
                />
                <Input
                  value={form.titleColor}
                  onChange={e => setForm(p => ({ ...p, titleColor: e.target.value }))}
                  placeholder="#ffffff"
                  className="text-xs font-mono"
                />
              </div>
              {form.title && form.titleColor && (
                <div className="mt-2 p-3 rounded-md border text-sm leading-relaxed font-bold" style={{ backgroundColor: "rgba(0,0,0,0.4)", color: form.titleColor }}>
                  {form.title}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || !form.title.trim() || !form.mediaUrl.trim()}>
              {editingId ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Shared Announcement Dialog ──────────────────────────────────

function AnnouncementDialog({ open, onOpenChange, editing, onSubmit }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: any | null;
  onSubmit: (data: any) => void;
}) {
  const { uploadFile, isUploading } = useBlobUpload();
  const [form, setForm] = useState({
    title: "",
    description: "",
    mediaUrl: "",
    badge: "",
    eventDate: "",
    location: "",
    ctaLabel: "",
    ctaHref: "",
    textColor: "",
    titleColor: "",
  });
  const [isPending, setIsPending] = useState(false);

  const isEdit = !!editing;

  function resetForm() {
    setForm({ title: "", description: "", mediaUrl: "", badge: "", eventDate: "", location: "", ctaLabel: "", ctaHref: "", textColor: "", titleColor: "" });
  }

  function initForm(item: any) {
    setForm({
      title: item.title || "",
      description: item.description || "",
      mediaUrl: item.mediaUrl || "",
      badge: item.badge || "",
      eventDate: item.eventDate || "",
      location: item.location || "",
      ctaLabel: item.ctaLabel || "",
      ctaHref: item.ctaHref || "",
      textColor: item.textColor || "",
      titleColor: item.titleColor || "",
    });
  }

  React.useEffect(() => {
    if (open) {
      if (editing) initForm(editing);
      else resetForm();
    }
  }, [open, editing]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadFile({ file, folder: "announcements" });
      setForm(p => ({ ...p, mediaUrl: result.url }));
      toast.success("Image uploadée");
    } catch { toast.error("Échec de l'upload"); }
  }

  function handleSubmit() {
    if (!form.title.trim() || !form.mediaUrl.trim()) {
      toast.error("Titre et image requis");
      return;
    }
    setIsPending(true);
    onSubmit({
      id: editing?.id,
      title: form.title.trim(),
      description: form.description.trim(),
      mediaUrl: form.mediaUrl,
      badge: form.badge.trim() || undefined,
      eventDate: form.eventDate.trim() || undefined,
      location: form.location.trim() || undefined,
      ctaLabel: form.ctaLabel.trim() || undefined,
      ctaHref: form.ctaHref.trim() || undefined,
      textColor: form.textColor.trim() || undefined,
      titleColor: form.titleColor.trim() || undefined,
    });
  }

  React.useEffect(() => { setIsPending(false); }, [open]);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onOpenChange(false); }}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">{isEdit ? "Modifier" : "Nouvel élément"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Titre de l'annonce" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Badge</Label>
              <Input value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))} placeholder="Badge" />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input value={form.eventDate} onChange={e => setForm(p => ({ ...p, eventDate: e.target.value }))} placeholder="Date" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Lieu</Label>
            <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Lieu" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Texte du bouton</Label>
              <Input value={form.ctaLabel} onChange={e => setForm(p => ({ ...p, ctaLabel: e.target.value }))} placeholder="En savoir plus" />
            </div>
            <div className="space-y-2">
              <Label>Lien du bouton</Label>
              <Input value={form.ctaHref} onChange={e => setForm(p => ({ ...p, ctaHref: e.target.value }))} placeholder="/page" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Image</Label>
            <div className="flex items-center gap-2">
              <Input type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploading} className="text-xs" />
              {isUploading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            </div>
            <Input value={form.mediaUrl} onChange={e => setForm(p => ({ ...p, mediaUrl: e.target.value }))} placeholder="ou URL directe" className="text-xs" />
            {form.mediaUrl && (
              <div className="mt-1 rounded-md overflow-hidden border max-h-24">
                <img src={form.mediaUrl} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Couleur de la description</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.textColor || "#ffffff"}
                onChange={e => setForm(p => ({ ...p, textColor: e.target.value }))}
                className="w-9 h-9 rounded-md border border-border/50 cursor-pointer bg-transparent p-0.5"
              />
              <Input
                value={form.textColor}
                onChange={e => setForm(p => ({ ...p, textColor: e.target.value }))}
                placeholder="#ffffff"
                className="text-xs font-mono"
              />
            </div>
            {form.description && form.textColor && (
              <div className="mt-2 p-3 rounded-md border text-sm leading-relaxed" style={{ backgroundColor: "rgba(0,0,0,0.4)", color: form.textColor }}>
                {form.description}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Couleur du titre</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.titleColor || "#ffffff"}
                onChange={e => setForm(p => ({ ...p, titleColor: e.target.value }))}
                className="w-9 h-9 rounded-md border border-border/50 cursor-pointer bg-transparent p-0.5"
              />
              <Input
                value={form.titleColor}
                onChange={e => setForm(p => ({ ...p, titleColor: e.target.value }))}
                placeholder="#ffffff"
                className="text-xs font-mono"
              />
            </div>
            {form.title && form.titleColor && (
              <div className="mt-2 p-3 rounded-md border text-sm leading-relaxed font-bold" style={{ backgroundColor: "rgba(0,0,0,0.4)", color: form.titleColor }}>
                {form.title}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.title.trim() || !form.mediaUrl.trim()}>
            {isEdit ? "Mettre à jour" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Item Card ───────────────────────────────────────────────────

function ItemCard({ item, icon, onEdit, onDelete }: {
  item: any;
  icon: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const editIcon = (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
  );

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
      <div className="h-32 sm:h-36 relative bg-muted overflow-hidden">
        <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover" />
        {item.badge && (
          <div className="absolute top-2 left-2">
            <span className="bg-primary/90 text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">{item.badge}</span>
          </div>
        )}
      </div>
      <CardContent className="p-2.5 sm:p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              {icon}
              <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{item.title}</p>
            </div>
            {item.description && (
              <p className="text-[11px] text-foreground/70 leading-snug line-clamp-2">{item.description}</p>
            )}
            {(item.eventDate || item.location) && (
              <p className="text-[10px] text-foreground/50 mt-1">
                {item.eventDate}{item.eventDate && item.location ? " • " : ""}{item.location}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 pt-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground/60 hover:text-foreground" onClick={onEdit}>{editIcon}</Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Announcements Section ───────────────────────────────────────

const announcementIcons = [Church, Mic2, BookOpen];

function AnnouncementsSection() {
  const utils = trpc.useUtils();
  const { data: items, isLoading } = trpc.announcements.adminList.useQuery({ type: "announcement" });
  const createMutation = trpc.announcements.create.useMutation({
    onSuccess: () => { utils.announcements.adminList.invalidate(); utils.announcements.list.invalidate(); toast.success("Annonce créée"); setOpen(false); setEditing(null); },
    onError: (e) => toast.error("Erreur: " + e.message),
  });
  const updateMutation = trpc.announcements.update.useMutation({
    onSuccess: () => { utils.announcements.adminList.invalidate(); utils.announcements.list.invalidate(); toast.success("Annonce mise à jour"); setOpen(false); setEditing(null); },
    onError: (e) => toast.error("Erreur: " + e.message),
  });
  const deleteMutation = trpc.announcements.delete.useMutation({
    onSuccess: () => { utils.announcements.adminList.invalidate(); utils.announcements.list.invalidate(); toast.success("Annonce supprimée"); },
    onError: (e) => toast.error("Erreur: " + e.message),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const list = items ?? [];

  function handleSubmit(data: any) {
    const payload = { ...data, type: "announcement" as const, variant: "poster" as const };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-lg font-serif font-bold text-foreground">Annonces</h3>
            <p className="text-xs text-muted-foreground">{list.length} annonce{list.length > 1 ? "s" : ""} — s'affichent sous le slider WhatsApp</p>
          </div>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement...
        </div>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-center">
            <Megaphone className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-1">Aucune annonce</p>
            <p className="text-xs text-muted-foreground/70">Créez des annonces pour la section "Annonces" de l'accueil</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map((item: any, i: number) => {
            const Icon = announcementIcons[i] || announcementIcons[0];
            return (
              <ItemCard
                key={item.id}
                item={item}
                icon={<Icon className="w-3 h-3 text-primary" />}
                onEdit={() => { setEditing(item); setOpen(true); }}
                onDelete={() => { if (confirm("Supprimer cette annonce ?")) deleteMutation.mutate({ id: item.id }); }}
              />
            );
          })}
        </div>
      )}

      <AnnouncementDialog
        open={open}
        onOpenChange={v => { if (!v) { setOpen(false); setEditing(null); } }}
        editing={editing}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

// ─── Flash Events Section ────────────────────────────────────────

const flashIcons = [Calendar, Zap, Calendar, Calendar];

function FlashEventsSection() {
  const utils = trpc.useUtils();
  const { data: items, isLoading } = trpc.announcements.adminList.useQuery({ type: "flash-event" });
  const createMutation = trpc.announcements.create.useMutation({
    onSuccess: () => { utils.announcements.adminList.invalidate(); utils.announcements.list.invalidate(); toast.success("Événement créé"); setOpen(false); setEditing(null); },
    onError: (e) => toast.error("Erreur: " + e.message),
  });
  const updateMutation = trpc.announcements.update.useMutation({
    onSuccess: () => { utils.announcements.adminList.invalidate(); utils.announcements.list.invalidate(); toast.success("Événement mis à jour"); setOpen(false); setEditing(null); },
    onError: (e) => toast.error("Erreur: " + e.message),
  });
  const deleteMutation = trpc.announcements.delete.useMutation({
    onSuccess: () => { utils.announcements.adminList.invalidate(); utils.announcements.list.invalidate(); toast.success("Événement supprimé"); },
    onError: (e) => toast.error("Erreur: " + e.message),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const list = items ?? [];

  function handleSubmit(data: any) {
    const payload = { ...data, type: "flash-event" as const, variant: "default" as const };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-lg font-serif font-bold text-foreground">Événements flash</h3>
            <p className="text-xs text-muted-foreground">{list.length} événement{list.length > 1 ? "s" : ""} — s'affichent sous les annonces</p>
          </div>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement...
        </div>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-center">
            <Zap className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-1">Aucun événement flash</p>
            <p className="text-xs text-muted-foreground/70">Créez des événements pour la section "Événements flash" de l'accueil</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {list.map((item: any, i: number) => (
            <ItemCard
              key={item.id}
              item={item}
              icon={<Calendar className="w-3 h-3 text-primary" />}
              onEdit={() => { setEditing(item); setOpen(true); }}
              onDelete={() => { if (confirm("Supprimer cet événement ?")) deleteMutation.mutate({ id: item.id }); }}
            />
          ))}
        </div>
      )}

      <AnnouncementDialog
        open={open}
        onOpenChange={v => { if (!v) { setOpen(false); setEditing(null); } }}
        editing={editing}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
