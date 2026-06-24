import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Save,
  Plus,
  Trash2,
  GripVertical,
  Navigation,
  Layout,
  FileText,
  Globe,
  ChevronUp,
  ChevronDown,
  ExternalLink,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  visible: boolean;
  order: number;
};

type FooterSection = {
  title: string;
  links: { label: string; href: string }[];
};

type PageContent = {
  pageId: string;
  pageTitle: string;
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  sections: { id: string; label: string; visible: boolean }[];
};

// ── Default data ───────────────────────────────────────────

const DEFAULT_NAV: NavItem[] = [
  { href: "/", label: "Accueil", visible: true, order: 0 },
  { href: "/publication-du-jour", label: "Publication du jour", visible: true, order: 1 },
  { href: "/galeries", label: "Galeries", visible: true, order: 2 },
  { href: "/culte-en-ligne", label: "Culte en ligne", visible: true, order: 3 },
  { href: "/bibliotheque", label: "Bibliothèque", visible: true, order: 4 },
];

const DEFAULT_PAGES: PageContent[] = [
  {
    pageId: "home",
    pageTitle: "Accueil",
    metaTitle: "G12 Paris — Infos Médias",
    metaDescription: "Bienvenue sur G12 Paris Infos Médias, votre source d'information spirituelle.",
    heroTitle: "Bienvenue à G12 Paris",
    heroSubtitle: "Une communauté de foi, d'amour et d'espérance",
    sections: [
      { id: "hero", label: "Bannière hero", visible: true },
      { id: "publications", label: "Publications du jour", visible: true },
      { id: "articles", label: "Derniers articles", visible: true },
      { id: "annonces", label: "Annonces & Événements", visible: true },
      { id: "galeries", label: "Galerie en avant", visible: true },
    ],
  },
  {
    pageId: "culte-en-ligne",
    pageTitle: "Culte en ligne",
    metaTitle: "Culte en ligne — G12 Paris",
    metaDescription: "Suivez nos cultes en direct ou en replay.",
    heroTitle: "Culte en ligne",
    heroSubtitle: "Rejoignez-nous à distance",
    sections: [
      { id: "player", label: "Lecteur vidéo", visible: true },
      { id: "infos", label: "Informations culte", visible: true },
    ],
  },
  {
    pageId: "galeries",
    pageTitle: "Galeries",
    metaTitle: "Galeries — G12 Paris",
    metaDescription: "Découvrez nos galeries photos et vidéos.",
    heroTitle: "Galeries",
    heroSubtitle: "Moments de grâce capturés",
    sections: [
      { id: "featured", label: "Image du jour", visible: true },
      { id: "carousel", label: "Carrousel", visible: true },
      { id: "mosaic", label: "Mosaïque", visible: true },
    ],
  },
  {
    pageId: "bibliotheque",
    pageTitle: "Bibliothèque",
    metaTitle: "Bibliothèque — G12 Paris",
    metaDescription: "Ressources, études et offres spirituelles.",
    heroTitle: "Bibliothèque",
    heroSubtitle: "Enrichissez votre foi",
    sections: [
      { id: "offers", label: "Offres & Packs", visible: true },
      { id: "themes", label: "Thèmes bibliques", visible: true },
      { id: "studies", label: "Études & Ressources", visible: true },
    ],
  },
  {
    pageId: "publication-du-jour",
    pageTitle: "Publication du jour",
    metaTitle: "Publication du jour — G12 Paris",
    metaDescription: "La publication spirituelle du jour.",
    heroTitle: "Publication du jour",
    heroSubtitle: "Une parole pour votre journée",
    sections: [
      { id: "content", label: "Contenu principal", visible: true },
    ],
  },
];

