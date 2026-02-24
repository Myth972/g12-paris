/**
 * Typography Customization Page
 */

import { Helmet } from "react-helmet-async";
import { TypographyCustomizer } from "@/components/TypographyCustomizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Type } from "lucide-react";

export default function TypographyCustomizationPage() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Personnalisation de la typographie - G12 Paris</title>
        <meta name="description" content="Personnalisez les polices et la typographie du site." />
      </Helmet>

      {/* Header */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12">
        <div className="container">
          <div className="flex items-center gap-3 mb-2">
            <Type className="w-6 h-6" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Personnalisation
            </span>
          </div>
          <h1 className="text-4xl font-serif font-bold mb-2">
            Typographie
          </h1>
          <p className="text-blue-100 text-lg">
            Personnalisez les polices, tailles et espacements du texte
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <TypographyCustomizer />
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
                  <span className="text-lg">📝</span>
                  <span>Polices Google Fonts</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-lg">📏</span>
                  <span>Contrôle de la taille</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-lg">📐</span>
                  <span>Hauteur de ligne ajustable</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-lg">🎯</span>
                  <span>Échelle de titres modulaire</span>
                </div>
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">📋 Recommandations</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div>
                  <p className="font-semibold mb-1">Taille de base</p>
                  <p className="text-muted-foreground">
                    16px pour écrans standards
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Hauteur de ligne</p>
                  <p className="text-muted-foreground">
                    1.6 pour une bonne lisibilité
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Échelle</p>
                  <p className="text-muted-foreground">
                    1.25 pour hiérarchie claire
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">💡 Conseils</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p className="text-muted-foreground">
                  Testez vos changements sur différentes tailles d'écran pour assurer une bonne lisibilité.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
