import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  Loader2
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

const MOCK_CONTENTS = [
  { id: 1, title: "Bible d'Étude Vie Nouvelle", type: "Livre", theme: "Étude", status: "Publié", date: "24/04/2026" },
  { id: 2, title: "Le Leadership Spirituel", type: "PDF", theme: "Leadership", status: "Brouillon", date: "23/04/2026" },
  { id: 3, title: "Introduction aux Psaumes", type: "Vidéo", theme: "Prière", status: "Publié", date: "20/04/2026" },
  { id: 4, title: "Fondements de la Foi", type: "Article", theme: "Foi", status: "Archivé", date: "15/04/2026" },
];

export default function AdminBibliotheque() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const utils = trpc.useUtils();

  const { data: articlesData, isLoading } = trpc.articles.adminList.useQuery();
  const deleteMutation = trpc.articles.delete.useMutation({
    onSuccess: () => {
      utils.articles.adminList.invalidate();
      toast.success("Contenu supprimé");
    },
    onError: (err) => toast.error(err.message),
  });

  const libraryItems = articlesData?.items.filter(a => a.category.startsWith("bibliothèque")) || [];
  
  const filteredItems = libraryItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer ce contenu ?")) {
      await deleteMutation.mutateAsync({ id });
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
            <TabsTrigger value="newsletter" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Mail className="w-4 h-4" />
              Newsletter
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: CONTENUS */}
          <TabsContent value="contenus" className="space-y-6 m-0">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher un titre, un auteur..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" className="gap-2 flex-1 sm:flex-none">
                  <Filter className="w-4 h-4" />
                  Filtrer
                </Button>
                <Button variant="outline" className="gap-2 flex-1 sm:flex-none">
                  <Settings className="w-4 h-4" />
                  Options
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
                                  <DropdownMenuItem className="flex items-center cursor-pointer">
                                    <Eye className="w-4 h-4 mr-2" /> Aperçu
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
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Importer des fichiers
              </Button>
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
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="group relative aspect-square bg-muted rounded-xl border overflow-hidden hover:border-primary transition-colors cursor-pointer">
                        <img src={`/premium_bible.png`} alt="Media" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full"><Eye className="w-4 h-4" /></Button>
                          <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-xs truncate">
                          cover_bible_{i}.jpg
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: CATEGORIES */}
          <TabsContent value="categories" className="m-0 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold">Catégories & Thèmes</h2>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Nouvelle Catégorie
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-primary" /> Types de Ressources
                </h3>
                <div className="space-y-3">
                  {['Livres', 'Bibles', 'Commentaires', 'Vidéos', 'PDF Gratuits'].map((cat, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors bg-muted/20">
                      <span className="font-medium">{cat}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-amber-500" /> Thèmes Spirituels
                </h3>
                <div className="space-y-3">
                  {[
                    {name: 'Foi', color: 'bg-blue-500'}, 
                    {name: 'Leadership', color: 'bg-amber-500'}, 
                    {name: 'Famille', color: 'bg-rose-500'}, 
                    {name: 'Prophétie', color: 'bg-purple-500'}
                  ].map((theme, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors bg-muted/20">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${theme.color}`}></div>
                        <span className="font-medium">{theme.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: NEWSLETTER */}
          <TabsContent value="newsletter" className="m-0 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold">Éditeur de Newsletter</h2>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Mail className="w-4 h-4" /> Envoyer la campagne
              </Button>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Objet de l'email</label>
                    <Input placeholder="Découvrez nos nouveautés de la semaine..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Bannière principale</label>
                    <div className="border-2 border-dashed rounded-xl p-8 text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Cliquez pour ajouter une image d'en-tête</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Contenu de la newsletter</label>
                    <div className="border rounded-xl h-64 bg-muted/10 p-4 text-muted-foreground">
                      Éditeur de texte riche (Gras, italique, liens, intégration de boutons...)
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