// ── Helper ─────────────────────────────────────────────────

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`cms_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, data: unknown) {
  localStorage.setItem(`cms_${key}`, JSON.stringify(data));
}

// ── Main Component ─────────────────────────────────────────

export default function CMSManager() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Layout className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-serif font-bold">CMS — Gestion de contenu</h2>
          <p className="text-xs text-muted-foreground">
            Modifiez la structure, le contenu et le SEO du site. Les changements sont sauvegardés localement.
          </p>
        </div>
      </div>

      <Tabs defaultValue="navigation" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="navigation" className="gap-2">
            <Navigation className="w-4 h-4" />
            Navigation
          </TabsTrigger>
          <TabsTrigger value="pages" className="gap-2">
            <FileText className="w-4 h-4" />
            Pages & SEO
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-2">
            <Layout className="w-4 h-4" />
            Sections
          </TabsTrigger>
          <TabsTrigger value="global" className="gap-2">
            <Globe className="w-4 h-4" />
            Global
          </TabsTrigger>
        </TabsList>

        <TabsContent value="navigation">
          <NavigationEditor />
        </TabsContent>
        <TabsContent value="pages">
          <PagesEditor />
        </TabsContent>
        <TabsContent value="sections">
          <SectionsManager />
        </TabsContent>
        <TabsContent value="global">
          <GlobalSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Navigation Editor ──────────────────────────────────────

function NavigationEditor() {
  const [nav, setNav] = useState<NavItem[]>(() => loadJSON("nav", DEFAULT_NAV));
  const setSetting = trpc.siteSettings.set.useMutation({
    onSuccess: () => toast.success("Navigation sauvegardée"),
  });

  const save = () => {
    saveJSON("nav", nav);
    setSetting.mutate({ key: "cms.navigation", value: JSON.stringify(nav) });
  };

  const addItem = () => {
    setNav([...nav, { href: "/", label: "Nouveau lien", visible: true, order: nav.length }]);
  };

  const removeItem = (index: number) => {
    setNav(nav.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof NavItem, value: string | boolean | number) => {
    const updated = [...nav];
    updated[index] = { ...updated[index], [field]: value };
    setNav(updated);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...nav];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setNav(updated.map((item, i) => ({ ...item, order: i })));
  };

  const moveDown = (index: number) => {
    if (index === nav.length - 1) return;
    const updated = [...nav];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setNav(updated.map((item, i) => ({ ...item, order: i })));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Liens de navigation</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={addItem}>
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
            <Button size="sm" onClick={save} disabled={setSetting.isPending}>
              <Save className="w-4 h-4 mr-1" />
              Enregistrer
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Réordonnez, ajoutez ou masquez des liens du menu principal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {nav.map((item, index) => (
          <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex gap-2 flex-1">
              <Input
                value={item.label}
                onChange={(e) => updateItem(index, "label", e.target.value)}
                placeholder="Libellé"
                className="w-48"
              />
              <Input
                value={item.href}
                onChange={(e) => updateItem(index, "href", e.target.value)}
                placeholder="/chemin"
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={item.visible}
                onCheckedChange={(v) => updateItem(index, "visible", v)}
              />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveUp(index)} disabled={index === 0}>
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveDown(index)} disabled={index === nav.length - 1}>
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Pages Editor ───────────────────────────────────────────

function PagesEditor() {
  const [pages, setPages] = useState<PageContent[]>(() => loadJSON("pages", DEFAULT_PAGES));
  const [selectedPage, setSelectedPage] = useState(0);
  const setSetting = trpc.siteSettings.set.useMutation({
    onSuccess: () => toast.success("Pages sauvegardées"),
  });

  const save = () => {
    saveJSON("pages", pages);
    setSetting.mutate({ key: "cms.pages", value: JSON.stringify(pages) });
  };

  const updatePage = (index: number, field: keyof PageContent, value: string) => {
    const updated = [...pages];
    updated[index] = { ...updated[index], [field]: value };
    setPages(updated);
  };

  const page = pages[selectedPage];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Contenu & SEO par page</span>
          <Button size="sm" onClick={save} disabled={setSetting.isPending}>
            <Save className="w-4 h-4 mr-1" />
            Enregistrer
          </Button>
        </CardTitle>
        <CardDescription>
          Modifiez les titres, descriptions SEO et contenus hero de chaque page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {/* Sidebar pages */}
          <div className="w-48 space-y-1 shrink-0">
            {pages.map((p, i) => (
              <button
                key={p.pageId}
                onClick={() => setSelectedPage(i)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  i === selectedPage
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                {p.pageTitle}
              </button>
            ))}
          </div>

          {/* Editor */}
          {page && (
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Titre de la page</Label>
                  <Input value={page.pageTitle} onChange={(e) => updatePage(selectedPage, "pageTitle", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>ID de la page</Label>
                  <Input value={page.pageId} disabled className="opacity-60" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Meta Title (SEO)</Label>
                <Input value={page.metaTitle} onChange={(e) => updatePage(selectedPage, "metaTitle", e.target.value)} placeholder="Titre pour Google" />
              </div>

              <div className="space-y-2">
                <Label>Meta Description (SEO)</Label>
                <Textarea
                  value={page.metaDescription}
                  onChange={(e) => updatePage(selectedPage, "metaDescription", e.target.value)}
                  placeholder="Description pour les moteurs de recherche"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Titre Hero</Label>
                  <Input value={page.heroTitle} onChange={(e) => updatePage(selectedPage, "heroTitle", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sous-titre Hero</Label>
                  <Input value={page.heroSubtitle} onChange={(e) => updatePage(selectedPage, "heroSubtitle", e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Sections Manager ───────────────────────────────────────

function SectionsManager() {
  const [pages, setPages] = useState<PageContent[]>(() => loadJSON("pages", DEFAULT_PAGES));
  const setSetting = trpc.siteSettings.set.useMutation({
    onSuccess: () => toast.success("Sections sauvegardées"),
  });

  const save = () => {
    saveJSON("pages", pages);
    setSetting.mutate({ key: "cms.sections", value: JSON.stringify(pages) });
  };

  const toggleSection = (pageIndex: number, sectionIndex: number) => {
    const updated = [...pages];
    const sections = [...updated[pageIndex].sections];
    sections[sectionIndex] = { ...sections[sectionIndex], visible: !sections[sectionIndex].visible };
    updated[pageIndex] = { ...updated[pageIndex], sections };
    setPages(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Visibilité des sections</span>
          <Button size="sm" onClick={save} disabled={setSetting.isPending}>
            <Save className="w-4 h-4 mr-1" />
            Enregistrer
          </Button>
        </CardTitle>
        <CardDescription>
          Activez ou désactivez des sections entières sur chaque page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {pages.map((page, pi) => (
          <div key={page.pageId} className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              {page.pageTitle}
              <span className="text-xs text-muted-foreground">({page.pageId})</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {page.sections.map((section, si) => (
                <div
                  key={section.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-sm ${
                    section.visible ? "bg-card" : "bg-muted/50 opacity-60"
                  }`}
                >
                  <span>{section.label}</span>
                  <Switch
                    checked={section.visible}
                    onCheckedChange={() => toggleSection(pi, si)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Global Settings ────────────────────────────────────────

function GlobalSettings() {
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const setSetting = trpc.siteSettings.set.useMutation({
    onSuccess: () => toast.success("Paramètres sauvegardés"),
  });

  const [siteName, setSiteName] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [favicon, setFavicon] = useState("");

  useEffect(() => {
    if (settingsQuery.data) {
      setSiteName((settingsQuery.data["global.siteName"] as string) || "G12 Paris Infos Médias");
      setSiteDescription((settingsQuery.data["global.siteDescription"] as string) || "");
      setOgImage((settingsQuery.data["global.ogImage"] as string) || "");
      setFavicon((settingsQuery.data["global.favicon"] as string) || "");
    }
  }, [settingsQuery.data]);

  const saveAll = async () => {
    await Promise.all([
      setSetting.mutateAsync({ key: "global.siteName", value: siteName }),
      setSetting.mutateAsync({ key: "global.siteDescription", value: siteDescription }),
      setSetting.mutateAsync({ key: "global.ogImage", value: ogImage }),
      setSetting.mutateAsync({ key: "global.favicon", value: favicon }),
    ]);
    toast.success("Paramètres globaux sauvegardés");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Paramètres globaux du site</span>
          <Button size="sm" onClick={saveAll} disabled={setSetting.isPending}>
            <Save className="w-4 h-4 mr-1" />
            Tout enregistrer
          </Button>
        </CardTitle>
        <CardDescription>
          Nom du site, description, image Open Graph, favicon.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nom du site</Label>
            <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Favicon URL</Label>
            <Input value={favicon} onChange={(e) => setFavicon(e.target.value)} placeholder="/logo.webp" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description du site (SEO)</Label>
          <Textarea value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} rows={2} />
        </div>
        <div className="space-y-2">
          <Label>Image Open Graph (URL)</Label>
          <Input value={ogImage} onChange={(e) => setOgImage(e.target.value)} placeholder="https://..." />
        </div>
      </CardContent>
    </Card>
  );
}
