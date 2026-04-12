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
} from "lucide-react";
import { useLocation } from "wouter";

export default function AdminTutorial() {
  const [, setLocation] = useLocation();

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
