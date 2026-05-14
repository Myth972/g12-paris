import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Palette,
  ArrowLeft,
  FileText,
  ImageIcon,
  Type,
  LayoutTemplate,
  MousePointerClick,
  CheckCircle2,
  Save,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useBlobUpload } from "@/hooks/useBlobUpload";

export default function AdminDesign() {
  const [, setLocation] = useLocation();
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const setSetting = trpc.siteSettings.set.useMutation();

  const [primaryColor, setPrimaryColor] = useState("#D97706");
  const [secondaryColor, setSecondaryColor] = useState("#1E293B");
  const [bgColor, setBgColor] = useState("#F8FAFC");
  const [fontHeading, setFontHeading] = useState("playfair");
  const [fontBody, setFontBody] = useState("inter");
  const [buttonStyle, setButtonStyle] = useState("light");
  const [cardStyle, setCardStyle] = useState("shadow");
  
  const [logoLight, setLogoLight] = useState("");
  const [logoDark, setLogoDark] = useState("");
  const [defaultBanner, setDefaultBanner] = useState("");

  const { uploadFile } = useBlobUpload();
  const [uploading, setUploading] = useState<string | null>(null);
  const logoLightRef = useRef<HTMLInputElement>(null);
  const logoDarkRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logoLight' | 'logoDark' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(type);
    try {
      const result = await uploadFile({ file, folder: 'design' });
      if (type === 'logoLight') setLogoLight(result.url);
      if (type === 'logoDark') setLogoDark(result.url);
      if (type === 'banner') setDefaultBanner(result.url);
      toast.success("Image téléchargée avec succès");
    } catch {
      toast.error("Erreur lors du téléchargement de l'image");
    } finally {
      setUploading(null);
    }
  };

  useEffect(() => {
    if (settingsQuery.data) {
      if (settingsQuery.data["design.primaryColor"]) setPrimaryColor(settingsQuery.data["design.primaryColor"] as string);
      if (settingsQuery.data["design.secondaryColor"]) setSecondaryColor(settingsQuery.data["design.secondaryColor"] as string);
      if (settingsQuery.data["design.bgColor"]) setBgColor(settingsQuery.data["design.bgColor"] as string);
      if (settingsQuery.data["design.fontHeading"]) setFontHeading(settingsQuery.data["design.fontHeading"] as string);
      if (settingsQuery.data["design.fontBody"]) setFontBody(settingsQuery.data["design.fontBody"] as string);
      if (settingsQuery.data["design.buttonStyle"]) setButtonStyle(settingsQuery.data["design.buttonStyle"] as string);
      if (settingsQuery.data["design.cardStyle"]) setCardStyle(settingsQuery.data["design.cardStyle"] as string);
      
      if (settingsQuery.data["design.logoLight"]) setLogoLight(settingsQuery.data["design.logoLight"] as string);
      if (settingsQuery.data["design.logoDark"]) setLogoDark(settingsQuery.data["design.logoDark"] as string);
      if (settingsQuery.data["design.defaultBanner"]) setDefaultBanner(settingsQuery.data["design.defaultBanner"] as string);
    }
  }, [settingsQuery.data]);

  const handleSave = async () => {
    try {
      await Promise.all([
        setSetting.mutateAsync({ key: "design.primaryColor", value: primaryColor }),
        setSetting.mutateAsync({ key: "design.secondaryColor", value: secondaryColor }),
        setSetting.mutateAsync({ key: "design.bgColor", value: bgColor }),
        setSetting.mutateAsync({ key: "design.fontHeading", value: fontHeading }),
        setSetting.mutateAsync({ key: "design.fontBody", value: fontBody }),
        setSetting.mutateAsync({ key: "design.buttonStyle", value: buttonStyle }),
        setSetting.mutateAsync({ key: "design.cardStyle", value: cardStyle }),
        setSetting.mutateAsync({ key: "design.logoLight", value: logoLight }),
        setSetting.mutateAsync({ key: "design.logoDark", value: logoDark }),
        setSetting.mutateAsync({ key: "design.defaultBanner", value: defaultBanner }),
      ]);
      toast.success("Paramètres de design enregistrés avec succès.");
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement des paramètres.");
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20 overflow-y-auto">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Administration
                </span>
              </div>
              <h1 className="text-2xl font-bold font-serif">Design & Identité Visuelle</h1>
            </div>
          </div>
          <Button onClick={handleSave} disabled={setSetting.isPending} className="gap-2">
            {setSetting.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {setSetting.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </div>

      <div className="container py-8 max-w-5xl space-y-8">
        
        {/* Identité (Logos) */}
        <section className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2 border-b pb-4 mb-6">
            <ImageIcon className="w-5 h-5 text-primary" /> Identité Visuelle (Logos)
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label htmlFor="logo-light-url" className="text-sm font-medium">Logo Principal (Clair)</label>
              <div 
                className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer bg-slate-50 relative overflow-hidden"
                onClick={() => logoLightRef.current?.click()}
                aria-label="Upload logo light"
              >
                {logoLight ? (
                  <img src={logoLight} alt="Logo Light" className="max-h-24 object-contain" />
                ) : (
                  <>
                    {uploading === 'logoLight' ? <Loader2 className="w-8 h-8 text-muted-foreground mb-2 animate-spin" /> : <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />}
                    <span className="text-sm font-medium text-foreground">{uploading === 'logoLight' ? 'Téléchargement...' : 'Parcourir ou glisser'}</span>
                    <span className="text-xs text-muted-foreground mt-1">PNG transparent recommandé</span>
                  </>
                )}
              </div>
              <input type="file" ref={logoLightRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'logoLight')} id="logo-light-upload" name="logoLightUpload" />
              <Input id="logo-light-url" name="logoLight" placeholder="Ou coller l'URL de l'image" value={logoLight} onChange={(e) => setLogoLight(e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-3">
              <label htmlFor="logo-dark-url" className="text-sm font-medium">Logo Variante (Sombre)</label>
              <div 
                className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-800 transition-colors cursor-pointer bg-slate-900 relative overflow-hidden border-slate-700"
                onClick={() => logoDarkRef.current?.click()}
                aria-label="Upload logo dark"
              >
                {logoDark ? (
                  <img src={logoDark} alt="Logo Dark" className="max-h-24 object-contain" />
                ) : (
                  <>
                    {uploading === 'logoDark' ? <Loader2 className="w-8 h-8 text-slate-400 mb-2 animate-spin" /> : <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />}
                    <span className="text-sm font-medium text-white">{uploading === 'logoDark' ? 'Téléchargement...' : 'Parcourir ou glisser'}</span>
                    <span className="text-xs text-slate-400 mt-1">Pour les fonds sombres</span>
                  </>
                )}
              </div>
              <input type="file" ref={logoDarkRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'logoDark')} id="logo-dark-upload" name="logoDarkUpload" />
              <Input id="logo-dark-url" name="logoDark" placeholder="Ou coller l'URL de l'image" value={logoDark} onChange={(e) => setLogoDark(e.target.value)} className="text-xs" />
            </div>
          </div>
        </section>

        {/* Couleurs Principales */}
        <section className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2 border-b pb-4 mb-6">
            <Palette className="w-5 h-5 text-primary" /> Charte Graphique (Couleurs)
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label htmlFor="primary-color" className="text-sm font-medium">Couleur Primaire</label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg shadow-inner cursor-pointer border ring-2 ring-transparent hover:ring-primary transition-all overflow-hidden relative">
                  <input id="primary-color-picker" name="primaryColorPicker" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="absolute inset-0 w-20 h-20 -top-2 -left-2 cursor-pointer" />
                </div>
                <Input id="primary-color" name="primaryColor" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono text-sm uppercase" />
              </div>
              <p className="text-xs text-muted-foreground">Boutons d'action, accents visuels, icônes principales.</p>
            </div>
            <div className="space-y-3">
              <label htmlFor="secondary-color" className="text-sm font-medium">Couleur Secondaire</label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg shadow-inner cursor-pointer border ring-2 ring-transparent hover:ring-primary transition-all overflow-hidden relative">
                  <input id="secondary-color-picker" name="secondaryColorPicker" type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="absolute inset-0 w-20 h-20 -top-2 -left-2 cursor-pointer" />
                </div>
                <Input id="secondary-color" name="secondaryColor" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="font-mono text-sm uppercase" />
              </div>
              <p className="text-xs text-muted-foreground">En-têtes, bannières, éléments contrastants.</p>
            </div>
            <div className="space-y-3">
              <label htmlFor="bg-color" className="text-sm font-medium">Couleur d'Arrière-plan</label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg shadow-inner cursor-pointer border ring-2 ring-transparent hover:ring-primary transition-all overflow-hidden relative">
                  <input id="bg-color-picker" name="bgColorPicker" type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="absolute inset-0 w-20 h-20 -top-2 -left-2 cursor-pointer" />
                </div>
                <Input id="bg-color" name="bgColor" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="font-mono text-sm uppercase" />
              </div>
              <p className="text-xs text-muted-foreground">Le fond principal de vos pages.</p>
            </div>
          </div>
        </section>

        {/* Typographies */}
        <section className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2 border-b pb-4 mb-6">
            <Type className="w-5 h-5 text-primary" /> Typographies
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="font-heading" className="text-sm font-medium">Police des Titres (H1, H2, H3)</label>
                <Select value={fontHeading} onValueChange={setFontHeading}>
                  <SelectTrigger id="font-heading" name="fontHeading" className="font-serif text-lg py-6">
                    <SelectValue placeholder="Choisir une police" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="playfair" className="font-serif">Playfair Display</SelectItem>
                    <SelectItem value="merriweather" className="font-serif">Merriweather</SelectItem>
                    <SelectItem value="lora" className="font-serif">Lora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <h1 className="text-3xl font-serif font-bold mb-2">Exemple de Grand Titre</h1>
                <h2 className="text-xl font-serif font-semibold">Exemple de Sous-titre</h2>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="font-body" className="text-sm font-medium">Police du Corps de Texte</label>
                <Select value={fontBody} onValueChange={setFontBody}>
                  <SelectTrigger id="font-body" name="fontBody" className="font-sans py-6">
                    <SelectValue placeholder="Choisir une police" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter" className="font-sans">Inter</SelectItem>
                    <SelectItem value="roboto" className="font-sans">Roboto</SelectItem>
                    <SelectItem value="lato" className="font-sans">Lato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ceci est un exemple de corps de texte. Il doit être hautement lisible, agréable à l'œil et s'adapter parfaitement aux écrans de toutes tailles.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Style des Boutons */}
        <section className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2 border-b pb-4 mb-6">
            <MousePointerClick className="w-5 h-5 text-primary" /> Style des Boutons
          </h2>
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <label className={`relative border-2 rounded-xl p-4 cursor-pointer transition-colors text-center ${buttonStyle === 'square' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                <input type="radio" name="button-style" value="square" checked={buttonStyle === 'square'} onChange={(e) => setButtonStyle(e.target.value)} className="sr-only" />
                {buttonStyle === 'square' && <div className="absolute top-2 right-2 text-primary"><CheckCircle2 className="w-5 h-5" /></div>}
                <div className="mb-4">
                  <span className="inline-block bg-primary text-primary-foreground px-6 py-2 text-sm font-medium">Bouton Carré</span>
                </div>
                <span className={`text-sm font-semibold ${buttonStyle === 'square' ? 'text-primary' : ''}`}>Angles droits</span>
              </label>

              <label className={`relative border-2 rounded-xl p-4 cursor-pointer transition-colors text-center ${buttonStyle === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                <input type="radio" name="button-style" value="light" checked={buttonStyle === 'light'} onChange={(e) => setButtonStyle(e.target.value)} className="sr-only" />
                {buttonStyle === 'light' && <div className="absolute top-2 right-2 text-primary"><CheckCircle2 className="w-5 h-5" /></div>}
                <div className="mb-4">
                  <span className="inline-block bg-primary text-primary-foreground px-6 py-2 text-sm font-medium rounded-md shadow-sm">Bouton Léger</span>
                </div>
                <span className={`text-sm font-semibold ${buttonStyle === 'light' ? 'text-primary' : ''}`}>Arrondis légers (Standard)</span>
              </label>

              <label className={`relative border-2 rounded-xl p-4 cursor-pointer transition-colors text-center ${buttonStyle === 'pill' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                <input type="radio" name="button-style" value="pill" checked={buttonStyle === 'pill'} onChange={(e) => setButtonStyle(e.target.value)} className="sr-only" />
                {buttonStyle === 'pill' && <div className="absolute top-2 right-2 text-primary"><CheckCircle2 className="w-5 h-5" /></div>}
                <div className="mb-4">
                  <span className="inline-block bg-primary text-primary-foreground px-6 py-2 text-sm font-medium rounded-full">Bouton Pilule</span>
                </div>
                <span className={`text-sm font-semibold ${buttonStyle === 'pill' ? 'text-primary' : ''}`}>Très arrondis</span>
              </label>
            </div>
          </div>
        </section>

        {/* Style des Cartes */}
        <section className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2 border-b pb-4 mb-6">
            <LayoutTemplate className="w-5 h-5 text-primary" /> Style des Cartes & Vignettes
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <label className={`relative border-2 rounded-xl p-6 cursor-pointer transition-colors ${cardStyle === 'border' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
              <input type="radio" name="card-style" value="border" checked={cardStyle === 'border'} onChange={(e) => setCardStyle(e.target.value)} className="sr-only" />
              {cardStyle === 'border' && <div className="absolute top-2 right-2 text-primary"><CheckCircle2 className="w-5 h-5" /></div>}
              <div className="bg-background border rounded-xl overflow-hidden shadow-sm mb-4 max-w-[200px] mx-auto">
                <div className="aspect-video bg-muted"></div>
                <div className="p-3">
                  <div className="h-2 w-3/4 bg-muted rounded mb-2"></div>
                  <div className="h-2 w-1/2 bg-muted rounded"></div>
                </div>
              </div>
              <div className="text-center">
                <span className={`block text-sm font-semibold mb-1 ${cardStyle === 'border' ? 'text-primary' : ''}`}>Cartes avec bordures</span>
                <span className="text-xs text-muted-foreground">Style classique délimité</span>
              </div>
            </label>

            <label className={`relative border-2 rounded-xl p-6 cursor-pointer transition-colors ${cardStyle === 'shadow' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
              <input type="radio" name="card-style" value="shadow" checked={cardStyle === 'shadow'} onChange={(e) => setCardStyle(e.target.value)} className="sr-only" />
              {cardStyle === 'shadow' && <div className="absolute top-2 right-2 text-primary"><CheckCircle2 className="w-5 h-5" /></div>}
              <div className="bg-background rounded-xl overflow-hidden shadow-lg mb-4 max-w-[200px] mx-auto border-transparent border">
                <div className="aspect-video bg-muted"></div>
                <div className="p-3">
                  <div className="h-2 w-3/4 bg-muted rounded mb-2"></div>
                  <div className="h-2 w-1/2 bg-muted rounded"></div>
                </div>
              </div>
              <div className="text-center">
                <span className={`block text-sm font-semibold mb-1 ${cardStyle === 'shadow' ? 'text-primary' : ''}`}>Cartes Ombrées Flottantes</span>
                <span className="text-xs text-muted-foreground">Style moderne et aérien</span>
              </div>
            </label>
          </div>
        </section>

        {/* Bannières Globales */}
        <section className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2 border-b pb-4 mb-6">
            <FileText className="w-5 h-5 text-primary" /> Images de Bannières Globales
          </h2>
          <div className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="default-banner-url" className="text-sm font-medium">Bannière par défaut des Pages Internes</label>
              <div 
                className="relative h-48 rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center group cursor-pointer border-2 border-dashed border-slate-700"
                onClick={() => bannerRef.current?.click()}
                aria-label="Upload default banner"
              >
                {defaultBanner ? (
                  <>
                    <img src={defaultBanner} alt="Default Banner" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors z-10 flex flex-col items-center justify-center">
                      <Button variant="secondary" size="sm" className="pointer-events-none">Remplacer l'image</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors z-10" />
                    <div className="relative z-20 flex flex-col items-center">
                      {uploading === 'banner' ? <Loader2 className="w-8 h-8 text-white/80 mb-2 animate-spin" /> : <ImageIcon className="w-8 h-8 text-white/80 mb-2 group-hover:scale-110 transition-transform" />}
                      <span className="text-sm font-medium text-white">{uploading === 'banner' ? 'Téléchargement...' : 'Ajouter une image de fond'}</span>
                    </div>
                  </>
                )}
              </div>
              <input id="banner-upload" name="bannerUpload" type="file" ref={bannerRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'banner')} />
              <Input id="default-banner-url" name="defaultBanner" placeholder="Ou coller l'URL de l'image de bannière" value={defaultBanner} onChange={(e) => setDefaultBanner(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">S'affiche en haut des pages internes (comme Contact, À propos) si aucune image spécifique n'est définie pour la page.</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
