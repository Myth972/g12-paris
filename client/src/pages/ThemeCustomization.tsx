/**
 * Theme Customization Page
 * Allows users to customize site theme, colors, and appearance
 */

import { Helmet } from "react-helmet-async";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette } from "lucide-react";

export default function ThemeCustomizationPage() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Personnalisation du thème - G12 Paris</title>
        <meta name="description" content="Personnalisez le thème et les couleurs du site." />
      </Helmet>

      {/* Header */}
      <section className="bg-gradient-to-br from-purple-600 to-purple-800 text-white py-12">
        <div className="container">
          <div className="flex items-center gap-3 mb-2">
            <Palette className="w-6 h-6" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Personnalisation
            </span>
          </div>
          <h1 className="text-4xl font-serif font-bold mb-2">
            Thème et Couleurs
          </h1>
          <p className="text-purple-100 text-lg">
            Personnalisez l'apparence du site selon vos préférences
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <ThemeCustomizer />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">✨ Fonctionnalités</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-lg">🌓</span>
                  <span>Mode clair/sombre automatique ou manuel</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-lg">🎨</span>
                  <span>4 palettes de couleurs prédéfinies</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-lg">🎯</span>
                  <span>Personnalisation couleur par couleur</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-lg">💾</span>
                  <span>Sauvegarde automatique dans votre navigateur</span>
                </div>
              </CardContent>
            </Card>

            {/* Current Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">📋 Informations</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>
                  <p className="text-muted-foreground">Mode</p>
                  <p className="font-semibold">Voir les paramètres ci-dessus</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Palette</p>
                  <p className="font-semibold">Voir les paramètres ci-dessus</p>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">💡 Conseils</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div>
                  <p className="font-semibold mb-1">Mode Système</p>
                  <p className="text-muted-foreground">
                    Détecte automatiquement le mode clair/sombre de votre système
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Accès rapide</p>
                  <p className="text-muted-foreground">
                    Utilisez le sélecteur de thème dans le menu utilisateur
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
