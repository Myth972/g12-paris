import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
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
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminTutorial() {
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
        <Button variant="outline" onClick={() => () => setLocation("/")}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
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
            <h1 className="text-3xl font-bold tracking-tight">
              Tutoriel d'Organisation
            </h1>
            <p className="text-muted-foreground">
              Apprenez à structurer et ordonner vos contenus efficacement.
            </p>
          </div>
          <Button variant="ghost" onClick={() => setLocation("/admin")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Retour au Dashboard
          </Button>
        </div>

        {/* Section: Display Order */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <ListOrdered className="h-6 w-6 text-primary" />
            <h2>L'Ordre d'Affichage (Display Order)</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Comment ça marche ?</CardTitle>
              <CardDescription>
                Le champ "Ordre" détermine la position d'un élément sur une
                page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-primary/30 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2">
                    0
                  </div>
                  <p className="text-sm font-medium">Premier élément</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/30 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-muted-foreground text-background flex items-center justify-center font-bold mb-2">
                    1
                  </div>
                  <p className="text-sm font-medium">Deuxième élément</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/30 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-muted-foreground text-background flex items-center justify-center font-bold mb-2">
                    2
                  </div>
                  <p className="text-sm font-medium">Troisième élément</p>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 p-4 rounded-md">
                <p className="text-sm">
                  <strong>Règle d'or :</strong> Plus le chiffre est{" "}
                  <strong>petit</strong>, plus l'élément apparaît{" "}
                  <strong>en haut</strong> ou <strong>au début</strong> de la
                  liste.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Conseils pratiques :</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>
                    Laissez des espaces (ex: 10, 20, 30) pour pouvoir insérer de
                    nouveaux éléments facilement au milieu.
                  </li>
                  <li>
                    Si deux éléments ont le même ordre, ils sont classés par
                    date de création (le plus récent en premier).
                  </li>
                  <li>
                    Par défaut, le système met 0 pour tout nouveau contenu.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section: Content Layout */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <Layout className="h-6 w-6 text-primary" />
            <h2>Structure par Page</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Page d'Accueil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Sur l'accueil, les contenus s'affichent généralement dans une
                  grille.
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>
                      Utilisez des ordres 0-5 pour mettre en avant les titres
                      majeurs.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Galerie / Publication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Pour les galeries, l'ordre permet de raconter une histoire
                  visuelle.
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>
                      L'élément marqué comme "Mis en avant" (Featured) peut
                      avoir un style différent ou apparaître en premier quel que
                      soit l'ordre.
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
            <h2>Lecture en boucle</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm">
                L'option <strong>"Lecture en boucle"</strong> permet de relancer
                automatiquement une vidéo dès qu'elle se termine. C'est idéal
                pour des arrières-plans animés ou des tutoriels courts qui
                doivent tourner en continu.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Section: Live Badge */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h2>Statut "En direct"</h2>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-2">
              <p className="text-sm">
                Sur la page <strong>Culte en ligne</strong>, un badge{" "}
                <strong>"En direct"</strong> indique l'état du live.
              </p>
              <p className="text-sm text-muted-foreground">
                Pour l'activer ou le désactiver : Administration → Contenu des
                pages → Paramètres "Culte en ligne".
              </p>
              <p className="text-sm text-muted-foreground">
                Indicateur : LED rouge = en ligne, LED noire = hors ligne.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Section: Gestion Bibliothèque - Nouvelles fonctionnalités */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <Library className="h-6 w-6 text-primary" />
            <h2>Gestion Bibliothèque - Fonctionnalités Avancées</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Recherche & Filtres
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  La liste des contenus dispose d'outils avancés pour find rapidement ce que vous cherchez.
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>Barre de recherche</strong> : recherche par titre ou auteur</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>Filtrer par type</strong> : Livre, Bible, Étude, Vidéo, Offre...</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>Filtrer par thème</strong> : Foi, Leadership, Famille, Prière...</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowUpDown className="w-5 h-5 text-primary" />
                  Tri & Pagination
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Organisez vos contenus selon vos besoins et naviguez facilement.
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>Trier par</strong> : Date de création, Titre, Prix</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>Direction</strong> : Croissant ou décroissant</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>Pagination</strong> : 20 éléments par page avec navigation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-primary" />
                  Actions Groupées (Bulk)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sélectionnez plusieurs contenus pour leur appliquer des actions communes.
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>Cocher la case</strong> en haut pour tout sélectionner</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>Publier</strong> : rendre visible plusieurs contenus</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>Dépublier</strong> : masquer plusieurs contenus</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>Supprimer</strong> : supprimer plusieurs contenus</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Actions Rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Au survol d'une ligne, des boutons rapides apparaissent.
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>Icône ✓</strong> : Publier ou dépublier le contenu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>Icône ⤳</strong> : Ouvrir l'aperçu dans un nouvel onglet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>Menu ⋮</strong> : Éditer, Aperçu, Supprimer</span>
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
            <h2>Éditeur de Contenu - Outils Intelligents</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Sauvegarde Auto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Ne perdez jamais votre travail grâce au brouillon automatique.
                </p>
                <div className="bg-primary/5 border border-primary/20 p-3 rounded-md">
                  <p className="text-sm">
                    <strong>Toutes les 30 secondes</strong>, vos modifications sont enregistrées automatiquement en tant que brouillon (non publié).
                  </p>
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Indicateur "Sauvegarde en cours..."</li>
                  <li>• Indicateur "Brouillon enregistré" ✓</li>
                  <li>• Indicateur "Modifications non enregistrées"</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Analyse SEO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Un score SEO vous aide à optimiser vos contenus pour les moteurs de recherche.
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                    <span>Score basé sur : titre, description, contenu, image</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
                    <span>Erreurs critiques en rouge</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                    <span>Suggestions d'amélioration</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-primary" />
                  Raccourcis Clavier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Gagnez du temps avec les raccourcis clavier.
                </p>
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sauvegarder</span>
                    <kbd className="px-2 py-1 bg-background border rounded text-xs">Ctrl + S</kbd>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Fonctionne depuis n'importe quel champ de la page.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section: Design & Identité */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <Palette className="h-6 w-6 text-primary" />
            <h2>Design & Identité - Personnalisation Avancée</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Préréglages de Couleurs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Choisissez parmi des palettes prédéfinies ou créez la vôtre.
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>8 préréglages</strong> : Orange Doré, Bleu Profond, Vert Forêt, Rose Passion, Violet Royal, Rouge Vif, Teal Émeraude, Gris Élégant</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>Pipette + Hex</strong> : utilisez le sélecteur ou entrez un code couleur</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export / Import Config</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sauvegardez et partagez vos paramètres de design.
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-muted/50 p-3 rounded-md text-center">
                    <Download className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <span className="text-xs font-medium">Exporter</span>
                    <p className="text-xs text-muted-foreground">Télécharge un fichier JSON</p>
                  </div>
                  <div className="flex-1 bg-muted/50 p-3 rounded-md text-center">
                    <Upload className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <span className="text-xs font-medium">Importer</span>
                    <p className="text-xs text-muted-foreground">Charge un fichier JSON</p>
                  </div>
                  <div className="flex-1 bg-muted/50 p-3 rounded-md text-center">
                    <RotateCcw className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <span className="text-xs font-medium">Réinitialiser</span>
                    <p className="text-xs text-muted-foreground">Remet les couleurs par défaut</p>
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
            <h2>Tableau de Bord - Aperçu Statistique</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques en Temps Réel</CardTitle>
              <CardDescription>
                Le dashboard admin affiche des statistiques clés sur votre site.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <FileText className="w-5 h-5 text-primary mb-2" />
                  <p className="text-lg font-bold">Articles publiés</p>
                  <p className="text-xs text-muted-foreground">Nombre de contenus visibles</p>
                </div>
                <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                  <Users className="w-5 h-5 text-green-600 mb-2" />
                  <p className="text-lg font-bold">Abonnés Newsletter</p>
                  <p className="text-xs text-muted-foreground">Total des abonnés</p>
                </div>
                <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
                  <ImageIcon className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-lg font-bold">Médias galerie</p>
                  <p className="text-xs text-muted-foreground">Images et vidéos</p>
                </div>
                <div className="p-4 bg-amber-500/5 rounded-lg border border-amber-500/20">
                  <Library className="w-5 h-5 text-amber-600 mb-2" />
                  <p className="text-lg font-bold">Catégories bibliothèque</p>
                  <p className="text-xs text-muted-foreground">Types de ressources</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <div className="text-center pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Besoin d'aide supplémentaire ? Demandez à l'Assistant IA !
          </p>
        </div>
      </div>
    </div>
  );
}
