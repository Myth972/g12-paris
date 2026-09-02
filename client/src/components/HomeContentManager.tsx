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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
  Music,
  Sparkles,
  Radio,
  Volume2,
  Save,
  Upload,
} from "lucide-react";

export default function HomeContentManager() {
  return (
    <div className="space-y-10">
      <BentoGridSection />
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
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground/60 hover:text-foreground" onClick={() => handleEdit(item)} aria-label="Modifier">{editIcon}</Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => { if (confirm("Supprimer ce slide ?")) deleteMutation.mutate({ id: item.id }); }} aria-label="Supprimer">
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
            <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground/60 hover:text-foreground" onClick={onEdit} aria-label="Modifier">{editIcon}</Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={onDelete} aria-label="Supprimer">
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
  const [selectedAnnouncements, setSelectedAnnouncements] = useState<number[]>([]);
  const list = items ?? [];

  const allSelected = list.length > 0 && selectedAnnouncements.length === list.length;
  const someSelected = selectedAnnouncements.length > 0 && selectedAnnouncements.length < list.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedAnnouncements([]);
    } else {
      setSelectedAnnouncements(list.map((item: any) => item.id));
    }
  }

  function toggleSelectItem(id: number) {
    setSelectedAnnouncements(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  const bulkDeleteAnnouncementMutation = trpc.announcements.bulkDelete.useMutation({
    onSuccess: () => {
      utils.announcements.adminList.invalidate();
      utils.announcements.list.invalidate();
      toast.success(`${selectedAnnouncements.length} annonce${selectedAnnouncements.length > 1 ? "s" : ""} supprimée${selectedAnnouncements.length > 1 ? "s" : ""}`);
      setSelectedAnnouncements([]);
    },
    onError: (e) => toast.error("Erreur: " + e.message),
  });

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

      {selectedAnnouncements.length > 0 && (
        <div className="flex items-center gap-3 mb-3 p-2.5 rounded-lg border bg-destructive/5 border-destructive/20">
          <span className="text-sm text-foreground font-medium">
            {selectedAnnouncements.length} sélectionné{selectedAnnouncements.length > 1 ? "s" : ""}
          </span>
          <Button
            size="sm"
            variant="destructive"
            disabled={bulkDeleteAnnouncementMutation.isPending}
            onClick={() => {
              if (confirm(`Supprimer ${selectedAnnouncements.length} annonce${selectedAnnouncements.length > 1 ? "s" : ""} ?`)) {
                bulkDeleteAnnouncementMutation.mutate({ ids: selectedAnnouncements });
              }
            }}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Supprimer
          </Button>
        </div>
      )}

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
        <>
          <div className="flex items-center gap-2 mb-2">
            <Checkbox
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={toggleSelectAll}
              aria-label="Tout sélectionner"
            />
            <span className="text-xs text-muted-foreground">
              {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map((item: any, i: number) => {
              const Icon = announcementIcons[i] || announcementIcons[0];
              return (
                <Card key={item.id} className="overflow-hidden group hover:shadow-md transition-shadow relative">
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedAnnouncements.includes(item.id)}
                      onCheckedChange={() => toggleSelectItem(item.id)}
                      aria-label={`Sélectionner ${item.title}`}
                    />
                  </div>
                  <div className="h-32 sm:h-36 relative bg-muted overflow-hidden">
                    {item.mediaUrl ? (
                      <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-8 h-8 text-foreground/20" />
                      </div>
                    )}
                    {item.badge && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-primary/90 text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">{item.badge}</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-2.5 sm:p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Icon className="w-3 h-3 text-primary" />
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
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground/60 hover:text-foreground" onClick={() => { setEditing(item); setOpen(true); }} aria-label="Modifier">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => { if (confirm("Supprimer cette annonce ?")) deleteMutation.mutate({ id: item.id }); }} aria-label="Supprimer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
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

// ─── Bento Grid & Audio Player Section ───────────────────────────

function BentoGridSection() {
  const utils = trpc.useUtils();
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const setSettingMutation = trpc.siteSettings.set.useMutation({
    onSuccess: () => {
      utils.siteSettings.getAll.invalidate();
      toast.success("Paramètres enregistrés avec succès");
    },
    onError: err => toast.error("Erreur: " + err.message),
  });
  const { uploadFile, isUploading } = useBlobUpload();

  const bentoEnabled = settingsQuery.data?.["visuals.bentoGrid.enabled"] !== "false";
  const audioEnabled = settingsQuery.data?.["visuals.audioPlayer.enabled"] !== "false";

  // Formulaires par tuile
  const [flagshipForm, setFlagshipForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    link: "",
    ctaLabel: "",
  });

  const [verseForm, setVerseForm] = useState({
    reference: "",
    text: "",
    audioTitle: "",
    audioUrl: "",
  });

  const [radarForm, setRadarForm] = useState({
    forceLive: "auto",
    day: "0",
    hour: "10",
    label: "Prochain Direct",
    link: "/culte-en-ligne",
  });

  const [eventForm, setEventForm] = useState({
    badge: "",
    title: "",
    date: "",
    imageUrl: "",
    link: "",
  });

  useEffect(() => {
    if (settingsQuery.data) {
      const d = settingsQuery.data;
      setFlagshipForm({
        title: (d["bento.flagship.title"] as string) || "",
        description: (d["bento.flagship.description"] as string) || "",
        imageUrl: (d["bento.flagship.imageUrl"] as string) || "",
        link: (d["bento.flagship.link"] as string) || "",
        ctaLabel: (d["bento.flagship.ctaLabel"] as string) || "",
      });
      setVerseForm({
        reference: (d["bento.verse.reference"] as string) || "",
        text: (d["bento.verse.text"] as string) || "",
        audioTitle: (d["bento.verse.audioTitle"] as string) || "",
        audioUrl: (d["bento.verse.audioUrl"] as string) || "",
      });
      setRadarForm({
        forceLive: (d["bento.radar.forceLive"] as string) || "auto",
        day: (d["bento.radar.day"] as string) || "0",
        hour: (d["bento.radar.hour"] as string) || "10",
        label: (d["bento.radar.label"] as string) || "Prochain Direct",
        link: (d["bento.radar.link"] as string) || "/culte-en-ligne",
      });
      setEventForm({
        badge: (d["bento.event.badge"] as string) || "",
        title: (d["bento.event.title"] as string) || "",
        date: (d["bento.event.date"] as string) || "",
        imageUrl: (d["bento.event.imageUrl"] as string) || "",
        link: (d["bento.event.link"] as string) || "",
      });
    }
  }, [settingsQuery.data]);

  const handleToggleBento = (checked: boolean) => {
    setSettingMutation.mutate({
      key: "visuals.bentoGrid.enabled",
      value: checked ? "true" : "false",
    });
  };

  const handleToggleAudio = (checked: boolean) => {
    setSettingMutation.mutate({
      key: "visuals.audioPlayer.enabled",
      value: checked ? "true" : "false",
    });
  };

  const handleSaveFlagship = () => {
    setSettingMutation.mutate({ key: "bento.flagship.title", value: flagshipForm.title });
    setSettingMutation.mutate({ key: "bento.flagship.description", value: flagshipForm.description });
    setSettingMutation.mutate({ key: "bento.flagship.imageUrl", value: flagshipForm.imageUrl });
    setSettingMutation.mutate({ key: "bento.flagship.link", value: flagshipForm.link });
    setSettingMutation.mutate({ key: "bento.flagship.ctaLabel", value: flagshipForm.ctaLabel });
  };

  const handleResetFlagship = () => {
    setFlagshipForm({ title: "", description: "", imageUrl: "", link: "", ctaLabel: "" });
    setSettingMutation.mutate({ key: "bento.flagship.title", value: "" });
    setSettingMutation.mutate({ key: "bento.flagship.description", value: "" });
    setSettingMutation.mutate({ key: "bento.flagship.imageUrl", value: "" });
    setSettingMutation.mutate({ key: "bento.flagship.link", value: "" });
    setSettingMutation.mutate({ key: "bento.flagship.ctaLabel", value: "" });
    toast.info("Tuile 1 réinitialisée au mode automatique");
  };

  const handleSaveVerse = () => {
    setSettingMutation.mutate({ key: "bento.verse.reference", value: verseForm.reference });
    setSettingMutation.mutate({ key: "bento.verse.text", value: verseForm.text });
    setSettingMutation.mutate({ key: "bento.verse.audioTitle", value: verseForm.audioTitle });
    setSettingMutation.mutate({ key: "bento.verse.audioUrl", value: verseForm.audioUrl });
  };

  const handleResetVerse = () => {
    setVerseForm({ reference: "", text: "", audioTitle: "", audioUrl: "" });
    setSettingMutation.mutate({ key: "bento.verse.reference", value: "" });
    setSettingMutation.mutate({ key: "bento.verse.text", value: "" });
    setSettingMutation.mutate({ key: "bento.verse.audioTitle", value: "" });
    setSettingMutation.mutate({ key: "bento.verse.audioUrl", value: "" });
    toast.info("Tuile 2 réinitialisée au verset du jour automatique");
  };

  const handleSaveRadar = () => {
    setSettingMutation.mutate({ key: "bento.radar.forceLive", value: radarForm.forceLive });
    setSettingMutation.mutate({ key: "bento.radar.day", value: radarForm.day });
    setSettingMutation.mutate({ key: "bento.radar.hour", value: radarForm.hour });
    setSettingMutation.mutate({ key: "bento.radar.label", value: radarForm.label });
    setSettingMutation.mutate({ key: "bento.radar.link", value: radarForm.link });
  };

  const handleSaveEvent = () => {
    setSettingMutation.mutate({ key: "bento.event.badge", value: eventForm.badge });
    setSettingMutation.mutate({ key: "bento.event.title", value: eventForm.title });
    setSettingMutation.mutate({ key: "bento.event.date", value: eventForm.date });
    setSettingMutation.mutate({ key: "bento.event.imageUrl", value: eventForm.imageUrl });
    setSettingMutation.mutate({ key: "bento.event.link", value: eventForm.link });
  };

  const handleResetEvent = () => {
    setEventForm({ badge: "", title: "", date: "", imageUrl: "", link: "" });
    setSettingMutation.mutate({ key: "bento.event.badge", value: "" });
    setSettingMutation.mutate({ key: "bento.event.title", value: "" });
    setSettingMutation.mutate({ key: "bento.event.date", value: "" });
    setSettingMutation.mutate({ key: "bento.event.imageUrl", value: "" });
    setSettingMutation.mutate({ key: "bento.event.link", value: "" });
    toast.info("Tuile 4 réinitialisée aux événements récents automatiques");
  };

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <div className="bg-primary/5 border-b border-border/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            Mode Éditeur : Bento Grid & Lecteur Audio
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personnalisez chacune des tuiles de la Bento Grid ou laissez le mode automatique opérer.
          </p>
        </div>

        {/* Interrupteurs principaux */}
        <div className="flex flex-wrap items-center gap-4 bg-background/80 px-3 py-2 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <Switch
              id="toggle-bento"
              checked={bentoEnabled}
              onCheckedChange={handleToggleBento}
            />
            <Label htmlFor="toggle-bento" className="text-xs font-medium cursor-pointer">
              Bento Grid
            </Label>
          </div>

          <div className="w-px h-4 bg-border" />

          <div className="flex items-center gap-2">
            <Switch
              id="toggle-audio"
              checked={audioEnabled}
              onCheckedChange={handleToggleAudio}
            />
            <Label htmlFor="toggle-audio" className="text-xs font-medium cursor-pointer flex items-center gap-1">
              <Music className="w-3.5 h-3.5 text-primary" />
              Lecteur Audio
            </Label>
          </div>
        </div>
      </div>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Onglets de personnalisation des Tuiles */}
        <Tabs defaultValue="tuile1" className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1 bg-muted/40 rounded-xl mb-4">
            <TabsTrigger value="tuile1" className="text-xs py-2 gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Tuile 1 · Flagship
            </TabsTrigger>
            <TabsTrigger value="tuile2" className="text-xs py-2 gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              Tuile 2 · Verset
            </TabsTrigger>
            <TabsTrigger value="tuile3" className="text-xs py-2 gap-1.5">
              <Radio className="w-3.5 h-3.5 text-red-500" />
              Tuile 3 · Radar
            </TabsTrigger>
            <TabsTrigger value="tuile4" className="text-xs py-2 gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Tuile 4 · Flash
            </TabsTrigger>
          </TabsList>

          {/* ─── ONGLET 1 : TUILE FLAGSHIP ─── */}
          <TabsContent value="tuile1" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Tuile 1 : Flagship (À la une)</h3>
                <p className="text-xs text-muted-foreground">Grande tuile 2x2. Par défaut : dernier culte / publication phare.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleResetFlagship} className="text-xs text-muted-foreground">
                Réinitialiser (mode auto)
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/40">
              <div className="space-y-1.5">
                <Label className="text-xs">Titre à la une</Label>
                <Input
                  placeholder="Ex: G12 Paris — Culte en Ligne"
                  value={flagshipForm.title}
                  onChange={e => setFlagshipForm({ ...flagshipForm, title: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Libellé du bouton (CTA)</Label>
                <Input
                  placeholder="Ex: Participer au culte"
                  value={flagshipForm.ctaLabel}
                  onChange={e => setFlagshipForm({ ...flagshipForm, ctaLabel: e.target.value })}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Description</Label>
                <Textarea
                  rows={2}
                  placeholder="Ex: Vivez des temps de louange passionnés et d'édification spirituelle..."
                  value={flagshipForm.description}
                  onChange={e => setFlagshipForm({ ...flagshipForm, description: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Lien de destination</Label>
                <Input
                  placeholder="Ex: /culte-en-ligne ou /publication-du-jour"
                  value={flagshipForm.link}
                  onChange={e => setFlagshipForm({ ...flagshipForm, link: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Image de fond Flagship</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://..."
                    value={flagshipForm.imageUrl}
                    onChange={e => setFlagshipForm({ ...flagshipForm, imageUrl: e.target.value })}
                  />
                  <label className="relative cursor-pointer shrink-0">
                    <Button type="button" variant="outline" size="sm" className="gap-1.5 h-9" disabled={isUploading} asChild>
                      <span>
                        {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        Upload
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const res = await uploadFile({ file, folder: "bento" });
                          setFlagshipForm(p => ({ ...p, imageUrl: res.url }));
                          toast.success("Image uploadée");
                        } catch { toast.error("Échec upload"); }
                      }}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end">
                <Button size="sm" onClick={handleSaveFlagship} disabled={setSettingMutation.isPending} className="gap-1.5">
                  <Save className="w-4 h-4" />
                  Enregistrer Tuile 1
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ─── ONGLET 2 : TUILE VERSET & AUDIO ─── */}
          <TabsContent value="tuile2" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Tuile 2 : Verset du Jour & Audio</h3>
                <p className="text-xs text-muted-foreground">Citation biblique et méditation audio connectée au player flottant.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleResetVerse} className="text-xs text-muted-foreground">
                Réinitialiser (mode auto)
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/40">
              <div className="space-y-1.5">
                <Label className="text-xs">Référence biblique</Label>
                <Input
                  placeholder="Ex: Jean 14:27 (vide = verset du jour auto)"
                  value={verseForm.reference}
                  onChange={e => setVerseForm({ ...verseForm, reference: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Titre de la méditation audio</Label>
                <Input
                  placeholder="Ex: Méditation : La Paix du Cœur"
                  value={verseForm.audioTitle}
                  onChange={e => setVerseForm({ ...verseForm, audioTitle: e.target.value })}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Texte du verset ou parole inspirée</Label>
                <Textarea
                  rows={3}
                  placeholder="Ex: Je vous laisse la paix, je vous donne ma paix. Que votre cœur ne se trouble point... (laisser vide pour texte auto)"
                  value={verseForm.text}
                  onChange={e => setVerseForm({ ...verseForm, text: e.target.value })}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Fichier audio de la méditation (MP3/WAV/OGG)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://...fichier.mp3 (vide = piste par défaut)"
                    value={verseForm.audioUrl}
                    onChange={e => setVerseForm({ ...verseForm, audioUrl: e.target.value })}
                  />
                  <label className="relative cursor-pointer shrink-0">
                    <Button type="button" variant="outline" size="sm" className="gap-1.5 h-9" disabled={isUploading} asChild>
                      <span>
                        {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        Upload Audio
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="audio/*"
                      className="sr-only"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const res = await uploadFile({ file, folder: "audio" });
                          setVerseForm(p => ({ ...p, audioUrl: res.url, audioTitle: p.audioTitle || file.name.replace(/\.[^.]+$/, "") }));
                          toast.success("Fichier audio uploadé");
                        } catch { toast.error("Échec upload audio"); }
                      }}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end">
                <Button size="sm" onClick={handleSaveVerse} disabled={setSettingMutation.isPending} className="gap-1.5">
                  <Save className="w-4 h-4" />
                  Enregistrer Tuile 2
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ─── ONGLET 3 : TUILE RADAR DIRECT ─── */}
          <TabsContent value="tuile3" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Tuile 3 : Radar Culte en Direct</h3>
                <p className="text-xs text-muted-foreground">Gestion du compte à rebours et du badge En Direct.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/40">
              <div className="space-y-1.5">
                <Label className="text-xs">État de diffusion du culte</Label>
                <Select
                  value={radarForm.forceLive}
                  onValueChange={v => setRadarForm({ ...radarForm, forceLive: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Mode de détection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automatique (Dimanche matin 10h00)</SelectItem>
                    <SelectItem value="true">🔴 Forcer "EN DIRECT MAINTENANT"</SelectItem>
                    <SelectItem value="false">⚪ Forcer "Prochain Direct" (Compte à rebours)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Jour de la réunion</Label>
                <Select
                  value={radarForm.day}
                  onValueChange={v => setRadarForm({ ...radarForm, day: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Jour" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Dimanche</SelectItem>
                    <SelectItem value="2">Mardi</SelectItem>
                    <SelectItem value="3">Mercredi</SelectItem>
                    <SelectItem value="4">Jeudi</SelectItem>
                    <SelectItem value="5">Vendredi</SelectItem>
                    <SelectItem value="6">Samedi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Heure de début (format 24h)</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={radarForm.hour}
                  onChange={e => setRadarForm({ ...radarForm, hour: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Lien du direct</Label>
                <Input
                  placeholder="/culte-en-ligne"
                  value={radarForm.link}
                  onChange={e => setRadarForm({ ...radarForm, link: e.target.value })}
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <Button size="sm" onClick={handleSaveRadar} disabled={setSettingMutation.isPending} className="gap-1.5">
                  <Save className="w-4 h-4" />
                  Enregistrer Tuile 3
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ─── ONGLET 4 : TUILE ÉVÉNEMENT FLASH ─── */}
          <TabsContent value="tuile4" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Tuile 4 : Événement Flash & Convention</h3>
                <p className="text-xs text-muted-foreground">Mise en avant d'un séminaire, de la Convention ou d'un événement prioritaire.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleResetEvent} className="text-xs text-muted-foreground">
                Réinitialiser (mode auto)
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/40">
              <div className="space-y-1.5">
                <Label className="text-xs">Badge supérieur</Label>
                <Input
                  placeholder="Ex: Inscriptions ouvertes, J-15..."
                  value={eventForm.badge}
                  onChange={e => setEventForm({ ...eventForm, badge: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Titre de l'événement</Label>
                <Input
                  placeholder="Ex: Convention G12 France 2026"
                  value={eventForm.title}
                  onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Date / Période</Label>
                <Input
                  placeholder="Ex: 24-26 Octobre 2026"
                  value={eventForm.date}
                  onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Lien d'inscription ou d'information</Label>
                <Input
                  placeholder="Ex: /convention-g12-france"
                  value={eventForm.link}
                  onChange={e => setEventForm({ ...eventForm, link: e.target.value })}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Affiche / Image de l'événement</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://..."
                    value={eventForm.imageUrl}
                    onChange={e => setEventForm({ ...eventForm, imageUrl: e.target.value })}
                  />
                  <label className="relative cursor-pointer shrink-0">
                    <Button type="button" variant="outline" size="sm" className="gap-1.5 h-9" disabled={isUploading} asChild>
                      <span>
                        {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        Upload
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const res = await uploadFile({ file, folder: "announcements" });
                          setEventForm(p => ({ ...p, imageUrl: res.url }));
                          toast.success("Affiche uploadée");
                        } catch { toast.error("Échec upload"); }
                      }}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end">
                <Button size="sm" onClick={handleSaveEvent} disabled={setSettingMutation.isPending} className="gap-1.5">
                  <Save className="w-4 h-4" />
                  Enregistrer Tuile 4
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Aperçu en temps réel */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Aperçu des 5 Tuiles de la Bento Grid
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-card border border-border/60 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-primary block">Tuile 1 · Flagship</span>
              <p className="text-xs font-medium truncate text-foreground mt-1">
                {flagshipForm.title || "Culte & Célébration"}
              </p>
              <span className="text-[10px] text-muted-foreground">Format 2x2 immersif</span>
            </div>

            <div className="bg-card border border-border/60 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-primary block">Tuile 2 · Verset & Audio</span>
              <p className="text-xs font-medium truncate text-foreground mt-1">
                {verseForm.reference || "Verset du Jour"}
              </p>
              <span className="text-[10px] text-muted-foreground">Copie & Lecture audio</span>
            </div>

            <div className="bg-card border border-border/60 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-primary block">Tuile 3 · Radar Direct</span>
              <p className="text-xs font-medium truncate text-foreground mt-1">
                {radarForm.forceLive === "true" ? "🔴 En direct" : `${radarForm.hour}h00`}
              </p>
              <span className="text-[10px] text-muted-foreground">Compte à rebours</span>
            </div>

            <div className="bg-card border border-border/60 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-primary block">Tuile 4 · Événement</span>
              <p className="text-xs font-medium truncate text-foreground mt-1">
                {eventForm.title || "Convention G12"}
              </p>
              <span className="text-[10px] text-muted-foreground">Inscriptions & Flash</span>
            </div>

            <div className="bg-card border border-border/60 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-primary block">Tuile 5 · Assistant IA</span>
              <p className="text-xs font-medium truncate text-foreground mt-1">Questions spirituelles</p>
              <span className="text-[10px] text-muted-foreground">Déclencheur Ask G12</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


