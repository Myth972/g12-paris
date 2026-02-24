'use client';

import React, { useState } from 'react';
import { SimpleLayoutCustomizer } from '../components/SimpleLayoutCustomizer';
import { useLayoutPreferences } from '../hooks/useLayoutPreferences';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Trash2, Star } from 'lucide-react';

export default function PersonalizationPageSimple() {
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const {
    layouts,
    activeLayout,
    createLayout,
    setActiveLayout,
    deleteLayout,
    isLoading,
  } = useLayoutPreferences();

  const handleSaveLayout = (layoutName: string, templateId: string, options: any) => {
    createLayout(
      {
        layoutName,
        layoutType: templateId,
        config: {
          sections: [],
          theme: {
            displayMode: options.displayMode,
            columns: options.columns,
            articlesPerPage: options.articlesPerPage,
          },
        },
      },
      {
        onSuccess: () => {
          setIsCreatingNew(false);
        },
      }
    );
  };

  const handleSelectLayout = (layoutId: string) => {
    setActiveLayout({ layoutId });
  };

  const handleDeleteLayout = (layoutId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce layout?')) {
      deleteLayout({ layoutId });
    }
  };

  // Mode création
  if (isCreatingNew) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-2">Créer un nouvel layout</h1>
        <p className="text-gray-600 mb-6">
          Suivez les 4 étapes simples ci-dessous pour créer votre layout personnalisé
        </p>
        <SimpleLayoutCustomizer
          onSave={handleSaveLayout}
          onCancel={() => setIsCreatingNew(false)}
          isLoading={isLoading}
        />
      </div>
    );
  }

  // Mode affichage
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mes Layouts</h1>
        <p className="text-gray-600">
          Créez et gérez vos mises en page personnalisées pour l'accueil
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="my-layouts" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-2">
          <TabsTrigger value="my-layouts">
            📋 Mes Layouts ({layouts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="info">ℹ️ Info & Aide</TabsTrigger>
        </TabsList>

        {/* Tab: Mes Layouts */}
        <TabsContent value="my-layouts" className="space-y-6 mt-6">
          {/* Bouton créer */}
          <Button
            onClick={() => setIsCreatingNew(true)}
            size="lg"
            className="w-full md:w-auto"
          >
            + Créer un nouveau layout
          </Button>

          {/* Liste layouts */}
          {layouts && layouts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {layouts && layouts.map((layout: any) => (
                <Card
                  key={layout.id}
                  className={`cursor-pointer transition-all ${
                    activeLayout?.id === layout.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{layout.name}</CardTitle>
                        <CardDescription className="mt-1">
                          Type: <span className="font-semibold capitalize">{layout.type}</span>
                        </CardDescription>
                      </div>
                      {activeLayout?.id === layout.id && (
                        <div className="text-yellow-500">
                          <Star className="w-5 h-5 fill-current" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Info layout */}
                      {layout.config?.theme && (
                        <div className="text-sm space-y-2 bg-gray-50 p-3 rounded-lg">
                          <div>
                            📺 Affichage:{' '}
                            <span className="font-semibold capitalize">
                              {layout.config.theme.displayMode || 'cards'}
                            </span>
                          </div>
                          <div>
                            📐 Colonnes:{' '}
                            <span className="font-semibold">
                              {layout.config.theme.columns || 3}
                            </span>
                          </div>
                          <div>
                            📄 Articles/page:{' '}
                            <span className="font-semibold">
                              {layout.config.theme.articlesPerPage || 12}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Boutons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSelectLayout(layout.id)}
                          variant={activeLayout?.id === layout.id ? 'default' : 'outline'}
                          className="flex-1"
                          disabled={isLoading}
                        >
                          {activeLayout?.id === layout.id ? '✓ Actif' : 'Utiliser'}
                        </Button>
                        <Button
                          onClick={() => handleDeleteLayout(layout.id)}
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:bg-red-50"
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Créé le */}
                      <div className="text-xs text-gray-500 pt-2 border-t">
                        Créé le: {new Date(layout.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold mb-2">Aucun layout créé</h3>
              <p className="text-gray-600 mb-4">
                Commencez par créer votre premier layout personnalisé
              </p>
              <Button onClick={() => setIsCreatingNew(true)}>Créer mon premier layout</Button>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Info */}
        <TabsContent value="info" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Qu'est-ce qu'un Layout?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Un layout est une mise en page personnalisée pour l'accueil. Il vous permet de
                choisir:
              </p>
              <ul className="space-y-2 list-disc list-inside text-gray-700">
                <li>
                  <strong>Template:</strong> La disposition générale (Grille, Liste, Magazine,
                  Timeline)
                </li>
                <li>
                  <strong>Affichage:</strong> Comment les articles sont présentés (cartes, liste,
                  minimal)
                </li>
                <li>
                  <strong>Colonnes:</strong> Le nombre de colonnes (1 à 4)
                </li>
                <li>
                  <strong>Articles:</strong> Combien d'articles afficher par page
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comment créer un layout?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 list-decimal list-inside text-gray-700">
                <li>
                  Cliquez sur <strong>"Créer un nouveau layout"</strong>
                </li>
                <li>
                  Donnez un <strong>nom</strong> mémorable
                </li>
                <li>
                  Choisissez un <strong>template</strong> de départ
                </li>
                <li>
                  Personnalisez les <strong>options simples</strong> (affichage, colonnes, etc)
                </li>
                <li>
                  Cliquez sur <strong>"Créer mon layout"</strong>
                </li>
              </ol>
              <p className="text-sm text-gray-600 pt-4 italic">
                ⏱️ Le processus entier prend environ 2 minutes!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conseils & Astuces</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <strong>💡 Affichage:</strong>
                <p className="text-sm text-gray-600 mt-1">
                  "Cartes" pour des articles visuels, "Liste" pour du texte, "Minimal" pour très
                  rapide
                </p>
              </div>
              <div>
                <strong>📐 Colonnes:</strong>
                <p className="text-sm text-gray-600 mt-1">
                  3 colonnes est l'équilibre idéal. 1 pour mobile, 4 pour grand écran
                </p>
              </div>
              <div>
                <strong>📄 Articles/page:</strong>
                <p className="text-sm text-gray-600 mt-1">
                  12 articles est recommandé. Plus = plus de défilement
                </p>
              </div>
              <div>
                <strong>🌟 Layouts multiples:</strong>
                <p className="text-sm text-gray-600 mt-1">
                  Créez plusieurs layouts pour différents usages (travail, lecture, navigation rapide)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Mode Avancé (Futur)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800">
              <p>
                Bientôt disponible: drag-and-drop, thèmes couleurs personnalisés, animations, et
                bien plus! Pour l'instant, ce mode simple est parfait pour commencer. 😊
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
