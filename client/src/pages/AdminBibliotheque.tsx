import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Library, 
  Plus, 
  Search, 
  Filter, 
  Image as ImageIcon, 
  FolderTree, 
  Palette, 
  Mail, 
  ArrowLeft,
  Settings,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  FileText,
  Video,
  Music,
  Download,
  Loader2,
  Gift,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useBlobUpload } from "@/hooks/useBlobUpload";
import { useTranslation } from "react-i18next";

const MOCK_CONTENTS = [
  { id: 1, title: "Bible d'Étude Vie Nouvelle", type: "Livre", theme: "Étude", status: "Publié", date: "24/04/2026" },
  { id: 2, title: "Le Leadership Spirituel", type: "PDF", theme: "Leadership", status: "Brouillon", date: "23/04/2026" },
  { id: 3, title: "Introduction aux Psaumes", type: "Vidéo", theme: "Prière", status: "Publié", date: "20/04/2026" },
  { id: 4, title: "Fondements de la Foi", type: "Article", theme: "Foi", status: "Archivé", date: "15/04/2026" },
];

export default function AdminBibliotheque() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTheme, setSelectedTheme] = useState<string>("all");
  const [sortField, setSortField] = useState<"createdAt" | "title" | "price">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const setSetting = trpc.siteSettings.set.useMutation();

  const [offresBadge, setOffresBadge] = useState("Bons Plans & Idées Cadeaux");
  const [offresTitle, setOffresTitle] = useState("Offres & Packs Exclusifs");
  const [offresDesc, setOffresDesc] = useState("Économisez jusqu'à 25% en choisissant nos packs thématiques. Idéals pour s'équiper, étudier ou pour offrir un cadeau spirituel qui a du sens.");
  const [offresBulkTitle, setOffresBulkTitle] = useState("Commandes Groupées & Églises");
  const [offresBulkDesc, setOffresBulkDesc] = useState("Vous êtes responsable d'une église, d'un groupe de jeunes ou vous souhaitez commander en grande quantité ? Profitez de nos tarifs préférentiels.");
  const [offresBulkBtn, setOffresBulkBtn] = useState("Demander un devis personnalisé");

  const [biblioThemesTitle, setBiblioThemesTitle] = useState("Explorez par Thématiques");
  const [biblioThemesDesc, setBiblioThemesDesc] = useState("Foi, Leadership, Famille, Prophétie... Trouvez les ressources qui correspondent exactement à votre besoin spirituel du moment.");
  const [biblioThemesBtn, setBiblioThemesBtn] = useState("Parcourir les thèmes");
  const [biblioThemesLogo, setBiblioThemesLogo] = useState("/logo-g12-editions.png");

  useEffect(() => {
    if (settingsQuery.data) {
      if (settingsQuery.data["page.offres.badge"]) setOffresBadge(settingsQuery.data["page.offres.badge"] as string);
      if (settingsQuery.data["page.offres.title"]) setOffresTitle(settingsQuery.data["page.offres.title"] as string);
      if (settingsQuery.data["page.offres.desc"]) setOffresDesc(settingsQuery.data["page.offres.desc"] as string);
      if (settingsQuery.data["page.offres.bulkTitle"]) setOffresBulkTitle(settingsQuery.data["page.offres.bulkTitle"] as string);
      if (settingsQuery.data["page.offres.bulkDesc"]) setOffresBulkDesc(settingsQuery.data["page.offres.bulkDesc"] as string);
      if (settingsQuery.data["page.offres.bulkBtn"]) setOffresBulkBtn(settingsQuery.data["page.offres.bulkBtn"] as string);
      
      if (settingsQuery.data["page.bibliotheque.themesTitle"]) setBiblioThemesTitle(settingsQuery.data["page.bibliotheque.themesTitle"] as string);
      if (settingsQuery.data["page.bibliotheque.themesDesc"]) setBiblioThemesDesc(settingsQuery.data["page.bibliotheque.themesDesc"] as string);
      if (settingsQuery.data["page.bibliotheque.themesBtn"]) setBiblioThemesBtn(settingsQuery.data["page.bibliotheque.themesBtn"] as string);
      if (settingsQuery.data["page.bibliotheque.themesLogo"] !== undefined) setBiblioThemesLogo(settingsQuery.data["page.bibliotheque.themesLogo"] as string);
    }
  }, [settingsQuery.data]);

  const saveOffresSettings = async () => {
    try {
      await Promise.all([
        setSetting.mutateAsync({ key: "page.offres.badge", value: offresBadge }),
        setSetting.mutateAsync({ key: "page.offres.title", value: offresTitle }),
        setSetting.mutateAsync({ key: "page.offres.desc", value: offresDesc }),
        setSetting.mutateAsync({ key: "page.offres.bulkTitle", value: offresBulkTitle }),
        setSetting.mutateAsync({ key: "page.offres.bulkDesc", value: offresBulkDesc }),
        setSetting.mutateAsync({ key: "page.offres.bulkBtn", value: offresBulkBtn }),
      ]);
      toast.success(t('admin.bibliotheque.toastOffersSaved'));
    } catch (e) {
      toast.error(t('admin.bibliotheque.toastSettingsError'));
    }
  };

  const saveBiblioSettings = async () => {
    try {
      await Promise.all([
        setSetting.mutateAsync({ key: "page.bibliotheque.themesTitle", value: biblioThemesTitle }),
        setSetting.mutateAsync({ key: "page.bibliotheque.themesDesc", value: biblioThemesDesc }),
        setSetting.mutateAsync({ key: "page.bibliotheque.themesBtn", value: biblioThemesBtn }),
        setSetting.mutateAsync({ key: "page.bibliotheque.themesLogo", value: biblioThemesLogo }),
      ]);
      toast.success(t('admin.bibliotheque.toastBiblioSaved'));
    } catch (e) {
      toast.error(t('admin.bibliotheque.toastSettingsError'));
    }
  };

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const result = await uploadFile({ file, folder: "gallery" });
      setBiblioThemesLogo(result.url);
      toast.success(t('admin.bibliotheque.toastNewLogo'));
    } catch (err: any) {
      toast.error(t('admin.bibliotheque.toastLogoError') + err.message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const [newsletterSubject, setNewsletterSubject] = useState("Actualités G12 Paris");
  
  const utils = trpc.useUtils();
  const { uploadFile, isUploading } = useBlobUpload();

  // Data fetching
  const { data: articlesData, isLoading } = trpc.articles.adminList.useQuery();
  const { data: galleryData, isLoading: isLoadingMedias } = trpc.gallery.list.useQuery();
  const { data: subscribersData, isLoading: isLoadingSubs } = trpc.newsletter.listSubscribers.useQuery();
  const subscribers = subscribersData?.items;
  const { data: categoriesData } = trpc.bibliotheque.listCategories.useQuery();
  const { data: themesData } = trpc.bibliotheque.listThemes.useQuery();

  // Mutations
  const deleteMutation = trpc.articles.delete.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      toast.success(t('admin.bibliotheque.toastDeleted'));
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      toast.success(t('admin.bibliotheque.toastUpdated'));
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkDeleteMutation = trpc.articles.delete.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      setSelectedItems([]);
      toast.success(t('admin.bibliotheque.toastBulkDeleted', { count: selectedItems.length }));
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkPublishMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      setSelectedItems([]);
      toast.success(t('admin.bibliotheque.toastBulkPublished', { count: selectedItems.length }));
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkUnpublishMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      setSelectedItems([]);
      toast.success(t('admin.bibliotheque.toastBulkUnpublished', { count: selectedItems.length }));
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMediaMutation = trpc.gallery.delete.useMutation({
    onSuccess: () => {
      utils.gallery.list.invalidate();
      toast.success(t('admin.bibliotheque.toastMediaDeleted'));
    },
    onError: (err) => toast.error(err.message),
  });

  const createMediaMutation = trpc.gallery.create.useMutation({
    onSuccess: () => {
      utils.gallery.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const sendDigestMutation = trpc.newsletter.sendDigest.useMutation({
    onSuccess: (res) => {
      toast.success(t('admin.bibliotheque.toastNewsletterSent', { count: res.count }));
    },
    onError: (err) => toast.error(t('admin.bibliotheque.toastNewsletterError') + err.message),
  });

  const deleteSubscriberMutation = trpc.newsletter.deleteSubscriber.useMutation({
    onSuccess: () => {
      utils.newsletter.listSubscribers.invalidate();
      toast.success(t('admin.bibliotheque.toastSubscriberDeleted'));
    },
    onError: (err) => toast.error(err.message),
  });

  const createCategoryMutation = trpc.bibliotheque.createCategory.useMutation({
    onSuccess: () => {
      utils.bibliotheque.listCategories.invalidate();
      toast.success(t('admin.bibliotheque.toastCategoryCreated'));
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteCategoryMutation = trpc.bibliotheque.deleteCategory.useMutation({
    onSuccess: () => {
      utils.bibliotheque.listCategories.invalidate();
      toast.success(t('admin.bibliotheque.toastCategoryDeleted'));
    },
    onError: (err) => toast.error(err.message),
  });

  const createThemeMutation = trpc.bibliotheque.createTheme.useMutation({
    onSuccess: () => {
      utils.bibliotheque.listThemes.invalidate();
      toast.success(t('admin.bibliotheque.toastThemeCreated'));
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteThemeMutation = trpc.bibliotheque.deleteTheme.useMutation({
    onSuccess: () => {
      utils.bibliotheque.listThemes.invalidate();
      toast.success(t('admin.bibliotheque.toastThemeDeleted'));
    },
    onError: (err) => toast.error(err.message),
  });

  const libraryItems = articlesData?.items.filter((a: any) => a.category.startsWith("bibliothèque")) || [];
  
  const types = categoriesData?.map((c: any) => c.name) || [];
  const themes = themesData?.map((t: any) => t.name) || [];

  const filteredItems = useMemo(() => {
    let items = libraryItems.filter((item: any) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const itemType = item.category.split(":")[1];
      const itemTheme = item.category.split(":")[2];
      const matchesType = selectedType === "all" || itemType === selectedType;
      const matchesTheme = selectedTheme === "all" || itemTheme === selectedTheme;
      return matchesSearch && matchesType && matchesTheme;
    });

    items.sort((a: any, b: any) => {
      let aVal: any, bVal: any;
      if (sortField === "title") {
        aVal = a.title?.toLowerCase() || "";
        bVal = b.title?.toLowerCase() || "";
      } else if (sortField === "price") {
        aVal = a.price || 0;
        bVal = b.price || 0;
      } else {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }
      if (sortDirection === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return items;
  }, [libraryItems, searchQuery, selectedType, selectedTheme, sortField, sortDirection]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handleDelete = async (id: number) => {
    if (confirm(t('admin.bibliotheque.confirmDelete'))) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === paginatedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedItems.map((item: any) => item.id));
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (confirm(t('admin.bibliotheque.confirmBulkDelete', { count: selectedItems.length }))) {
      for (const id of selectedItems) {
        await bulkDeleteMutation.mutateAsync({ id });
      }
    }
  };

  const handleBulkPublish = async () => {
    if (selectedItems.length === 0) return;
    for (const id of selectedItems) {
      await bulkPublishMutation.mutateAsync({ id, published: true });
    }
  };

  const handleBulkUnpublish = async () => {
    if (selectedItems.length === 0) return;
    for (const id of selectedItems) {
      await bulkUnpublishMutation.mutateAsync({ id, published: false });
    }
  };

  const handleTogglePublish = async (item: any) => {
    await updateMutation.mutateAsync({ id: item.id, published: !item.published });
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadFile({ file, folder: "gallery" });
      await createMediaMutation.mutateAsync({
        title: file.name,
        type: file.type.startsWith("video") ? "video" : "image",
        mediaUrl: result.url,
        mediaKey: result.key,
      });
      utils.gallery.list.invalidate();
      toast.success(t('admin.bibliotheque.toastFileImported'));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 overflow-y-auto">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")} aria-label="Retour">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Library className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">
                  Administration
                </span>
              </div>
              <h1 className="text-2xl font-bold font-serif">{t('admin.bibliotheque.title')}</h1>
            </div>
          </div>
          <Button asChild className="rounded-xl shadow-lg shadow-primary/20">
            <Link href="/admin/bibliotheque/edition/new">
              <Plus className="w-4 h-4 mr-2" />
              {t('admin.bibliotheque.newContent')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="container py-8">
        <Tabs defaultValue="contenus" className="space-y-6">
          <TabsList className="bg-card border p-1 rounded-xl shadow-sm h-auto flex-wrap justify-start gap-2">
            <TabsTrigger value="contenus" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <FileText className="w-4 h-4" />
              {t('admin.bibliotheque.tabContents')}
            </TabsTrigger>
            <TabsTrigger value="medias" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <ImageIcon className="w-4 h-4" />
              {t('admin.bibliotheque.tabMedias')}
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <FolderTree className="w-4 h-4" />
              {t('admin.bibliotheque.tabCategories')}
            </TabsTrigger>
            <TabsTrigger value="offres" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Gift className="w-4 h-4" />
              {t('admin.bibliotheque.tabOffers')}
            </TabsTrigger>
            <TabsTrigger value="newsletter" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Mail className="w-4 h-4" />
              {t('admin.bibliotheque.tabNewsletter')}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: CONTENUS */}
          <TabsContent value="contenus" className="space-y-6 m-0">
            <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder={t('admin.bibliotheque.searchPlaceholder')} 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto flex-wrap">
                <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder={t('admin.bibliotheque.colType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('admin.bibliotheque.filterAllTypes')}</SelectItem>
                    {types.map((t: string) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selectedTheme} onValueChange={(v) => { setSelectedTheme(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder={t('admin.bibliotheque.colTheme')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('admin.bibliotheque.filterAllThemes')}</SelectItem>
                    {themes.map((t: string) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={sortField} onValueChange={(v: any) => setSortField(v)}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder={t('admin.bibliotheque.sortBy')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">{t('admin.bibliotheque.sortDate')}</SelectItem>
                    <SelectItem value="title">{t('admin.bibliotheque.sortTitle')}</SelectItem>
                    <SelectItem value="price">{t('admin.bibliotheque.sortPrice')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => setSortDirection(d => d === "asc" ? "desc" : "asc")} aria-label="Inverser l'ordre">
                  {sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => { setSearchQuery(""); setSelectedType("all"); setSelectedTheme("all"); setCurrentPage(1); }} aria-label="Réinitialiser les filtres">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {selectedItems.length > 0 && (
              <div className="flex items-center gap-4 bg-primary/10 border border-primary/30 rounded-xl p-4">
                <span className="text-sm font-medium">{t('admin.bibliotheque.selectedCount', { count: selectedItems.length })}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleBulkPublish} disabled={bulkPublishMutation.isPending}>
                    {bulkPublishMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                    {t('admin.bibliotheque.publish')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBulkUnpublish} disabled={bulkUnpublishMutation.isPending}>
                    {bulkUnpublishMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <X className="w-4 h-4 mr-1" />}
                    {t('admin.bibliotheque.unpublish')}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleteMutation.isPending}>
                    {bulkDeleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
                    {t('admin.bibliotheque.delete')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedItems([])}>
                    {t('admin.dialogs.confirmDelete.cancel')}
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                    <tr>
                      <th className="px-4 py-4 w-10">
                        <Checkbox 
                          checked={selectedItems.length > 0 && paginatedItems.length === selectedItems.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-6 py-4">{t('admin.bibliotheque.colTitle')}</th>
                      <th className="px-6 py-4">{t('admin.bibliotheque.colType')}</th>
                      <th className="px-6 py-4">{t('admin.bibliotheque.colTheme')}</th>
                      <th className="px-6 py-4">{t('admin.bibliotheque.colPrice')}</th>
                      <th className="px-6 py-4">{t('admin.bibliotheque.colStatus')}</th>
                      <th className="px-6 py-4">{t('admin.bibliotheque.colDate')}</th>
                      <th className="px-6 py-4 text-right">{t('admin.bibliotheque.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                          {t('admin.bibliotheque.loadingContents')}
                        </td>
                      </tr>
                    ) : paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                          {t('admin.bibliotheque.noContents')}
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map((item: any) => {
                        const isLibrary = item.category.startsWith("bibliothèque:");
                        const type = isLibrary ? item.category.split(":")[1] : "Article";
                        const theme = isLibrary ? item.category.split(":")[2] : "Général";
                        
                        return (
                          <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                            <td className="px-4 py-4">
                              <Checkbox 
                                checked={selectedItems.includes(item.id)}
                                onCheckedChange={() => toggleSelectItem(item.id)}
                              />
                            </td>
                            <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                {type === 'video' ? <Video size={18} /> : 
                                 type === 'pdf' ? <Download size={18} /> : 
                                 <FileText size={18} />}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold">{item.title}</span>
                                {item.excerpt && <span className="text-xs text-muted-foreground line-clamp-1">{item.excerpt}</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 capitalize">
                              <Badge variant="outline">{type}</Badge>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground capitalize">{theme}</td>
                            <td className="px-6 py-4">
                              {item.price ? <span className="font-medium">{(item.price / 100).toFixed(2)}€</span> : <span className="text-muted-foreground">-</span>}
                            </td>
                            <td className="px-6 py-4">
                              <Badge 
                                className={
                                  item.published ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : 
                                  'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                                }
                                variant="secondary"
                              >
                                {item.published ? t('admin.bibliotheque.published') : t('admin.bibliotheque.draft')}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                              {format(new Date(item.createdAt), 'dd/MM/yyyy', { locale: fr })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  title={item.published ? t('admin.bibliotheque.unpublish') : t('admin.bibliotheque.publish')}
                                  aria-label={item.published ? t('admin.bibliotheque.unpublish') : t('admin.bibliotheque.publish')}
                                  onClick={() => handleTogglePublish(item)}
                                >
                                  {item.published ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  title={t('admin.bibliotheque.preview')}
                                  aria-label={t('admin.bibliotheque.preview')}
                                  asChild
                                >
                                  <Link href={`/bibliotheque/livre/${item.id}`} target="_blank">
                                    <ExternalLink className="w-4 h-4" />
                                  </Link>
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link href={`/admin/bibliotheque/edition/${item.id}`} className="flex items-center cursor-pointer">
                                        <Pencil className="w-4 h-4 mr-2" /> {t('admin.bibliotheque.edit')}
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/bibliotheque/livre/${item.id}`} target="_blank" className="flex items-center cursor-pointer">
                                        <Eye className="w-4 h-4 mr-2" /> {t('admin.bibliotheque.preview')}
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-red-600 flex items-center cursor-pointer"
                                      onClick={() => handleDelete(item.id)}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" /> {t('admin.bibliotheque.delete')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {t('admin.bibliotheque.paginationShowing', { from: (currentPage - 1) * itemsPerPage + 1, to: Math.min(currentPage * itemsPerPage, filteredItems.length), total: filteredItems.length })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button 
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: MEDIAS */}
          <TabsContent value="medias" className="m-0 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold">{t('admin.bibliotheque.mediaManager')}</h2>
              <div className="flex gap-2">
                <Input 
                  type="file" 
                  className="hidden" 
                  id="media-upload" 
                  onChange={handleMediaUpload}
                  disabled={isUploading}
                />
                <Button asChild disabled={isUploading}>
                  <label htmlFor="media-upload" className="cursor-pointer">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {t('admin.bibliotheque.importFiles')}
                  </label>
                </Button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="md:col-span-1 space-y-4">
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">{t('admin.bibliotheque.folders')}</h3>
                  <div className="space-y-1">
                    {['Toutes les images', 'Couvertures Livres', 'Miniatures Vidéos', 'PDF & Documents', 'Ressources Jeunesse'].map((folder, i) => (
                      <button key={i} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${i === 0 ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'}`}>
                        {folder}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-3">
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                  <div className="flex gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder={t('admin.bibliotheque.searchMedia')} className="pl-9" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {isLoadingMedias ? (
                      <div className="col-span-full py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary opacity-20" />
                      </div>
                    ) : (galleryData?.items || []).length === 0 ? (
                      <div className="col-span-full py-12 text-center text-muted-foreground">
                        {t('admin.bibliotheque.noMedia')}
                      </div>
                    ) : (
                      galleryData?.items.map((media: any) => (
                        <div key={media.id} className="group relative aspect-square bg-muted rounded-xl border overflow-hidden hover:border-primary transition-colors">
                          {media.type === 'image' ? (
                            <img src={media.mediaUrl} alt={media.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
                              <Video size={32} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => window.open(media.mediaUrl, '_blank')} aria-label="Voir le média">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="destructive" 
                              className="h-8 w-8 rounded-full"
                              onClick={() => {
                                if (confirm(t('admin.bibliotheque.confirmDeleteMedia'))) deleteMediaMutation.mutate({ id: media.id });
                              }}
                              aria-label="Supprimer le média"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-xs truncate">
                            {media.title}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: CATEGORIES */}
          <TabsContent value="categories" className="m-0 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold">{t('admin.bibliotheque.categoriesThemesTitle')}</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    const name = prompt(t('admin.bibliotheque.themeNamePrompt'));
                    if (name) createThemeMutation.mutate({ name });
                  }}
                >
                  <Plus className="w-4 h-4" /> {t('admin.bibliotheque.newTheme')}
                </Button>
                <Button 
                  className="gap-2"
                  onClick={() => {
                    const name = prompt(t('admin.bibliotheque.categoryNamePrompt'));
                    if (name) createCategoryMutation.mutate({ name });
                  }}
                >
                  <Plus className="w-4 h-4" /> {t('admin.bibliotheque.newCategory')}
                </Button>
              </div>
            </div>

            <div className="bg-card border rounded-xl p-6 shadow-sm mb-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> {t('admin.bibliotheque.biblioPageTexts')}
                </h3>
                <Button onClick={saveBiblioSettings} disabled={setSetting.isPending} size="sm" className="rounded-lg shadow-sm">
                  {setSetting.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {t('admin.bibliotheque.saveTexts')}
                </Button>
              </div>

              <div className="space-y-4 max-w-3xl">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('admin.bibliotheque.themesSectionTitle')}</label>
                  <Input value={biblioThemesTitle} onChange={e => setBiblioThemesTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('admin.bibliotheque.sectionDescription')}</label>
                  <Textarea value={biblioThemesDesc} onChange={e => setBiblioThemesDesc(e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('admin.bibliotheque.buttonText')}</label>
                  <Input value={biblioThemesBtn} onChange={e => setBiblioThemesBtn(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('admin.bibliotheque.sectionLogo')}</label>
                  <div className="flex items-center gap-4 p-4 border rounded-xl bg-muted/10">
                    {biblioThemesLogo ? (
                      <div className="relative w-36 h-20 bg-slate-950 border rounded-lg flex items-center justify-center p-2 group overflow-hidden shrink-0">
                        <img 
                          src={biblioThemesLogo} 
                          alt={t('admin.bibliotheque.sectionLogo')} 
                          className="max-w-full max-h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setBiblioThemesLogo("")}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold"
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> {t('admin.bibliotheque.deleteLogo')}
                        </button>
                      </div>
                    ) : (
                      <div className="w-36 h-20 border border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-xs bg-muted/20 shrink-0">
                        {t('admin.bibliotheque.noLogo')}
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          id="logo-section-upload" 
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo}
                        />
                        <Button asChild variant="outline" size="sm" disabled={isUploadingLogo}>
                          <label htmlFor="logo-section-upload" className="cursor-pointer flex items-center gap-2">
                            {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                            {t('admin.bibliotheque.importLogo')}
                          </label>
                        </Button>
                        {biblioThemesLogo && (
                          <Button variant="ghost" size="sm" className="text-destructive h-8" onClick={() => setBiblioThemesLogo("")}>
                            {t('admin.bibliotheque.deleteLogo')}
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{t('admin.bibliotheque.logoFormat')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-primary" /> {t('admin.bibliotheque.resourceTypes')}
                </h3>
                <div className="space-y-3">
                  {types.map((cat: string, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors bg-muted/20">
                      <span className="font-medium capitalize">{cat}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedType(cat)} aria-label={`Filtrer par ${cat}`}>
                          <Filter className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            const catObj = categoriesData?.find((c: any) => c.name === cat);
                            if (catObj && confirm(t('admin.bibliotheque.confirmDeleteCategory'))) {
                              deleteCategoryMutation.mutate({ id: catObj.id });
                            }
                          }}
                          aria-label={`Supprimer la catégorie ${cat}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {types.length === 0 && <p className="text-sm text-muted-foreground italic">{t('admin.bibliotheque.noCategories')}</p>}
                </div>
              </div>
              
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-amber-500" /> {t('admin.bibliotheque.spiritualThemes')}
                </h3>
                <div className="space-y-3">
                  {themes.map((theme: string, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors bg-muted/20">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-primary`}></div>
                        <span className="font-medium capitalize">{theme}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedTheme(theme)} aria-label={`Filtrer par ${theme}`}>
                          <Filter className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            const themeObj = themesData?.find((t: any) => t.name === theme);
                            if (themeObj && confirm(t('admin.bibliotheque.confirmDeleteTheme'))) {
                              deleteThemeMutation.mutate({ id: themeObj.id });
                            }
                          }}
                          aria-label={`Supprimer le thème ${theme}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {themes.length === 0 && <p className="text-sm text-muted-foreground italic">{t('admin.bibliotheque.noThemes')}</p>}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: OFFRES */}
          <TabsContent value="offres" className="space-y-6 m-0">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold">{t('admin.bibliotheque.offersTitle')}</h2>
              <Button asChild>
                <Link href="/admin/bibliotheque/edition/new?type=offre">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('admin.bibliotheque.newOffer')}
                </Link>
              </Button>
            </div>

            <div className="bg-card border rounded-xl p-6 shadow-sm mb-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> {t('admin.bibliotheque.pageTextsTitle')}
                </h3>
                <Button onClick={saveOffresSettings} disabled={setSetting.isPending} size="sm" className="rounded-lg shadow-sm">
                  {setSetting.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {t('admin.bibliotheque.saveTexts')}
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase">{t('admin.bibliotheque.pageHeader')}</h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('admin.bibliotheque.badgeLabel')}</label>
                    <Input value={offresBadge} onChange={e => setOffresBadge(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('admin.bibliotheque.mainTitle')}</label>
                    <Input value={offresTitle} onChange={e => setOffresTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('admin.bibliotheque.offersDesc')}</label>
                    <Textarea value={offresDesc} onChange={e => setOffresDesc(e.target.value)} rows={3} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase">{t('admin.bibliotheque.bulkSection')}</h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('admin.bibliotheque.bulkSectionTitle')}</label>
                    <Input value={offresBulkTitle} onChange={e => setOffresBulkTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('admin.bibliotheque.offersDesc')}</label>
                    <Textarea value={offresBulkDesc} onChange={e => setOffresBulkDesc(e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('admin.bibliotheque.quoteBtnText')}</label>
                    <Input value={offresBulkBtn} onChange={e => setOffresBulkBtn(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <h3 className="font-bold text-xl mt-8 mb-4">{t('admin.bibliotheque.packsList')}</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

              {articlesData?.items.filter((a: any) => a.category.startsWith("bibliothèque:offre")).map((offre: any) => {
                const meta = (() => { try { return JSON.parse(offre.meta || "{}"); } catch { return {}; } })();
                const isPopular = meta.popular || false;
                const price = (offre.price || 0) / 100;
                
                return (
                  <div key={offre.id} className="bg-card border rounded-xl p-6 shadow-sm relative">
                    {isPopular && (
                      <Badge className="absolute top-4 right-4">{t('admin.bibliotheque.popular')}</Badge>
                    )}
                    <h3 className="font-bold text-lg mb-2">{offre.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{offre.excerpt}</p>
                    <p className="font-bold text-primary text-xl mb-4">{price.toFixed(2)} €</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/admin/bibliotheque/edition/${offre.id}`}>
                          <Pencil className="w-4 h-4 mr-2" /> {t('admin.bibliotheque.editOffer')}
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon" className="text-destructive" onClick={() => handleDelete(offre.id)} aria-label="Supprimer l'offre">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {articlesData?.items.filter((a: any) => a.category.startsWith("bibliothèque:offre")).length === 0 && (
                <div className="col-span-full py-12 text-center border rounded-xl border-dashed">
                  <p className="text-muted-foreground">{t('admin.bibliotheque.noOffers')}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 5: NEWSLETTER */}
          <TabsContent value="newsletter" className="m-0 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold">{t('admin.bibliotheque.newsletterEditor')}</h2>
              <Button 
                className="gap-2 bg-primary text-white hover:bg-primary/90 rounded-xl shadow-md px-6"
                onClick={() => sendDigestMutation.mutate({ 
                  category: "bibliothèque", 
                  subject: newsletterSubject 
                })}
                disabled={sendDigestMutation.isPending || !subscribers?.length}
              >
                <Mail className="w-4 h-4" /> 
                {sendDigestMutation.isPending ? t('admin.bibliotheque.sending') : t('admin.bibliotheque.sendCampaign')}
              </Button>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t('admin.bibliotheque.emailSubject')}</label>
                    <Input 
                      placeholder={t('admin.bibliotheque.emailSubjectPlaceholder')} 
                      value={newsletterSubject}
                      onChange={(e) => setNewsletterSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t('admin.bibliotheque.subscribers')} ({subscribers?.length || 0})</label>
                    <div className="border rounded-xl max-h-64 overflow-y-auto bg-muted/10 p-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoadingSubs ? (
                            <TableRow><TableCell colSpan={3} className="text-center py-4">{t('admin.loading')}</TableCell></TableRow>
                          ) : subscribers?.map((sub: any) => (
                            <TableRow key={sub.id}>
                              <TableCell className="py-2 text-xs">{sub.email}</TableCell>
                              <TableCell className="py-2 text-xs">{sub.name || '-'}</TableCell>
                              <TableCell className="py-2 text-right">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => {
                                    if(confirm(t('admin.bibliotheque.confirmDeleteSubscriber'))) 
                                      deleteSubscriberMutation.mutate({ id: sub.id });
                                  }}
                                  aria-label="Supprimer l'abonné"
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t('admin.bibliotheque.newsletterContent')}</label>
                    <div className="border rounded-xl p-4 bg-muted/10 text-sm text-muted-foreground">
                      <p>{t('admin.bibliotheque.newsletterAutoDesc')}</p>
                      <p className="mt-2">{t('admin.bibliotheque.newsletterResendDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold mb-4">{t('admin.bibliotheque.stats')}</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">{t('admin.bibliotheque.activeSubscribers')}</span>
                      <span className="font-bold text-lg text-primary">{subscribers?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">{t('admin.bibliotheque.avgOpenRate')}</span>
                      <span className="font-bold text-lg text-green-500">--%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold mb-4">{t('admin.bibliotheque.recentSends')}</h3>
                  <div className="space-y-3">
                    {['Pack Étude Spécial', 'Nouveautés Avril', 'Sélection Pâques'].map((camp, i) => (
                      <div key={i} className="text-sm border-b pb-2 last:border-0 last:pb-0">
                        <p className="font-medium">{camp}</p>
                        <p className="text-xs text-muted-foreground">Envoyé le 1{i}/04/2026 • 68% ouverture</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
