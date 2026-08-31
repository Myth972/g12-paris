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
  Monitor,
  Play,
  Video,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useBlobUpload } from "@/hooks/useBlobUpload";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "react-i18next";

export default function AdminDesign() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  if (user?.role !== "admin") {
    return (
      <div className="container py-20 text-center">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-serif font-bold mb-2">{t('admin.restrictedAccess')}</h2>
        <p className="text-muted-foreground mb-6">
          {t('admin.restrictedAccessDesc')}
        </p>
        <Button variant="outline" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('admin.backToHome')}
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

  const [conventionPrimaryColor, setConventionPrimaryColor] = useState("#DC2626");
  const [conventionLogoUrl, setConventionLogoUrl] = useState("");
  const [conventionBgUrl, setConventionBgUrl] = useState("");
  const [conventionBgUrlMiddle, setConventionBgUrlMiddle] = useState("");
  const [conventionBgUrlBottom, setConventionBgUrlBottom] = useState("");
  const [conventionLiveEnabled, setConventionLiveEnabled] = useState(false);
  const [conventionYoutubeVideoId, setConventionYoutubeVideoId] = useState("");
  const [conventionFacebookVideoUrl, setConventionFacebookVideoUrl] = useState("");
  const [conventionShowLogo, setConventionShowLogo] = useState(true);
  const [conventionShowOfficialSite, setConventionShowOfficialSite] = useState(true);
  const [conventionShowBilingualCTA, setConventionShowBilingualCTA] = useState(true);
  const [conventionRegistrationEnabled, setConventionRegistrationEnabled] = useState(false);

  const { uploadFile } = useBlobUpload();
  const [uploading, setUploading] = useState<string | null>(null);
  const logoLightRef = useRef<HTMLInputElement>(null);
  const logoDarkRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const conventionLogoRef = useRef<HTMLInputElement>(null);
  const conventionBgRef = useRef<HTMLInputElement>(null);
  const conventionBgMiddleRef = useRef<HTMLInputElement>(null);
  const conventionBgBottomRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logoLight' | 'logoDark' | 'banner' | 'conventionLogo' | 'conventionBg' | 'conventionBgMiddle' | 'conventionBgBottom') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(type);
    try {
      const result = await uploadFile({ file, folder: 'design' });
      if (type === 'logoLight') setLogoLight(result.url);
      if (type === 'logoDark') setLogoDark(result.url);
      if (type === 'banner') setDefaultBanner(result.url);
      if (type === 'conventionLogo') setConventionLogoUrl(result.url);
      if (type === 'conventionBg') setConventionBgUrl(result.url);
      if (type === 'conventionBgMiddle') setConventionBgUrlMiddle(result.url);
      if (type === 'conventionBgBottom') setConventionBgUrlBottom(result.url);
      toast.success(t('admin.design.toastImageUploaded'));
    } catch {
      toast.error(t('admin.design.toastImageError'));
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

      if (settingsQuery.data["convention.primaryColor"]) setConventionPrimaryColor(settingsQuery.data["convention.primaryColor"] as string);
      if (settingsQuery.data["convention.logoUrl"]) setConventionLogoUrl(settingsQuery.data["convention.logoUrl"] as string);
      if (settingsQuery.data["convention.bgUrl"]) setConventionBgUrl(settingsQuery.data["convention.bgUrl"] as string);
      if (settingsQuery.data["convention.bgUrlMiddle"]) setConventionBgUrlMiddle(settingsQuery.data["convention.bgUrlMiddle"] as string);
      if (settingsQuery.data["convention.bgUrlBottom"]) setConventionBgUrlBottom(settingsQuery.data["convention.bgUrlBottom"] as string);
      if (settingsQuery.data["convention.liveEnabled"] !== undefined) setConventionLiveEnabled(settingsQuery.data["convention.liveEnabled"] === "true");
      if (settingsQuery.data["convention.youtubeVideoId"]) setConventionYoutubeVideoId(settingsQuery.data["convention.youtubeVideoId"] as string);
      if (settingsQuery.data["convention.facebookVideoUrl"]) setConventionFacebookVideoUrl(settingsQuery.data["convention.facebookVideoUrl"] as string);
      if (settingsQuery.data["convention.showLogo"] !== undefined) setConventionShowLogo(settingsQuery.data["convention.showLogo"] !== "false");
      if (settingsQuery.data["convention.showOfficialSite"] !== undefined) setConventionShowOfficialSite(settingsQuery.data["convention.showOfficialSite"] !== "false");
      if (settingsQuery.data["convention.showBilingualCTA"] !== undefined) setConventionShowBilingualCTA(settingsQuery.data["convention.showBilingualCTA"] !== "false");
      if (settingsQuery.data["convention.registrationEnabled"] !== undefined) setConventionRegistrationEnabled(settingsQuery.data["convention.registrationEnabled"] === "true");
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
        setSetting.mutateAsync({ key: "convention.primaryColor", value: conventionPrimaryColor }),
        setSetting.mutateAsync({ key: "convention.logoUrl", value: conventionLogoUrl }),
        setSetting.mutateAsync({ key: "convention.bgUrl", value: conventionBgUrl }),
        setSetting.mutateAsync({ key: "convention.bgUrlMiddle", value: conventionBgUrlMiddle }),
        setSetting.mutateAsync({ key: "convention.bgUrlBottom", value: conventionBgUrlBottom }),
        setSetting.mutateAsync({ key: "convention.liveEnabled", value: String(conventionLiveEnabled) }),
        setSetting.mutateAsync({ key: "convention.youtubeVideoId", value: conventionYoutubeVideoId }),
        setSetting.mutateAsync({ key: "convention.facebookVideoUrl", value: conventionFacebookVideoUrl }),
        setSetting.mutateAsync({ key: "convention.showLogo", value: String(conventionShowLogo) }),
        setSetting.mutateAsync({ key: "convention.showOfficialSite", value: String(conventionShowOfficialSite) }),
        setSetting.mutateAsync({ key: "convention.showBilingualCTA", value: String(conventionShowBilingualCTA) }),
        setSetting.mutateAsync({ key: "convention.registrationEnabled", value: String(conventionRegistrationEnabled) }),
      ]);
      toast.success(t('admin.design.toastSaved'));
    } catch (e) {
      toast.error(t('admin.design.toastSaveError'));
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
    toast.success(t('admin.design.toastExported'));
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
        toast.success(t('admin.design.toastImported'));
      } catch {
        toast.error(t('admin.design.toastInvalidConfig'));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleResetColors = () => {
    setPrimaryColor("#D97706");
    setSecondaryColor("#1E293B");
    setBgColor("#F8FAFC");
    toast.success(t('admin.design.toastReset'));
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20 overflow-y-auto">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")} aria-label="Retour">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {t('admin.title')}
                </span>
              </div>
              <h1 className="text-2xl font-bold font-serif">{t('admin.design.title')}</h1>
            </div>
          </div>
          <Button onClick={handleSave} disabled={setSetting.isPending} className="gap-2">
            {setSetting.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {setSetting.isPending ? t('admin.design.saving') : t('admin.design.saved')}
          </Button>
        </div>
      </div>

      <div className="container py-8 max-w-5xl space-y-8">
        
        {/* Identité (Logos) */}
        <section className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2 border-b pb-4 mb-6">
            <ImageIcon className="w-5 h-5 text-primary" /> {t('admin.design.identityTitle')}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label htmlFor="logo-light-url" className="text-sm font-medium">{t('admin.design.logoLightLabel')}</label>
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
                    <span className="text-sm font-medium text-foreground">{uploading === 'logoLight' ? t('admin.design.uploading') : t('admin.design.browseOrDrag')}</span>
                    <span className="text-xs text-muted-foreground mt-1">{t('admin.design.pngRecommended')}</span>
                  </>
                )}
              </div>
              <input type="file" ref={logoLightRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'logoLight')} id="logo-light-upload" name="logoLightUpload" />
              <Input id="logo-light-url" name="logoLight" placeholder={t('admin.design.orPasteUrl')} value={logoLight} onChange={(e) => setLogoLight(e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-3">
              <label htmlFor="logo-dark-url" className="text-sm font-medium">{t('admin.design.logoDarkLabel')}</label>
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
                    <span className="text-sm font-medium text-white">{uploading === 'logoDark' ? t('admin.design.uploading') : t('admin.design.browseOrDrag')}</span>
                    <span className="text-xs text-slate-400 mt-1">{t('admin.design.darkBackgrounds')}</span>
                  </>
                )}
              </div>
              <input type="file" ref={logoDarkRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'logoDark')} id="logo-dark-upload" name="logoDarkUpload" />
              <Input id="logo-dark-url" name="logoDark" placeholder={t('admin.design.orPasteUrl')} value={logoDark} onChange={(e) => setLogoDark(e.target.value)} className="text-xs" />
            </div>
          </div>
        </section>

        {/* Couleurs Principales */}
        <section className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <h2 className="text-xl font-bold font-serif flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" /> {t('admin.design.colorChartTitle')}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleResetColors} className="gap-1">
                <RotateCcw className="w-4 h-4" />
                {t('admin.tutorial.design.config.reset')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportConfig} className="gap-1">
                <Download className="w-4 h-4" />
                {t('admin.tutorial.design.config.export')}
              </Button>
              <label className="cursor-pointer">
                <input type="file" accept=".json" onChange={handleImportConfig} className="hidden" />
                <input type="file" id="config-import" accept=".json" onChange={handleImportConfig} className="hidden" />
              <label htmlFor="config-import" className="cursor-pointer">
                <Button variant="outline" size="sm" className="gap-1 pointer-events-none">
                  <Upload className="w-4 h-4" />
                  {t('admin.tutorial.design.config.import')}
                </Button>
              </label>
              </label>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-sm font-medium mb-3">{t('admin.design.colorPresets')}</p>
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
              <label htmlFor="primary-color" className="text-sm font-medium">{t('admin.design.primaryColor')}</label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg shadow-inner cursor-pointer border ring-2 ring-transparent hover:ring-primary transition-all overflow-hidden relative">
                  <input id="primary-color-picker" name="primaryColorPicker" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="absolute inset-0 w-20 h-20 -top-2 -left-2 cursor-pointer" />
                </div>
                <Input id="primary-color" name="primaryColor" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono text-sm uppercase" />
              </div>
              <p className="text-xs text-muted-foreground">{t('admin.design.primaryColorDesc')}</p>
            </div>
            <div className="space-y-3">
              <label htmlFor="secondary-color" className="text-sm font-medium">{t('admin.design.secondaryColor')}</label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg shadow-inner cursor-pointer border ring-2 ring-transparent hover:ring-primary transition-all overflow-hidden relative">
                  <input id="secondary-color-picker" name="secondaryColorPicker" type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="absolute inset-0 w-20 h-20 -top-2 -left-2 cursor-pointer" />
                </div>
                <Input id="secondary-color" name="secondaryColor" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="font-mono text-sm uppercase" />
              </div>
              <p className="text-xs text-muted-foreground">{t('admin.design.secondaryColorDesc')}</p>
            </div>
            <div className="space-y-3">
              <label htmlFor="bg-color" className="text-sm font-medium">{t('admin.design.bgColor')}</label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg shadow-inner cursor-pointer border ring-2 ring-transparent hover:ring-primary transition-all overflow-hidden relative">
                  <input id="bg-color-picker" name="bgColorPicker" type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="absolute inset-0 w-20 h-20 -top-2 -left-2 cursor-pointer" />
                </div>
                <Input id="bg-color" name="bgColor" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="font-mono text-sm uppercase" />
              </div>
              <p className="text-xs text-muted-foreground">{t('admin.design.bgColorDesc')}</p>
            </div>
          </div>
        </section>

        {/* Typographies */}
        <section className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2 border-b pb-4 mb-6">
            <Type className="w-5 h-5 text-primary" /> {t('admin.design.typographyTitle')}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="font-heading" className="text-sm font-medium">{t('admin.design.headingFont')}</label>
                <Select value={fontHeading} onValueChange={setFontHeading}>
                  <SelectTrigger id="font-heading" name="fontHeading" className="font-serif text-lg py-6">
                    <SelectValue placeholder={t('admin.design.chooseFont')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="playfair" className="font-serif">Playfair Display</SelectItem>
                    <SelectItem value="merriweather" className="font-serif">Merriweather</SelectItem>
                    <SelectItem value="lora" className="font-serif">Lora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <h1 className="text-3xl font-serif font-bold mb-2" style={{ color: textColor }}>{t('admin.design.exampleHeading')}</h1>
                <h2 className="text-xl font-serif font-semibold" style={{ color: textColor }}>{t('admin.design.exampleSubheading')}</h2>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="font-body" className="text-sm font-medium">{t('admin.design.bodyFont')}</label>
                <Select value={fontBody} onValueChange={setFontBody}>
                  <SelectTrigger id="font-body" name="fontBody" className="font-sans py-6">
                    <SelectValue placeholder={t('admin.design.chooseFont')} />
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
                  {t('admin.design.exampleBody')}
                </p>
              </div>
            </div>
          </div>

          {/* Couleurs de police avec aperçu en temps réel */}
          <div className="mt-8 pt-6 border-t border-border/40">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium">{t('admin.design.fontColors')}</p>
              <button 
                onClick={() => {
                  // Générer des couleurs aléatoires pour la démonstration
                  const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16);
                  setTextColor(randomColor());
                  setMutedTextColor(randomColor());
                }}
                className="text-xs text-primary hover:text-primary/70 transition-colors p-1 rounded hover:bg-primary/5"
              >
                {t('admin.design.testRandomColors')}
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label htmlFor="text-color" className="text-sm font-medium">{t('admin.design.textColor')}</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg shadow-inner cursor-pointer border ring-2 ring-transparent hover:ring-primary transition-all overflow-hidden relative">
                    <input id="text-color-picker" name="textColorPicker" type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="absolute inset-0 w-20 h-20 -top-2 -left-2 cursor-pointer" />
                  </div>
                  <Input id="text-color" name="textColor" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="font-mono text-sm uppercase" />
                </div>
                <p className="text-xs text-muted-foreground">{t('admin.design.textColorDesc')}</p>
              </div>
              <div className="space-y-3">
                <label htmlFor="muted-text-color" className="text-sm font-medium">{t('admin.design.mutedTextColor')}</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg shadow-inner cursor-pointer border ring-2 ring-transparent hover:ring-primary transition-all overflow-hidden relative">
                    <input id="muted-text-color-picker" name="mutedTextColorPicker" type="color" value={mutedTextColor} onChange={(e) => setMutedTextColor(e.target.value)} className="absolute inset-0 w-20 h-20 -top-2 -left-2 cursor-pointer" />
                  </div>
                  <Input id="muted-text-color" name="mutedTextColor" value={mutedTextColor} onChange={(e) => setMutedTextColor(e.target.value)} className="font-mono text-sm uppercase" />
                </div>
                <p className="text-xs text-muted-foreground">{t('admin.design.mutedTextColorDesc')}</p>
              </div>
            </div>
            
            {/* Aperçu en temps réel des couleurs de police */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium mb-2 text-muted-foreground">{t('admin.design.livePreview')}</p>
              <div className="space-y-2">
                <p className="text-lg font-semibold" style={{ color: textColor }}>{t('admin.design.exampleTitle')}</p>
                <p className="text-base" style={{ color: mutedTextColor }}>{t('admin.design.exampleMuted')}</p>
                <p className="text-sm font-medium" style={{ color: textColor }}>{t('admin.design.exampleButton')}</p>
                <p className="text-xs" style={{ color: mutedTextColor }}>{t('admin.design.exampleCaption')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Mode Sombre / Clair */}
        <section className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2 border-b pb-4 mb-6">
            <Monitor className="w-5 h-5 text-primary" /> {t('admin.design.displayModeTitle')}
          </h2>
          
          {/* Toggle activation */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl mb-6">
            <div className="space-y-1">
              <p className="text-sm font-semibold">{t('admin.design.enableThemeToggle')}</p>
              <p className="text-xs text-muted-foreground">{t('admin.design.enableThemeToggleDesc')}</p>
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
            <p className="text-sm font-medium mb-3">{t('admin.design.defaultTheme')}</p>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <label className={`relative flex flex-col items-center gap-3 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                defaultTheme === 'light' ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:bg-muted/50'
              }`}>
                <input type="radio" name="default-theme" value="light" checked={defaultTheme === 'light'} onChange={() => setDefaultTheme('light')} className="sr-only" />
                {defaultTheme === 'light' && <div className="absolute top-2 right-2 text-primary"><CheckCircle2 className="w-4 h-4" /></div>}
                <div className="w-16 h-16 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center shadow-sm">
                  <Sun className="w-8 h-8 text-amber-500" />
                </div>
                <span className={`text-sm font-semibold ${defaultTheme === 'light' ? 'text-primary' : ''}`}>{t('admin.design.lightMode')}</span>
              </label>
              <label className={`relative flex flex-col items-center gap-3 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                defaultTheme === 'dark' ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:bg-muted/50'
              }`}>
                <input type="radio" name="default-theme" value="dark" checked={defaultTheme === 'dark'} onChange={() => setDefaultTheme('dark')} className="sr-only" />
                {defaultTheme === 'dark' && <div className="absolute top-2 right-2 text-primary"><CheckCircle2 className="w-4 h-4" /></div>}
                <div className="w-16 h-16 rounded-xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center shadow-sm">
                  <Moon className="w-8 h-8 text-indigo-400" />
                </div>
                <span className={`text-sm font-semibold ${defaultTheme === 'dark' ? 'text-primary' : ''}`}>{t('admin.design.darkMode')}</span>
              </label>
            </div>
             <p className="text-xs text-muted-foreground mt-3">{t('admin.design.defaultThemeDesc')}</p>
           </div>
         </section>

         {/* Prévisualisation du thème */}
         <section className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
           <h2 className="text-xl font-bold font-serif flex items-center gap-2 border-b pb-4 mb-6">
             <Monitor className="w-5 h-5 text-primary" /> {t('admin.design.previewTitle')}
           </h2>
           <div className="space-y-6">
             <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{t('admin.design.previewDarkMode')}</p>
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
                {t('admin.design.previewDesc')}
              </p>
             <div className="grid gap-6 md:grid-cols-2">
               {/* Light Mode Preview */}
               <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-inner border border-border/20">
                  <h3 className="text-lg font-semibold font-serif mb-4">{t('admin.design.previewLight')}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 px-4 py-3 bg-primary/10 rounded-lg">
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: primaryColor }} />
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: secondaryColor }} />
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: bgColor }} />
                      <span className="text-sm">{t('admin.design.colorPrimary')}</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium" style={{ color: textColor }}>{t('admin.design.exampleDesc')}</p>
                      <button className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90">
                        {t('admin.design.actionButton')}
                      </button>
                   </div>
                 </div>
               </div>
               {/* Dark Mode Preview */}
               <div className={`bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-inner border border-border/20 ${previewDarkMode ? 'bg-black/50' : ''}`}>
                 <h3 className="text-lg font-semibold font-serif mb-4">{t('admin.design.previewDark')}</h3>
                 <div className="space-y-4">
                    <div className="flex items-center gap-4 px-4 py-3 bg-primary/10 rounded-lg">
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: primaryColor }} />
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: secondaryColor }} />
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: bgColor }} />
                      <span className="text-sm">{t('admin.design.colorPrimary')}</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium" style={{ color: previewDarkMode ? '#fff' : textColor }}>
                        {t('admin.design.exampleDesc')}
                      </p>
                      <button className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90">
                        {t('admin.design.actionButton')}
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
             <MousePointerClick className="w-5 h-5 text-primary" /> {t('admin.design.buttonStyleTitle')}
          </h2>
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <label className={`relative border-2 rounded-xl p-4 cursor-pointer transition-colors text-center ${buttonStyle === 'square' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                <input type="radio" name="button-style" value="square" checked={buttonStyle === 'square'} onChange={(e) => setButtonStyle(e.target.value)} className="sr-only" />
                {buttonStyle === 'square' && <div className="absolute top-2 right-2 text-primary"><CheckCircle2 className="w-5 h-5" /></div>}
                <div className="mb-4">
                  <span className="inline-block bg-primary text-primary-foreground px-6 py-2 text-sm font-medium">{t('admin.design.squareButton')}</span>
                </div>
                <span className={`text-sm font-semibold ${buttonStyle === 'square' ? 'text-primary' : ''}`}>{t('admin.design.squareAngles')}</span>
              </label>

              <label className={`relative border-2 rounded-xl p-4 cursor-pointer transition-colors text-center ${buttonStyle === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                <input type="radio" name="button-style" value="light" checked={buttonStyle === 'light'} onChange={(e) => setButtonStyle(e.target.value)} className="sr-only" />
                {buttonStyle === 'light' && <div className="absolute top-2 right-2 text-primary"><CheckCircle2 className="w-5 h-5" /></div>}
                <div className="mb-4">
                  <span className="inline-block bg-primary text-primary-foreground px-6 py-2 text-sm font-medium rounded-md shadow-sm">{t('admin.design.lightButton')}</span>
                </div>
                <span className={`text-sm font-semibold ${buttonStyle === 'light' ? 'text-primary' : ''}`}>{t('admin.design.lightRounded')}</span>
              </label>

              <label className={`relative border-2 rounded-xl p-4 cursor-pointer transition-colors text-center ${buttonStyle === 'pill' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                <input type="radio" name="button-style" value="pill" checked={buttonStyle === 'pill'} onChange={(e) => setButtonStyle(e.target.value)} className="sr-only" />
                {buttonStyle === 'pill' && <div className="absolute top-2 right-2 text-primary"><CheckCircle2 className="w-5 h-5" /></div>}
                <div className="mb-4">
                  <span className="inline-block bg-primary text-primary-foreground px-6 py-2 text-sm font-medium rounded-full">{t('admin.design.pillButton')}</span>
                </div>
                <span className={`text-sm font-semibold ${buttonStyle === 'pill' ? 'text-primary' : ''}`}>{t('admin.design.pillRounded')}</span>
              </label>
            </div>
          </div>
        </section>

        {/* Style des Cartes */}
        <section className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2 border-b pb-4 mb-6">
             <LayoutTemplate className="w-5 h-5 text-primary" /> {t('admin.design.cardStyleTitle')}
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
                 <span className={`block text-sm font-semibold mb-1 ${cardStyle === 'border' ? 'text-primary' : ''}`}>{t('admin.design.borderCards')}</span>
                <span className="text-xs text-muted-foreground">{t('admin.design.borderCardsDesc')}</span>
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
                 <span className={`block text-sm font-semibold mb-1 ${cardStyle === 'shadow' ? 'text-primary' : ''}`}>{t('admin.design.shadowCards')}</span>
                <span className="text-xs text-muted-foreground">{t('admin.design.shadowCardsDesc')}</span>
              </div>
            </label>
          </div>
        </section>

        {/* Bannières Globales */}
        <section className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2 border-b pb-4 mb-6">
             <FileText className="w-5 h-5 text-primary" /> {t('admin.design.bannerTitle')}
          </h2>
          <div className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="default-banner-url" className="text-sm font-medium">{t('admin.design.defaultBanner')}</label>
              <div 
                className="relative h-48 rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center group cursor-pointer border-2 border-dashed border-slate-700"
                onClick={() => bannerRef.current?.click()}
                aria-label="Upload default banner"
              >
                {defaultBanner ? (
                  <>
                    <img src={defaultBanner} alt="Default Banner" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors z-10 flex flex-col items-center justify-center">
                      <Button variant="secondary" size="sm" className="pointer-events-none">{t('admin.design.replaceImage')}</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors z-10" />
                    <div className="relative z-20 flex flex-col items-center">
                      {uploading === 'banner' ? <Loader2 className="w-8 h-8 text-white/80 mb-2 animate-spin" /> : <ImageIcon className="w-8 h-8 text-white/80 mb-2 group-hover:scale-110 transition-transform" />}
                      <span className="text-sm font-medium text-white">{uploading === 'banner' ? t('admin.design.uploading') : t('admin.design.addBackgroundImage')}</span>
                    </div>
                  </>
                )}
              </div>
              <input id="banner-upload" name="bannerUpload" type="file" ref={bannerRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'banner')} />
              <Input id="default-banner-url" name="defaultBanner" placeholder={t('admin.design.orPasteUrl')} value={defaultBanner} onChange={(e) => setDefaultBanner(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">{t('admin.design.bannerHelp')}</p>
            </div>
          </div>
        </section>
        {/* Section Convention G12 France */}
        <section className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2 border-b pb-4 mb-6">
            <Shield className="w-5 h-5 text-primary" /> Personnalisation Convention G12 France
          </h2>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="convention-logo-url" className="text-sm font-medium">Logo de la Convention</label>
                {conventionLogoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConventionLogoUrl("")}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                    aria-label="Supprimer le logo"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Supprimer
                  </Button>
                )}
              </div>
              <div 
                className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer bg-slate-50 relative overflow-hidden"
                onClick={() => conventionLogoRef.current?.click()}
                aria-label="Upload logo convention"
              >
                {conventionLogoUrl ? (
                  <img src={conventionLogoUrl} alt="Logo Convention" className="max-h-24 object-contain" />
                ) : (
                  <>
                    {uploading === 'conventionLogo' ? <Loader2 className="w-8 h-8 text-muted-foreground mb-2 animate-spin" /> : <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />}
                    <span className="text-sm font-medium text-foreground">{uploading === 'conventionLogo' ? t('admin.design.uploading') : t('admin.design.browseOrDrag')}</span>
                  </>
                )}
              </div>
              <input type="file" ref={conventionLogoRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'conventionLogo')} id="convention-logo-upload" name="conventionLogoUpload" />
              <Input id="convention-logo-url" name="conventionLogoUrl" placeholder={t('admin.design.orPasteUrl')} value={conventionLogoUrl} onChange={(e) => setConventionLogoUrl(e.target.value)} className="text-xs" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="convention-bg-url" className="text-sm font-medium">Image d'arrière-plan (Haut de page)</label>
                {conventionBgUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConventionBgUrl("")}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                    aria-label="Supprimer l'image d'arrière-plan"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Supprimer
                  </Button>
                )}
              </div>
              <div 
                className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer bg-slate-50 relative overflow-hidden"
                onClick={() => conventionBgRef.current?.click()}
                aria-label="Upload background convention"
              >
                {conventionBgUrl ? (
                  <img src={conventionBgUrl} alt="Background Convention" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                ) : (
                  <>
                    {uploading === 'conventionBg' ? <Loader2 className="w-8 h-8 text-muted-foreground mb-2 animate-spin" /> : <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />}
                    <span className="text-sm font-medium text-foreground">{uploading === 'conventionBg' ? t('admin.design.uploading') : t('admin.design.browseOrDrag')}</span>
                  </>
                )}
              </div>
              <input type="file" ref={conventionBgRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'conventionBg')} id="convention-bg-upload" name="conventionBgUpload" />
              <Input id="convention-bg-url" name="conventionBgUrl" placeholder={t('admin.design.orPasteUrl')} value={conventionBgUrl} onChange={(e) => setConventionBgUrl(e.target.value)} className="text-xs" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="convention-bg-middle-url" className="text-sm font-medium">Image d'arrière-plan (Milieu de page)</label>
                {conventionBgUrlMiddle && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConventionBgUrlMiddle("")}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                    aria-label="Supprimer l'image du milieu"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Supprimer
                  </Button>
                )}
              </div>
              <div 
                className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer bg-slate-50 relative overflow-hidden"
                onClick={() => conventionBgMiddleRef.current?.click()}
                aria-label="Upload background milieu convention"
              >
                {conventionBgUrlMiddle ? (
                  <img src={conventionBgUrlMiddle} alt="Background Milieu" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                ) : (
                  <>
                    {uploading === 'conventionBgMiddle' ? <Loader2 className="w-8 h-8 text-muted-foreground mb-2 animate-spin" /> : <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />}
                    <span className="text-sm font-medium text-foreground">{uploading === 'conventionBgMiddle' ? t('admin.design.uploading') : t('admin.design.browseOrDrag')}</span>
                  </>
                )}
              </div>
              <input type="file" ref={conventionBgMiddleRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'conventionBgMiddle')} id="convention-bg-middle-upload" name="conventionBgMiddleUpload" />
              <Input id="convention-bg-middle-url" name="conventionBgMiddleUrl" placeholder={t('admin.design.orPasteUrl')} value={conventionBgUrlMiddle} onChange={(e) => setConventionBgUrlMiddle(e.target.value)} className="text-xs" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="convention-bg-bottom-url" className="text-sm font-medium">Image d'arrière-plan (Bas de page)</label>
                {conventionBgUrlBottom && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConventionBgUrlBottom("")}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                    aria-label="Supprimer l'image du bas"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Supprimer
                  </Button>
                )}
              </div>
              <div 
                className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer bg-slate-50 relative overflow-hidden"
                onClick={() => conventionBgBottomRef.current?.click()}
                aria-label="Upload background bas convention"
              >
                {conventionBgUrlBottom ? (
                  <img src={conventionBgUrlBottom} alt="Background Bas" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                ) : (
                  <>
                    {uploading === 'conventionBgBottom' ? <Loader2 className="w-8 h-8 text-muted-foreground mb-2 animate-spin" /> : <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />}
                    <span className="text-sm font-medium text-foreground">{uploading === 'conventionBgBottom' ? t('admin.design.uploading') : t('admin.design.browseOrDrag')}</span>
                  </>
                )}
              </div>
              <input type="file" ref={conventionBgBottomRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'conventionBgBottom')} id="convention-bg-bottom-upload" name="conventionBgBottomUpload" />
              <Input id="convention-bg-bottom-url" name="conventionBgBottomUrl" placeholder={t('admin.design.orPasteUrl')} value={conventionBgUrlBottom} onChange={(e) => setConventionBgUrlBottom(e.target.value)} className="text-xs" />
            </div>
          </div>
          
          <div className="space-y-3">
            <label htmlFor="convention-primary-color" className="text-sm font-medium">Couleur Principale (Boutons, Textes accentués)</label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg shadow-inner cursor-pointer border ring-2 ring-transparent hover:ring-primary transition-all overflow-hidden relative">
                <input id="convention-primary-color-picker" name="conventionPrimaryColorPicker" type="color" value={conventionPrimaryColor} onChange={(e) => setConventionPrimaryColor(e.target.value)} className="absolute inset-0 w-20 h-20 -top-2 -left-2 cursor-pointer" />
              </div>
              <Input id="convention-primary-color" name="conventionPrimaryColor" value={conventionPrimaryColor} onChange={(e) => setConventionPrimaryColor(e.target.value)} className="font-mono text-sm uppercase max-w-[200px]" />
            </div>
            <p className="text-xs text-muted-foreground">Applique une touche de couleur spécifique sur la page Convention.</p>
          </div>

          {/* Toggle Logo */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border mt-6">
            <div>
              <label htmlFor="convention-show-logo" className="text-sm font-medium cursor-pointer">Afficher le logo</label>
              <p className="text-xs text-muted-foreground mt-1">Masquer le logo de la Convention sur la page publique.</p>
            </div>
            <button
              id="convention-show-logo"
              name="conventionShowLogo"
              type="button"
              role="switch"
              aria-checked={conventionShowLogo}
              onClick={() => setConventionShowLogo(!conventionShowLogo)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${conventionShowLogo ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${conventionShowLogo ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Toggle Official Site */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border">
            <div>
              <label htmlFor="convention-show-official-site" className="text-sm font-medium cursor-pointer">Afficher "Visiter le site officiel"</label>
              <p className="text-xs text-muted-foreground mt-1">Bouton lien vers conventiong12france.com sous les vidéos.</p>
            </div>
            <button
              id="convention-show-official-site"
              name="conventionShowOfficialSite"
              type="button"
              role="switch"
              aria-checked={conventionShowOfficialSite}
              onClick={() => setConventionShowOfficialSite(!conventionShowOfficialSite)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${conventionShowOfficialSite ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${conventionShowOfficialSite ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Toggle Bilingual CTA */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border mt-6">
            <div>
              <label htmlFor="convention-show-bilingual-cta" className="text-sm font-medium cursor-pointer">Afficher la section bilingue FR/EN</label>
              <p className="text-xs text-muted-foreground mt-1">Masquer le bloc "NOUS SOMMES DANS LES TEMPS" (FR + EN) sous la vidéo.</p>
            </div>
            <button
              id="convention-show-bilingual-cta"
              name="conventionShowBilingualCTA"
              type="button"
              role="switch"
              aria-checked={conventionShowBilingualCTA}
              onClick={() => setConventionShowBilingualCTA(!conventionShowBilingualCTA)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${conventionShowBilingualCTA ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${conventionShowBilingualCTA ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Toggle Registration */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border mt-6">
            <div>
              <label htmlFor="convention-registration-enabled" className="text-sm font-medium cursor-pointer">Inscription obligatoire</label>
              <p className="text-xs text-muted-foreground mt-1">Activer un formulaire d'inscription avant d'accéder à la page Convention (prénom, nom, email).</p>
            </div>
            <button
              id="convention-registration-enabled"
              name="conventionRegistrationEnabled"
              type="button"
              role="switch"
              aria-checked={conventionRegistrationEnabled}
              onClick={() => setConventionRegistrationEnabled(!conventionRegistrationEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${conventionRegistrationEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${conventionRegistrationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Section Lives & Vidéos */}
          <div className="space-y-6 mt-6 pt-6 border-t">
            <h3 className="text-lg font-bold font-serif flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" /> Lives & Vidéos
            </h3>

            {/* Toggle Live */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border">
              <div>
                <label htmlFor="convention-live-enabled" className="text-sm font-medium cursor-pointer">Activer le mode Live</label>
                <p className="text-xs text-muted-foreground mt-1">Affiche un badge "En direct" et lance l'autoplay sur les vidéos.</p>
              </div>
              <button
                id="convention-live-enabled"
                name="conventionLiveEnabled"
                type="button"
                role="switch"
                aria-checked={conventionLiveEnabled}
                onClick={() => setConventionLiveEnabled(!conventionLiveEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${conventionLiveEnabled ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${conventionLiveEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* YouTube Video */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="convention-youtube-video-id" className="text-sm font-medium">Vidéo YouTube (ID ou URL complète)</label>
                {conventionYoutubeVideoId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConventionYoutubeVideoId("")}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                    aria-label="Supprimer la vidéo YouTube"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Supprimer
                  </Button>
                )}
              </div>
              <Input
                id="convention-youtube-video-id"
                name="conventionYoutubeVideoId"
                placeholder="ex: dQw4w9WgXcQ ou https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                value={conventionYoutubeVideoId}
                onChange={(e) => setConventionYoutubeVideoId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Colle l'ID YouTube (11 caractères) ou l'URL complète. Utilisé pour le live et les replays.</p>
            </div>

            {/* Facebook Video */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="convention-facebook-video-url" className="text-sm font-medium">Vidéo Facebook (URL complète)</label>
                {conventionFacebookVideoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConventionFacebookVideoUrl("")}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                    aria-label="Supprimer la vidéo Facebook"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Supprimer
                  </Button>
                )}
              </div>
              <Input
                id="convention-facebook-video-url"
                name="conventionFacebookVideoUrl"
                placeholder="ex: https://www.facebook.com/ConcordiaParis/videos/1234567890/"
                value={conventionFacebookVideoUrl}
                onChange={(e) => setConventionFacebookVideoUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Colle l'URL complète d'une vidéo Facebook (live ou replay). Si YouTube est renseigné, YouTube est affiché en priorité.</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
