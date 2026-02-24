'use client';

import React, { useState } from 'react';
import { LayoutConfig, LayoutSection } from '../../hooks/useLayoutPreferences';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LayoutPreview } from './LayoutPreview';
import { LayoutTemplates } from './LayoutTemplates';
import { Trash2, Plus, Save } from 'lucide-react';

interface LayoutEditorProps {
  initialConfig?: LayoutConfig;
  onSave: (config: LayoutConfig, layoutName: string) => void;
  onCancel: () => void;
  layoutName?: string;
  templateLibrary: any[];
}

export function LayoutEditor({
  initialConfig,
  onSave,
  onCancel,
  layoutName = 'Mon layout personnalisé',
  templateLibrary,
}: LayoutEditorProps) {
  const [config, setConfig] = useState<LayoutConfig>(
    initialConfig || {
      sections: [
        {
          id: 'hero',
          type: 'hero',
          position: { row: 0, col: 0 },
          size: { width: 12, height: 2 },
          settings: { displayMode: 'featured' },
        },
        {
          id: 'articles',
          type: 'articles',
          position: { row: 2, col: 0 },
          size: { width: 12, height: 6 },
          settings: {
            displayMode: 'cards',
            columns: 3,
            articlesPerPage: 12,
          },
        },
      ],
      theme: { columns: 12, gap: '1.5rem', displayMode: 'cards' },
    }
  );
  const [currentLayoutName, setCurrentLayoutName] = useState(layoutName);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);

  const addSection = () => {
    const newSection: LayoutSection = {
      id: `section-${Date.now()}`,
      type: 'articles',
      position: { row: config.sections.length, col: 0 },
      size: { width: 12, height: 4 },
      settings: { displayMode: 'cards', columns: 3, articlesPerPage: 9 },
    };
    setConfig({
      ...config,
      sections: [...config.sections, newSection],
    });
  };

  const removeSection = (id: string) => {
    setConfig({
      ...config,
      sections: config.sections.filter((s) => s.id !== id),
    });
  };

  const updateSection = (id: string, updates: Partial<LayoutSection>) => {
    setConfig({
      ...config,
      sections: config.sections.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    });
  };

  const updateTheme = (theme: Partial<LayoutConfig['theme']>) => {
    setConfig({
      ...config,
      theme: { ...config.theme, ...theme },
    });
  };

  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedSection) return;

    const draggedIndex = config.sections.findIndex((s) => s.id === draggedSection);
    if (draggedIndex === -1) return;

    const newSections = [...config.sections];
    const [draggedItem] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, draggedItem);

    setConfig({
      ...config,
      sections: newSections,
    });
    setDraggedSection(null);
  };

  return (
    <div className="grid grid-cols-2 gap-6 p-6">
      {/* Editor Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Éditor de Layout</CardTitle>
            <CardDescription>Personnalisez votre disposition</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nom du layout</Label>
              <Input
                value={currentLayoutName}
                onChange={(e) => setCurrentLayoutName(e.target.value)}
                placeholder="Mon layout personnalisé"
              />
            </div>

            <Tabs defaultValue="sections" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sections">Sections</TabsTrigger>
                <TabsTrigger value="theme">Thème</TabsTrigger>
              </TabsList>

              {/* Sections Tab */}
              <TabsContent value="sections" className="space-y-4 mt-4">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {config.sections.map((section, index) => (
                    <div
                      key={section.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, section.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className="p-3 border rounded-lg bg-gray-50 cursor-move hover:bg-gray-100 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-sm">{section.id}</h4>
                          <p className="text-xs text-gray-500">{section.type}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSection(section.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-gray-600">Largeur</label>
                          <Input
                            type="number"
                            min="1"
                            max="12"
                            value={section.size.width}
                            onChange={(e) =>
                              updateSection(section.id, {
                                size: {
                                  ...section.size,
                                  width: parseInt(e.target.value),
                                },
                              })
                            }
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600">Hauteur</label>
                          <Input
                            type="number"
                            min="1"
                            value={section.size.height}
                            onChange={(e) =>
                              updateSection(section.id, {
                                size: {
                                  ...section.size,
                                  height: parseInt(e.target.value),
                                },
                              })
                            }
                            className="text-xs"
                          />
                        </div>
                      </div>

                      {section.type === 'articles' && (
                        <div className="mt-2 pt-2 border-t space-y-2">
                          <div className="text-xs">
                            <label className="block text-gray-600">
                              Articles par page
                            </label>
                            <Input
                              type="number"
                              value={section.settings.articlesPerPage || 12}
                              onChange={(e) =>
                                updateSection(section.id, {
                                  settings: {
                                    ...section.settings,
                                    articlesPerPage: parseInt(e.target.value),
                                  },
                                })
                              }
                              className="text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Button onClick={addSection} className="w-full" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une section
                </Button>
              </TabsContent>

              {/* Theme Tab */}
              <TabsContent value="theme" className="space-y-4 mt-4">
                <div>
                  <Label>Mode d'affichage</Label>
                  <Select
                    value={config.theme?.displayMode || 'cards'}
                    onValueChange={(val: any) =>
                      updateTheme({ displayMode: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cards">Cartes</SelectItem>
                      <SelectItem value="list">Liste</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Colonnes</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={config.theme?.columns || 12}
                    onChange={(e) =>
                      updateTheme({ columns: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <Label>Écart (gap)</Label>
                  <Input
                    value={config.theme?.gap || '1.5rem'}
                    onChange={(e) => updateTheme({ gap: e.target.value })}
                    placeholder="ex: 1rem, 1.5rem, 2rem"
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => onSave(config, currentLayoutName)}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
              <Button onClick={onCancel} variant="outline" className="flex-1">
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Panel */}
      <div className="space-y-4">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle>Aperçu en temps réel</CardTitle>
          </CardHeader>
          <CardContent>
            <LayoutPreview config={config} />
          </CardContent>
        </Card>

        {/* Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <LayoutTemplates templates={templateLibrary} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
