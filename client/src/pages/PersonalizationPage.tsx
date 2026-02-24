'use client';

import React, { useState } from 'react';
import { useLayoutPreferences, LayoutSection } from '../hooks/useLayoutPreferences';
import { LayoutEditor, LayoutGallery, LayoutTemplates } from '../components/LayoutCustomizer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Palette, Settings } from 'lucide-react';
import { useRouter } from 'wouter';

export default function PersonalizationPage() {
  const router = useRouter();
  const [editingLayoutId, setEditingLayoutId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const {
    layouts,
    activeLayout,
    templates,
    createLayout,
    updateLayout,
    setActiveLayout,
    deleteLayout,
    applyTemplate,
    isLoading,
  } = useLayoutPreferences();

  const handleSaveLayout = (config: any, layoutName: string): void => {
    if (editingLayoutId) {
      updateLayout(
        { layoutId: editingLayoutId, config, layoutName },
        {
          onSuccess: () => {
            setEditingLayoutId(null);
          },
        }
      );
    } else {
      createLayout(
        {
          layoutName,
          layoutType: 'custom',
          config,
        },
        {
          onSuccess: () => {
            setIsCreatingNew(false);
          },
        }
      );
    }
  };

  const handleSelectLayout = (layoutId: string) => {
    setActiveLayout({ layoutId });
  };

  const handleEditLayout = (layoutId: string) => {
    setEditingLayoutId(layoutId);
  };

  const handleDeleteLayout = (layoutId: string) => {
    deleteLayout({ layoutId });
  };

  const handleApplyTemplate = (templateId: string) => {
    applyTemplate({ templateId });
  };

  if (isCreatingNew || editingLayoutId) {
    const editingLayout = layouts.find((l) => l.id === editingLayoutId);
    return (
      <LayoutEditor
        initialConfig={editingLayout?.config}
        layoutName={editingLayout?.layoutName}
        onSave={handleSaveLayout}
        onCancel={() => {
          setIsCreatingNew(false);
          setEditingLayoutId(null);
        }}
        templateLibrary={templates}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Personnalisation du Site
            </h1>
          </div>
          <p className="text-gray-600">
            Créez et gérez vos layouts personnalisés. Arranez les sections à votre guise avec drag-and-drop.
          </p>
        </div>

        <Tabs defaultValue="layouts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="layouts">Mes Layouts</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="current">Layout Actif</TabsTrigger>
          </TabsList>

          {/* Layouts Tab */}
          <TabsContent value="layouts" className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Mes Configurations
              </h2>
              <Button
                onClick={() => setIsCreatingNew(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Palette className="w-4 h-4 mr-2" />
                Créer un nouveau layout
              </Button>
            </div>

            {isLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">Chargement...</p>
                </CardContent>
              </Card>
            ) : (
              <LayoutGallery
                layouts={layouts}
                activeLayoutId={activeLayout?.id}
                onSelectLayout={handleSelectLayout}
                onEditLayout={handleEditLayout}
                onDeleteLayout={handleDeleteLayout}
              />
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Templates Prédéfinis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {template.name}
                      </CardTitle>
                      <CardDescription>
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => handleApplyTemplate(template.id)}
                        className="w-full"
                      >
                        Utiliser ce template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Current Layout Tab */}
          <TabsContent value="current" className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Layout Actif
            </h2>
            {activeLayout ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {('layoutName' in activeLayout && activeLayout.layoutName) || 
                         ('name' in activeLayout && activeLayout.name) || 
                         'Sans titre'}
                      </CardTitle>
                      <CardDescription>
                        Type: {activeLayout.layoutType}
                      </CardDescription>
                    </div>
                    <Settings className="w-6 h-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Sections ({activeLayout.config.sections.length})
                    </h3>
                    <div className="space-y-2">
                      {activeLayout.config.sections.map((section: LayoutSection) => (
                        <div
                          key={section.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {section.id}
                            </p>
                            <p className="text-sm text-gray-500">
                              {section.type} - {section.size.width}×
                              {section.size.height}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Thème
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                      <p>Mode: {activeLayout.config.theme?.displayMode}</p>
                      <p>Colonnes: {activeLayout.config.theme?.columns}</p>
                      <p>Gap: {activeLayout.config.theme?.gap}</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleEditLayout(activeLayout.id)}
                    className="w-full"
                  >
                    <Palette className="w-4 h-4 mr-2" />
                    Éditer ce layout
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500 py-8">
                    Aucun layout actif. Sélectionnez-en un dans "Mes Layouts".
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
