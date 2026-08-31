import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Globe,
  ChevronLeft,
  Info,
  ListOrdered,
  Layout,
  HelpCircle,
  Search,
  Filter,
  ArrowUpDown,
  CheckSquare,
  Eye,
  Save,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Palette,
  Download,
  Upload,
  RotateCcw,
  TrendingUp,
  Library,
  FileText,
  Users,
  ImageIcon,
  Keyboard,
  Shield,
} from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminTutorial() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (user?.role !== "admin") {
    return (
      <div className="container py-20 text-center">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-serif font-bold mb-2">{t('admin.restrictedAccess')}</h2>
        <p className="text-muted-foreground mb-6">
          {t('admin.restrictedAccessDesc')}
        </p>
        <Button variant="outline" onClick={() => setLocation("/")}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t('admin.backToHome')}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{t('admin.tutorial.title')}</h1>
            <p className="text-muted-foreground">{t('admin.tutorial.description')}</p>
            <Button variant="outline" onClick={() => {
              const newLang = i18n.language === 'fr' ? 'en' : 'fr';
              i18n.changeLanguage(newLang);
            }} className="flex items-center gap-2 mt-2" title="Changer la langue">
              <Globe className="h-4 w-4" />
              {i18n.language === 'fr' ? 'Français' : 'English'}
            </Button>
          </div>
          <Button variant="ghost" onClick={() => setLocation("/admin")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t('admin.backToDashboard')}
          </Button>
        </div>

        {/* Section: Display Order */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <ListOrdered className="h-6 w-6 text-primary" />
            <h2>{t('admin.tutorial.displayOrder.title')}</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.tutorial.displayOrder.howItWorks')}</CardTitle>
              <CardDescription>
                <p>{t('admin.tutorial.displayOrder.explanation')}</p>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-primary/30 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2">
                    0
                  </div>
                  <p className="text-sm font-medium">{t('admin.tutorial.displayOrder.firstElement')}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/30 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-muted-foreground text-background flex items-center justify-center font-bold mb-2">
                    1
                  </div>
                  <p className="text-sm font-medium">{t('admin.tutorial.displayOrder.secondElement')}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/30 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-muted-foreground text-background flex items-center justify-center font-bold mb-2">
                    2
                  </div>
                  <p className="text-sm font-medium">{t('admin.tutorial.displayOrder.thirdElement')}</p>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 p-4 rounded-md">
                <p className="text-sm">
                  <strong>{t('admin.tutorial.displayOrder.rule')}</strong> {t('admin.tutorial.displayOrder.ruleDesc')}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">{t('admin.tutorial.displayOrder.practicalTips')}</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>{t('admin.tutorial.displayOrder.tip1')}</li>
                  <li>{t('admin.tutorial.displayOrder.tip2')}</li>
                  <li>{t('admin.tutorial.displayOrder.tip3')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section: Content Layout */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <Layout className="h-6 w-6 text-primary" />
            <h2>{t('admin.tutorial.contentLayout.title')}</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('admin.tutorial.contentLayout.homePage')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('admin.tutorial.contentLayout.description')}
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>
                      {t('admin.tutorial.contentLayout.homePageTip')}
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('admin.tutorial.contentLayout.galleryPage')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('admin.tutorial.contentLayout.galleryPageDesc')}
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>
                      {t('admin.tutorial.contentLayout.galleryPageTip')}
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section: Video Loop */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h2>{t('admin.tutorial.contentLayout.videoLoop.title')}</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
                <p className="text-sm">{t('admin.tutorial.contentLayout.videoLoop.description')}</p>
            </CardContent>
          </Card>
        </section>

        {/* Section: Live Badge */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h2>{t('admin.tutorial.contentLayout.liveBadge.title')}</h2>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-2">
                <p className="text-sm">{t('admin.tutorial.contentLayout.liveBadge.description')}</p>
              <p className="text-sm text-muted-foreground">
                {t('admin.tutorial.contentLayout.liveBadge.howTo')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('admin.tutorial.contentLayout.liveBadge.indicator')}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Section: Convention G12 France */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <Globe className="h-6 w-6 text-primary" />
            <h2>Convention G12 France</h2>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                La page Convention est accessible via <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/culte-en-ligne/convention</code>. Elle est entièrement configurable depuis l'admin Design.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Paramètres visuels</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span><strong>Logo</strong> — Upload ou URL. Toggle ON/OFF pour masquer.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span><strong>Image de fond</strong> — Image d'en-tête de la page.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span><strong>Couleur principale</strong> — Appliquée aux accents, boutons, titres.</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Vidéos & Live</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span><strong>Mode Live</strong> — Badge "En direct" + autoplay. Fonctionne avec YouTube et Facebook.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span><strong>YouTube</strong> — ID ou URL complète. Affiché en priorité.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span><strong>Facebook</strong> — URL de partage (share/v/...). Utilisé si YouTube est vide. Fallback automatique si l'iframe ne charge pas.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 p-3 rounded-md">
                <p className="text-sm">
                  <strong>Règle :</strong> YouTube et Facebook ne s'affichent pas en même temps. YouTube a la priorité. Si YouTube est vide, Facebook est affiché.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section: Médias & Uploads */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <ImageIcon className="h-6 w-6 text-primary" />
            <h2>Médias & Uploads</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Les images sont uploadées via Vercel Blob ou stockées localement dans <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/uploads</code>.
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>Formats supportés : JPG, PNG, WebP, AVIF, SVG, GIF</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>Les URLs relatives <code>/uploads/</code> sont converties en URLs absolues automatiquement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>Utiliser <code>getImageUrl()</code> pour les images dynamiques</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Audio & Vidéo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Les fichiers audio et vidéo sont uploadés via le même mécanisme.
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>Audio : MP3, WAV, OGG</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>Vidéo : MP4, WebM</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>Les vidéos YouTube/Facebook sont intégrées via iframe (pas d'upload)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section: Gestion Bibliothèque - Nouvelles fonctionnalités */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <Library className="h-6 w-6 text-primary" />
            <h2>{t('admin.tutorial.contentLayout.libraryAdvanced.title')}</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  {t('admin.tutorial.library.searchFilters.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('admin.tutorial.library.searchFilters.description')}
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{t('admin.tutorial.library.searchFilters.searchBar')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{t('admin.tutorial.library.searchFilters.filterType')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{t('admin.tutorial.library.searchFilters.filterTheme')}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowUpDown className="w-5 h-5 text-primary" />
                  {t('admin.tutorial.library.sortPagination.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('admin.tutorial.library.sortPagination.description')}
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{t('admin.tutorial.library.sortPagination.sortBy')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{t('admin.tutorial.library.sortPagination.direction')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{t('admin.tutorial.library.sortPagination.pagination')}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-primary" />
                  {t('admin.tutorial.library.bulkActions.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('admin.tutorial.library.bulkActions.description')}
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{t('admin.tutorial.library.bulkActions.selectAll')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{t('admin.tutorial.library.bulkActions.publish')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{t('admin.tutorial.library.bulkActions.unpublish')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{t('admin.tutorial.library.bulkActions.delete')}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  {t('admin.tutorial.library.quickActions.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('admin.tutorial.library.quickActions.description')}
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{t('admin.tutorial.library.quickActions.iconStatus')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{t('admin.tutorial.library.quickActions.iconPreview')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{t('admin.tutorial.library.quickActions.iconMenu')}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section: Éditeur de contenu */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <FileText className="h-6 w-6 text-primary" />
            <h2>{t('admin.tutorial.editor.title')}</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  {t('admin.tutorial.editor.autoSave.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('admin.tutorial.editor.autoSave.description')}
                </p>
                <div className="bg-primary/5 border border-primary/20 p-3 rounded-md">
                  <p className="text-sm">
                    {t('admin.tutorial.editor.autoSave.rule')}
                  </p>
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• {t('admin.tutorial.editor.autoSave.indicatorSaving')}</li>
                  <li>• {t('admin.tutorial.editor.autoSave.indicatorSaved')}</li>
                  <li>• {t('admin.tutorial.editor.autoSave.indicatorUnsaved')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {t('admin.tutorial.editor.seo.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('admin.tutorial.editor.seo.description')}
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                    <span>{t('admin.tutorial.editor.seo.rule')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
                    <span>{t('admin.tutorial.editor.seo.errors')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                    <span>{t('admin.tutorial.editor.seo.suggestions')}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-primary" />
                  {t('admin.tutorial.editor.shortcuts.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('admin.tutorial.editor.shortcuts.description')}
                </p>
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('admin.tutorial.editor.shortcuts.save')}</span>
                    <kbd className="px-2 py-1 bg-background border rounded text-xs">Ctrl + S</kbd>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('admin.tutorial.editor.shortcuts.info')}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section: Design & Identité */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <Palette className="h-6 w-6 text-primary" />
            <h2>{t('admin.tutorial.design.title')}</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('admin.tutorial.design.presets.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('admin.tutorial.design.presets.description')}
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{t('admin.tutorial.design.presets.rule')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{t('admin.tutorial.design.presets.picker')}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('admin.tutorial.design.config.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('admin.tutorial.design.config.description')}
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-muted/50 p-3 rounded-md text-center">
                    <Download className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <span className="text-xs font-medium">{t('admin.tutorial.design.config.export')}</span>
                    <p className="text-xs text-muted-foreground">{t('admin.tutorial.design.config.exportDesc')}</p>
                  </div>
                  <div className="flex-1 bg-muted/50 p-3 rounded-md text-center">
                    <Upload className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <span className="text-xs font-medium">{t('admin.tutorial.design.config.import')}</span>
                    <p className="text-xs text-muted-foreground">{t('admin.tutorial.design.config.importDesc')}</p>
                  </div>
                  <div className="flex-1 bg-muted/50 p-3 rounded-md text-center">
                    <RotateCcw className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <span className="text-xs font-medium">{t('admin.tutorial.design.config.reset')}</span>
                    <p className="text-xs text-muted-foreground">{t('admin.tutorial.design.config.resetDesc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section: Dashboard Stats */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2>{t('admin.tutorial.dashboard.title')}</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.tutorial.dashboard.stats.title')}</CardTitle>
              <CardDescription>
                {t('admin.tutorial.dashboard.stats.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <FileText className="w-5 h-5 text-primary mb-2" />
                  <p className="text-lg font-bold">{t('admin.tutorial.dashboard.stats.articles')}</p>
                  <p className="text-xs text-muted-foreground">{t('admin.tutorial.dashboard.stats.articlesDesc')}</p>
                </div>
                <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                  <Users className="w-5 h-5 text-green-600 mb-2" />
                  <p className="text-lg font-bold">{t('admin.tutorial.dashboard.stats.subscribers')}</p>
                  <p className="text-xs text-muted-foreground">{t('admin.tutorial.dashboard.stats.subscribersDesc')}</p>
                </div>
                <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
                  <ImageIcon className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-lg font-bold">{t('admin.tutorial.dashboard.stats.gallery')}</p>
                  <p className="text-xs text-muted-foreground">{t('admin.tutorial.dashboard.stats.galleryDesc')}</p>
                </div>
                <div className="p-4 bg-amber-500/5 rounded-lg border border-amber-500/20">
                  <Library className="w-5 h-5 text-amber-600 mb-2" />
                  <p className="text-lg font-bold">{t('admin.tutorial.dashboard.stats.library')}</p>
                  <p className="text-xs text-muted-foreground">{t('admin.tutorial.dashboard.stats.libraryDesc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <div className="text-center pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            {t('admin.tutorial.footer.help')}
          </p>
        </div>
      </div>
    </div>
  );
}
