import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Gift
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

const MOCK_CONTENTS = [
  { id: 1, title: "Bible d'Étude Vie Nouvelle", type: "Livre", theme: "Étude", status: "Publié", date: "24/04/2026" },
  { id: 2, title: "Le Leadership Spirituel", type: "PDF", theme: "Leadership", status: "Brouillon", date: "23/04/2026" },
  { id: 3, title: "Introduction aux Psaumes", type: "Vidéo", theme: "Prière", status: "Publié", date: "20/04/2026" },
  { id: 4, title: "Fondements de la Foi", type: "Article", theme: "Foi", status: "Archivé", date: "15/04/2026" },
];

export default function AdminBibliotheque() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTheme, setSelectedTheme] = useState<string>("all");

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
      toast.success("Textes de la page Offres enregistrés avec succès.");
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement des paramètres.");
    }
  };

  const saveBiblioSettings = async () => {
    try {
      await Promise.all([
        setSetting.mutateAsync({ key: "page.bibliotheque.themesTitle", value: biblioThemesTitle }),
        setSetting.mutateAsync({ key: "page.bibliotheque.themesDesc", value: biblioThemesDesc }),
        setSetting.mutateAsync({ key: "page.bibliotheque.themesBtn", value: biblioThemesBtn }),
      ]);
      toast.success("Textes de la page Bibliothèque enregistrés avec succès.");
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement des paramètres.");
    }
  };

  const [newsletterSubject, setNewsletterSubject] = useState("Actualités G12 Paris");
  
  const utils = trpc.useUtils();
  const { uploadFile, isUploading } = useBlobUpload();

  // Data fetching
  const { data: articlesData, isLoading } = trpc.articles.adminList.useQuery();
  const { data: galleryData, isLoading: isLoadingMedias } = trpc.gallery.list.useQuery();
  const { data: subscribers, isLoading: isLoadingSubs } = trpc.newsletter.listSubscribers.useQuery();
  const { data: categoriesData } = trpc.bibliotheque.listCategories.useQuery();
  const { data: themesData } = trpc.bibliotheque.listThemes.useQuery();

  // Mutations
  const deleteMutation = trpc.articles.delete.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      toast.success("Contenu supprimé");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMediaMutation = trpc.gallery.delete.useMutation({
    onSuccess: () => {
      utils.gallery.list.invalidate();
      toast.success("Média supprimé");
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
      toast.success(`Newsletter envoyée à ${res.count} abonnés`);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteSubscriberMutation = trpc.newsletter.deleteSubscriber.useMutation({
    onSuccess: () => {
      utils.newsletter.listSubscribers.invalidate();
      toast.success("Abonné supprimé");
    },
    onError: (err) => toast.error(err.message),
  });

  const createCategoryMutation = trpc.bibliotheque.createCategory.useMutation({
    onSuccess: () => {
      utils.bibliotheque.listCategories.invalidate();
      toast.success("Catégorie créée");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteCategoryMutation = trpc.bibliotheque.deleteCategory.useMutation({
    onSuccess: () => {
      utils.bibliotheque.listCategories.invalidate();
      toast.success("Catégorie supprimée");
    },
    onError: (err) => toast.error(err.message),
  });

  const createThemeMutation = trpc.bibliotheque.createTheme.useMutation({
    onSuccess: () => {
      utils.bibliotheque.listThemes.invalidate();
      toast.success("Thème créé");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteThemeMutation = trpc.bibliotheque.deleteTheme.useMutation({
    onSuccess: () => {
      utils.bibliotheque.listThemes.invalidate();
      toast.success("Thème supprimé");
    },
    onError: (err) => toast.error(err.message),
  });

  const libraryItems = articlesData?.items.filter(a => a.category.startsWith("bibliothèque")) || [];
  
  const types = categoriesData?.map(c => c.name) || [];
  const themes = themesData?.map(t => t.name) || [];

  const filteredItems = libraryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const itemType = item.category.split(":")[1];
    const itemTheme = item.category.split(":")[2];
    const matchesType = selectedType === "all" || itemType === selectedType;
    const matchesTheme = selectedTheme === "all" || itemTheme === selectedTheme;
    return matchesSearch && matchesType && matchesTheme;
  });

  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer ce contenu ?")) {
      await deleteMutation.mutateAsync({ id });
    }
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
      toast.success("Fichier importé");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Library className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">
                  Administration
                </span>
              </div>
              <h1 className="text-2xl font-bold font-serif">Gestion Bibliothèque</h1>
            </div>
          </div>
          <Button asChild>
            <Link href="/admin/bibliotheque/edition/new">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Contenu
            </Link>
          </Button>
        </div>
      </div>

      <div className="container py-8">
        <Tabs defaultValue="contenus" className="space-y-6">
          <TabsList className="bg-card border p-1 rounded-xl shadow-sm h-auto flex-wrap justify-start gap-2">
            <TabsTrigger value="contenus" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <FileText className="w-4 h-4" />
              Contenus
            </TabsTrigger>
            <TabsTrigger value="medias" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <ImageIcon className="w-4 h-4" />
              Médias
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <FolderTree className="w-4 h-4" />
              Catégories & Thèmes
            </TabsTrigger>
            <TabsTrigger value="offres" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Gift className="w-4 h-4" />
              Offres & Packs
            </TabsTrigger>
            <TabsTrigger value="newsletter" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Mail className="w-4 h-4" />
              Newsletter
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: CONTENUS */}
          <TabsContent value="contenus" className="space-y-6 m-0">
            <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher un titre, un auteur..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {types.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Thème" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les thèmes</SelectItem>
                    {themes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => { setSearchQuery(""); setSelectedType("all"); setSelectedTheme("all"); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                    <tr>
                      <th className="px-6 py-4">Titre du contenu</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Thème</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                          Chargement des contenus...
                        </td>
                      </tr>
                    ) : filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                          Aucun contenu trouvé.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const isLibrary = item.category.startsWith("bibliothèque:");
                        const type = isLibrary ? item.category.split(":")[1] : "Article";
                        const theme = isLibrary ? item.category.split(":")[2] : "Général";
                        
                        return (
                          <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
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
                              <Badge 
                                className={
                                  item.published ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : 
                                  'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                                }
                                variant="secondary"
                              >
                                {item.published ? 'Publié' : 'Brouillon'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                              {format(new Date(item.createdAt), 'dd/MM/yyyy', { locale: fr })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/bibliotheque/edition/${item.id}`} className="flex items-center cursor-pointer">
                                      <Pencil className="w-4 h-4 mr-2" /> Éditer
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/bibliotheque/livre/${item.id}`} className="flex items-center cursor-pointer">
                                      <Eye className="w-4 h-4 mr-2" /> Aperçu
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600 flex items-center cursor-pointer"
                                    onClick={() => handleDelete(item.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: MEDIAS */}
          <TabsContent value="medias" className="m-0 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold">Gestionnaire de Médias</h2>
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
                    Importer des fichiers
                  </label>
                </Button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="md:col-span-1 space-y-4">
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Dossiers</h3>
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
                      <Input placeholder="Rechercher un média par nom ou tag..." className="pl-9" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {isLoadingMedias ? (
                      <div className="col-span-full py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary opacity-20" />
                      </div>
                    ) : (galleryData?.items || []).length === 0 ? (
                      <div className="col-span-full py-12 text-center text-muted-foreground">
                        Aucun média trouvé.
                      </div>
                    ) : (
                      galleryData?.items.map((media) => (
                        <div key={media.id} className="group relative aspect-square bg-muted rounded-xl border overflow-hidden hover:border-primary transition-colors">
                          {media.type === 'image' ? (
                            <img src={media.mediaUrl} alt={media.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
                              <Video size={32} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => window.open(media.mediaUrl, '_blank')}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="destructive" 
                              className="h-8 w-8 rounded-full"
                              onClick={() => {
                                if (confirm("Supprimer ce média ?")) deleteMediaMutation.mutate({ id: media.id });
                              }}
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
              <h2 className="text-2xl font-serif font-bold">Catégories & Thèmes</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    const name = prompt("Nom du nouveau thème :");
                    if (name) createThemeMutation.mutate({ name });
                  }}
                >
                  <Plus className="w-4 h-4" /> Nouveau Thème
                </Button>
                <Button 
                  className="gap-2"
                  onClick={() => {
                    const name = prompt("Nom de la nouvelle catégorie :");
                    if (name) createCategoryMutation.mutate({ name });
                  }}
                >
                  <Plus className="w-4 h-4" /> Nouvelle Catégorie
                </Button>
              </div>
            </div>

            <div className="bg-card border rounded-xl p-6 shadow-sm mb-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Textes de la page Bibliothèque (Thématiques)
                </h3>
                <Button onClick={saveBiblioSettings} disabled={setSetting.isPending} size="sm">
                  {setSetting.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Enregistrer les textes
                </Button>
              </div>

              <div className="space-y-4 max-w-3xl">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Titre de la section Thématiques</label>
                  <Input value={biblioThemesTitle} onChange={e => setBiblioThemesTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea value={biblioThemesDesc} onChange={e => setBiblioThemesDesc(e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Texte du bouton</label>
                  <Input value={biblioThemesBtn} onChange={e => setBiblioThemesBtn(e.target.value)} />
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-primary" /> Types de Ressources
                </h3>
                <div className="space-y-3">
                  {types.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors bg-muted/20">
                      <span className="font-medium capitalize">{cat}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedType(cat)}>
                          <Filter className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            const catObj = categoriesData?.find(c => c.name === cat);
                            if (catObj && confirm("Supprimer cette catégorie ?")) {
                              deleteCategoryMutation.mutate({ id: catObj.id });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {types.length === 0 && <p className="text-sm text-muted-foreground italic">Aucune catégorie détectée.</p>}
                </div>
              </div>
              
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-amber-500" /> Thèmes Spirituels
                </h3>
                <div className="space-y-3">
                  {themes.map((theme, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors bg-muted/20">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-primary`}></div>
                        <span className="font-medium capitalize">{theme}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedTheme(theme)}>
                          <Filter className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            const themeObj = themesData?.find(t => t.name === theme);
                            if (themeObj && confirm("Supprimer ce thème ?")) {
                              deleteThemeMutation.mutate({ id: themeObj.id });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {themes.length === 0 && <p className="text-sm text-muted-foreground italic">Aucun thème détecté.</p>}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: OFFRES */}
          <TabsContent value="offres" className="space-y-6 m-0">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold">Gestion des Offres & Packs</h2>
              <Button asChild>
                <Link href="/admin/bibliotheque/edition/new?type=offre">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Offre
                </Link>
              </Button>
            </div>

            <div className="bg-card border rounded-xl p-6 shadow-sm mb-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Textes de la page
                </h3>
                <Button onClick={saveOffresSettings} disabled={setSetting.isPending} size="sm">
                  {setSetting.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Enregistrer les textes
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase">En-tête de la page</h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Badge (Petit texte en haut)</label>
                    <Input value={offresBadge} onChange={e => setOffresBadge(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Titre Principal</label>
                    <Input value={offresTitle} onChange={e => setOffresTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea value={offresDesc} onChange={e => setOffresDesc(e.target.value)} rows={3} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase">Section "Commandes Groupées"</h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Titre de la section</label>
                    <Input value={offresBulkTitle} onChange={e => setOffresBulkTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea value={offresBulkDesc} onChange={e => setOffresBulkDesc(e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Texte du bouton "Devis"</label>
                    <Input value={offresBulkBtn} onChange={e => setOffresBulkBtn(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <h3 className="font-bold text-xl mt-8 mb-4">Liste des Packs</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

              {articlesData?.items.filter(a => a.category === "bibliothèque:offre").map(offre => {
                const meta = (() => { try { return JSON.parse(offre.meta || "{}"); } catch { return {}; } })();
                const isPopular = meta.popular || false;
                const price = (offre.price || 0) / 100;
                
                return (
                  <div key={offre.id} className="bg-card border rounded-xl p-6 shadow-sm relative">
                    {isPopular && (
                      <Badge className="absolute top-4 right-4">Populaire</Badge>
                    )}
                    <h3 className="font-bold text-lg mb-2">{offre.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{offre.excerpt}</p>
                    <p className="font-bold text-primary text-xl mb-4">{price.toFixed(2)} €</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/admin/bibliotheque/edition/${offre.id}`}>
                          <Pencil className="w-4 h-4 mr-2" /> Modifier
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon" className="text-destructive" onClick={() => handleDelete(offre.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {articlesData?.items.filter(a => a.category === "bibliothèque:offre").length === 0 && (
                <div className="col-span-full py-12 text-center border rounded-xl border-dashed">
                  <p className="text-muted-foreground">Aucune offre configurée.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 5: NEWSLETTER */}
          <TabsContent value="newsletter" className="m-0 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold">Éditeur de Newsletter</h2>
              <Button 
                className="gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => sendDigestMutation.mutate()}
                disabled={sendDigestMutation.isPending || !subscribers?.length}
              >
                <Mail className="w-4 h-4" /> 
                {sendDigestMutation.isPending ? "Envoi..." : "Envoyer la campagne"}
              </Button>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Objet de l'email</label>
                    <Input 
                      placeholder="Découvrez nos nouveautés de la semaine..." 
                      value={newsletterSubject}
                      onChange={(e) => setNewsletterSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Abonnés ({subscribers?.length || 0})</label>
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
                            <TableRow><TableCell colSpan={3} className="text-center py-4">Chargement...</TableCell></TableRow>
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
                                    if(confirm("Supprimer l'abonné ?")) 
                                      deleteSubscriberMutation.mutate({ id: sub.id });
                                  }}
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
                    <label className="text-sm font-medium mb-1 block">Contenu de la newsletter</label>
                    <div className="border rounded-xl p-4 bg-muted/10 text-sm text-muted-foreground">
                      <p>La newsletter automatique inclut les 3 derniers articles publiés de la bibliothèque.</p>
                      <p className="mt-2">L'envoi est géré par Resend si configuré.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold mb-4">Statistiques</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">Abonnés actifs</span>
                      <span className="font-bold text-lg text-primary">1,248</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">Taux d'ouverture moy.</span>
                      <span className="font-bold text-lg text-green-500">42%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold mb-4">Derniers envois</h3>
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
