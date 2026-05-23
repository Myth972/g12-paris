import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
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
  Loader2,
  Download,
  Upload,
  RotateCcw,
  Shield,
  Sun,
  Moon,
  Monitor
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useBlobUpload } from "@/hooks/useBlobUpload";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminDesign() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

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
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const setSetting = trpc.siteSettings.set.useMutation();

  const [primaryColor, setPrimaryColor] = useState("#D97706");
  const [secondaryColor, setSecondaryColor] = useState("#1E293B");
  const [bgColor, setBgColor] = useState("#F8FAFC");
  const [fontHeading, setFontHeading] = useState("playfair");
  const [fontBody, setFontBody] = useState("inter");
  const [buttonStyle, setButtonStyle] = useState("light");
  const [cardStyle, setCardStyle] = useState("shadow");
  const [textColor, setTextColor] = useState("#1E293B");
  const [mutedTextColor, setMutedTextColor] = useState("#64748B");
  const [enableThemeToggle, setEnableThemeToggle] = useState(false);
  const [defaultTheme, setDefaultTheme] = useState("light");
  const [previewDarkMode, setPreviewDarkMode] = useState(false);

  const colorPresets = [
    { name: "Orange Doré", primary: "#D97706", secondary: "#1E293B", bg: "#F8FAFC" },
    { name: "Bleu Profond", primary: "#2563EB", secondary: "#1E3A5F", bg: "#F0F9FF" },
    { name: "Vert Forêt", primary: "#059669", secondary: "#064E3B", bg: "#ECFDF5" },
    { name: "Rose Passion", primary: "#DB2777", secondary: "#831843", bg: "#FDF2F8" },
    { name: "Violet Royal", primary: "#7C3AED", secondary: "#4C1D95", bg: "#FAF5FF" },
    { name: "Rouge Vif", primary: "#DC2626", secondary: "#7F1D1D", bg: "#FEF2F2" },
    { name: "Teal Émeraude", primary: "#0D9488", secondary: "#134E4A", bg: "#F0FDFA" },
    { name: "Gris Élégant", primary: "#6B7280", secondary: "#1F2937", bg: "#F9FAFB" },
  ];
  
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
      if (settingsQuery.data["design.textColor"]) setTextColor(settingsQuery.data["design.textColor"] as string);
      if (settingsQuery.data["design.mutedTextColor"]) setMutedTextColor(settingsQuery.data["design.mutedTextColor"] as string);
      if (settingsQuery.data["design.enableThemeToggle"]) setEnableThemeToggle(settingsQuery.data["design.enableThemeToggle"] === "true");
      if (settingsQuery.data["design.defaultTheme"]) setDefaultTheme(settingsQuery.data["design.defaultTheme"] as string);
      
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
        setSetting.mutateAsync({ key: "design.textColor", value: textColor }),
        setSetting.mutateAsync({ key: "design.mutedTextColor", value: mutedTextColor }),
        setSetting.mutateAsync({ key: "design.enableThemeToggle", value: String(enableThemeToggle) }),
        setSetting.mutateAsync({ key: "design.defaultTheme", value: defaultTheme }),
        setSetting.mutateAsync({ key: "design.logoLight", value: logoLight }),
        setSetting.mutateAsync({ key: "design.logoDark", value: logoDark }),
        setSetting.mutateAsync({ key: "design.defaultBanner", value: defaultBanner }),
      ]);
      toast.success("Paramètres de design enregistrés avec succès.");
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement des paramètres.");
    }
  };

  const handleExportConfig = () => {
    const config = {
      primaryColor,
      secondaryColor,
      bgColor,
      fontHeading,
      fontBody,
      buttonStyle,
      cardStyle,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `g12-design-config-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Configuration exportée avec succès");
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target?.result as string);
        if (config.primaryColor) setPrimaryColor(config.primaryColor);
        if (config.secondaryColor) setSecondaryColor(config.secondaryColor);
        if (config.bgColor) setBgColor(config.bgColor);
        if (config.fontHeading) setFontHeading(config.fontHeading);
        if (config.fontBody) setFontBody(config.fontBody);
        if (config.buttonStyle) setButtonStyle(config.buttonStyle);
        if (config.cardStyle) setCardStyle(config.cardStyle);
        toast.success("Configuration importée avec succès");
      } catch {
        toast.error("Fichier de configuration invalide");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleResetColors = () => {
    setPrimaryColor("#D97706");
    setSecondaryColor("#1E293B");
    setBgColor("#F8FAFC");
    toast.success("Couleurs réinitialisées");
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
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <h2 className="text-xl font-bold font-serif flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" /> Charte Graphique (Couleurs)
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleResetColors} className="gap-1">
                <RotateCcw className="w-4 h-4" />
                Réinitialiser
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportConfig} className="gap-1">
                <Download className="w-4 h-4" />
                Exporter
              </Button>
              <label className="cursor-pointer">
                <input type="file" accept=".json" onChange={handleImportConfig} className="hidden" />
                <input type="file" id="config-import" accept=".json" onChange={handleImportConfig} className="hidden" />
              <label htmlFor="config-import" className="cursor-pointer">
                <Button variant="outline" size="sm" className="gap-1 pointer-events-none">
                  <Upload className="w-4 h-4" />
                  Importer
                </Button>
              </label>
              </label>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-sm font-medium mb-3">Préréglages de couleurs</p>
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => { setPrimaryColor(preset.primary); setSecondaryColor(preset.secondary); setBgColor(preset.bg); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-sm"
                >
                  <div className="flex -space-x-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.secondary }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.bg }} />
                  </div>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

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
                <h1 className="text-3xl font-serif font-bold mb-2" style={{ color: textColor }}>Exemple de Grand Titre</h1>
                <h2 className="text-xl font-serif font-semibold" style={{ color: textColor }}>Exemple de Sous-titre</h2>
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
                <p className="text-sm leading-relaxed" style={{ color: mutedTextColor }}>
                  Ceci est un exemple de corps de texte. Il doit être hautement lisible, agréable à l'œil et s'adapter parfaitement aux écrans de toutes tailles.
                </p>
              </div>
            </div>
          </div>

          {/* Couleurs de police avec aperçu en temps réel */}
          <div className="mt-8 pt-6 border-t border-border/40">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium">Couleurs de la Police</p>
              <button 
                onClick={() => {
                  // Générer des couleurs aléatoires pour la démonstration
                  const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16);
                  setTextColor(randomColor());
                  setMutedTextColor(randomColor());
                }}
                className="text-xs text-primary hover:text-primary/70 transition-colors p-1 rounded hover:bg-primary/5"
              >
                Tester des couleurs aléatoires
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label htmlFor="text-color" className="text-sm font-medium">Couleur du Texte Principal</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg shadow-inner cursor-pointer border ring-2 ring-transparent hover:ring-primary transition-all overflow-hidden relative">
                    <input id="text-color-picker" name="textColorPicker" type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="absolute inset-0 w-20 h-20 -top-2 -left-2 cursor-pointer" />
                  </div>
                  <Input id="text-color" name="textColor" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="font-mono text-sm uppercase" />
                </div>
                <p className="text-xs text-muted-foreground">Titres, paragraphes, texte de navigation.</p>
              </div>
              <div className="space-y-3">
                <label htmlFor="muted-text-color" className="text-sm font-medium">Couleur du Texte Secondaire</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg shadow-inner cursor-pointer border ring-2 ring-transparent hover:ring-primary transition-all overflow-hidden relative">
                    <input id="muted-text-color-picker" name="mutedTextColorPicker" type="color" value={mutedTextColor} onChange={(e) => setMutedTextColor(e.target.value)} className="absolute inset-0 w-20 h-20 -top-2 -left-2 cursor-pointer" />
                  </div>
                  <Input id="muted-text-color" name="mutedTextColor" value={mutedTextColor} onChange={(e) => setMutedTextColor(e.target.value)} className="font-mono text-sm uppercase" />
                </div>
                <p className="text-xs text-muted-foreground">Sous-titres, descriptions, textes discrets.</p>
              </div>
            </div>
            
            {/* Aperçu en temps réel des couleurs de police */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium mb-2 text-muted-foreground">Aperçu en temps réel :</p>
              <div className="space-y-2">
                <p className="text-lg font-semibold" style={{ color: textColor }}>Exemple de titre principal</p>
                <p className="text-base" style={{ color: mutedTextColor }}>Exemple de texte secondaire ou de description</p>
                <p className="text-sm font-medium" style={{ color: textColor }}>Bouton ou lien important</p>
                <p className="text-xs" style={{ color: mutedTextColor }}>Texte de pied de page ou légende</p>
              </div>
            </div>
          </div>
        </section>

        {/* Mode Sombre / Clair */}
        <section className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2 border-b pb-4 mb-6">
            <Monitor className="w-5 h-5 text-primary" /> Mode d'Affichage (Sombre / Clair)
          </h2>
          
          {/* Toggle activation */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl mb-6">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Activer le bouton de thème pour les visiteurs</p>
              <p className="text-xs text-muted-foreground">Un bouton ☀️/🌙 apparaîtra dans le menu de navigation pour permettre aux visiteurs de basculer entre mode clair et mode sombre.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enableThemeToggle}
              onClick={() => setEnableThemeToggle(!enableThemeToggle)}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                enableThemeToggle ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
                  enableThemeToggle ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Thème par défaut */}
          <div>
            <p className="text-sm font-medium mb-3">Thème par défaut du site</p>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <label className={`relative flex flex-col items-center gap-3 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                defaultTheme === 'light' ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:bg-muted/50'
              }`}>
                <input type="radio" name="default-theme" value="light" checked={defaultTheme === 'light'} onChange={() => setDefaultTheme('light')} className="sr-only" />
                {defaultTheme === 'light' && <div className="absolute top-2 right-2 text-primary"><CheckCircle2 className="w-4 h-4" /></div>}
                <div className="w-16 h-16 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center shadow-sm">
                  <Sun className="w-8 h-8 text-amber-500" />
                </div>
                <span className={`text-sm font-semibold ${defaultTheme === 'light' ? 'text-primary' : ''}`}>Mode Clair</span>
              </label>
              <label className={`relative flex flex-col items-center gap-3 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                defaultTheme === 'dark' ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:bg-muted/50'
              }`}>
                <input type="radio" name="default-theme" value="dark" checked={defaultTheme === 'dark'} onChange={() => setDefaultTheme('dark')} className="sr-only" />
                {defaultTheme === 'dark' && <div className="absolute top-2 right-2 text-primary"><CheckCircle2 className="w-4 h-4" /></div>}
                <div className="w-16 h-16 rounded-xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center shadow-sm">
                  <Moon className="w-8 h-8 text-indigo-400" />
                </div>
                <span className={`text-sm font-semibold ${defaultTheme === 'dark' ? 'text-primary' : ''}`}>Mode Sombre</span>
              </label>
            </div>
             <p className="text-xs text-muted-foreground mt-3">Le thème utilisé par défaut lors de la première visite. Si le bouton de thème est activé, le visiteur pourra changer ensuite.</p>
           </div>
         </section>

         {/* Prévisualisation du thème */}
         <section className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
           <h2 className="text-xl font-bold font-serif flex items-center gap-2 border-b pb-4 mb-6">
             <Monitor className="w-5 h-5 text-primary" /> Prévisualisation du Thème
           </h2>
           <div className="space-y-6">
             <div className="flex items-center justify-between">
               <p className="text-sm font-semibold">Prévisualiser en mode sombre</p>
               <button
                 type="button"
                 role="switch"
                 aria-checked={previewDarkMode}
                 onClick={() => setPreviewDarkMode(!previewDarkMode)}
                 className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                   previewDarkMode ? 'bg-primary' : 'bg-muted'
                 }`}
               >
                 <span
                   className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
                     previewDarkMode ? 'translate-x-7' : 'translate-x-0'
                   }`}
                 />
               </button>
             </div>
             <p className="text-xs text-muted-foreground">
               Visualisez comment votre site apparaîtra en mode sombre avec les couleurs actuelles.
             </p>
             <div className="grid gap-6 md:grid-cols-2">
               {/* Light Mode Preview */}
               <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-inner border border-border/20">
                 <h3 className="text-lg font-semibold font-serif mb-4">Prévisualisation - Mode Clair</h3>
                 <div className="space-y-4">
                   <div className="flex items-center gap-4 px-4 py-3 bg-primary/10 rounded-lg">
                     <div className="w-8 h-8 rounded-full" style={{ backgroundColor: primaryColor }} />
                     <div className="w-8 h-8 rounded-full" style={{ backgroundColor: secondaryColor }} />
                     <div className="w-8 h-8 rounded-full" style={{ backgroundColor: bgColor }} />
                     <span className="text-sm">Primaire • Secondaire • Fond</span>
                   </div>
                   <div className="space-y-2">
                     <p className="text-sm font-medium" style={{ color: textColor }}>Exemple de titre</p>
                     <p className="text-base" style={{ color: mutedTextColor }}>
                       Exemple de texte de description ou de paragraphe
                     </p>
                     <button className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90">
                       Bouton d'action
                     </button>
                   </div>
                 </div>
               </div>
               {/* Dark Mode Preview */}
               <div className={`bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-inner border border-border/20 ${previewDarkMode ? 'bg-black/50' : ''}`}>
                 <h3 className="text-lg font-semibold font-serif mb-4">Prévisualisation - Mode Sombre</h3>
                 <div className="space-y-4">
                   <div className="flex items-center gap-4 px-4 py-3 bg-primary/10 rounded-lg">
                     <div className="w-8 h-8 rounded-full" style={{ backgroundColor: primaryColor }} />
                     <div className="w-8 h-8 rounded-full" style={{ backgroundColor: secondaryColor }} />
                     <div className="w-8 h-8 rounded-full" style={{ backgroundColor: bgColor }} />
                     <span className="text-sm">Primaire • Secondaire • Fond</span>
                   </div>
                   <div className="space-y-2">
                     <p className="text-sm font-medium" style={{ color: previewDarkMode ? '#fff' : textColor }}>
                       Exemple de titre
                     </p>
                     <p className="text-base" style={{ color: previewDarkMode ? '#e2e8f0' : mutedTextColor }}>
                       Exemple de texte de description ou de paragraphe
                     </p>
                     <button className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90">
                       Bouton d'action
                     </button>
                   </div>
                 </div>
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
