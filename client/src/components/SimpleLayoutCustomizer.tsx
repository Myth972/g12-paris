'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface SimpleLayoutCustomizerProps {
  onSave: (layoutName: string, templateId: string, options: SimpleOptions) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  initialValues?: {
    layoutName?: string;
    templateId?: string;
    options?: SimpleOptions;
  };
}

interface SimpleOptions {
  displayMode: 'cards' | 'list' | 'minimal';
  columns: 1 | 2 | 3 | 4;
  articlesPerPage: 6 | 12 | 24;
}

const TEMPLATES = [
  { id: 'grid', name: '📊 Grille', description: 'Disposition en grille moderne' },
  { id: 'list', name: '📝 Liste', description: 'Affichage en liste compacte' },
  { id: 'magazine', name: '📰 Magazine', description: 'Style journal avec grandes images' },
  { id: 'timeline', name: '⏰ Timeline', description: 'Fil chronologique' },
];

export function SimpleLayoutCustomizer({
  onSave,
  onCancel,
  isLoading = false,
  initialValues,
}: SimpleLayoutCustomizerProps) {
  const [layoutName, setLayoutName] = useState(initialValues?.layoutName || 'Mon Layout');
  const [selectedTemplate, setSelectedTemplate] = useState(initialValues?.templateId || 'grid');
  const [options, setOptions] = useState<SimpleOptions>(
    initialValues?.options || {
      displayMode: 'cards',
      columns: 3,
      articlesPerPage: 12,
    }
  );
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!layoutName.trim()) {
      setError('Le nom du layout est requis');
      return;
    }
    setError(null);
    onSave(layoutName, selectedTemplate, options);
  };

  const handleDisplayModeChange = (value: string) => {
    setOptions({
      ...options,
      displayMode: value as 'cards' | 'list' | 'minimal',
    });
  };

  const handleColumnsChange = (value: string) => {
    setOptions({
      ...options,
      columns: parseInt(value) as 1 | 2 | 3 | 4,
    });
  };

  const handleArticlesPerPageChange = (value: string) => {
    setOptions({
      ...options,
      articlesPerPage: parseInt(value) as 6 | 12 | 24,
    });
  };

  const selectedTemplateData = TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Erreur */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ÉTAPE 1: Nom du layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">1️⃣</span>
            Nom de votre layout
          </CardTitle>
          <CardDescription>
            Donnez un nom unique et mémorable à votre nouvelle mise en page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="layout-name">Nom</Label>
            <Input
              id="layout-name"
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="Ex: Mon layout personnel"
              disabled={isLoading}
              className="text-base"
            />
            <p className="text-sm text-gray-500">
              Exemples: "Accueil simplifié", "Mode lecture", "Dashboard personnel"
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ÉTAPE 2: Sélectionner template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">2️⃣</span>
            Choisir un template
          </CardTitle>
          <CardDescription>
            Sélectionnez un modèle de départ (vous pourrez le personnaliser)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                disabled={isLoading}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">{template.name}</div>
                <div className="text-sm text-gray-600">{template.description}</div>
                {selectedTemplate === template.id && (
                  <div className="mt-2 flex items-center gap-1 text-blue-600 text-sm font-medium">
                    <Check className="w-4 h-4" /> Sélectionné
                  </div>
                )}
              </button>
            ))}
          </div>
          {selectedTemplateData && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                <strong>Template choisi:</strong> {selectedTemplateData.name}
              </p>
              <p className="text-sm text-gray-600 mt-1">{selectedTemplateData.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ÉTAPE 3: Options simples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">3️⃣</span>
            Personnaliser les options
          </CardTitle>
          <CardDescription>
            Ajustez quelques options simples pour votre layout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Affichage */}
          <div className="space-y-3">
            <Label htmlFor="display-mode" className="text-base font-semibold">
              📸 Affichage des articles
            </Label>
            <Select value={options.displayMode} onValueChange={handleDisplayModeChange}>
              <SelectTrigger id="display-mode" disabled={isLoading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cards">Cartes (avec image grande)</SelectItem>
                <SelectItem value="list">Liste (texte + petite image)</SelectItem>
                <SelectItem value="minimal">Minimal (titre seulement)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              {options.displayMode === 'cards' && '✓ Grande image + titre + description'}
              {options.displayMode === 'list' && '✓ Petite image + titre + description courte'}
              {options.displayMode === 'minimal' && '✓ Titre seul, très compact'}
            </p>
          </div>

          {/* Colonnes */}
          <div className="space-y-3">
            <Label htmlFor="columns" className="text-base font-semibold">
              📐 Nombre de colonnes
            </Label>
            <Select value={options.columns.toString()} onValueChange={handleColumnsChange}>
              <SelectTrigger id="columns" disabled={isLoading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 colonne (pleine largeur)</SelectItem>
                <SelectItem value="2">2 colonnes</SelectItem>
                <SelectItem value="3">3 colonnes (recommandé)</SelectItem>
                <SelectItem value="4">4 colonnes</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              ✓ Plus de colonnes = plus articles visibles mais plus petit
            </p>
          </div>

          {/* Nombre articles */}
          <div className="space-y-3">
            <Label htmlFor="articles-per-page" className="text-base font-semibold">
              📄 Articles par page
            </Label>
            <Select
              value={options.articlesPerPage.toString()}
              onValueChange={handleArticlesPerPageChange}
            >
              <SelectTrigger id="articles-per-page" disabled={isLoading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 articles (moins de défilement)</SelectItem>
                <SelectItem value="12">12 articles (équilibré)</SelectItem>
                <SelectItem value="24">24 articles (beaucoup de contenu)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              ✓ Plus d'articles = page plus longue, moins de pagination
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ÉTAPE 4: Résumé */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">4️⃣</span>
            Résumé de votre layout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-blue-200">
              <span className="font-semibold text-gray-700">Nom:</span>
              <span className="text-gray-900 font-medium">{layoutName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-blue-200">
              <span className="font-semibold text-gray-700">Template:</span>
              <span className="text-gray-900 font-medium">
                {selectedTemplateData?.name || 'Non sélectionné'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-blue-200">
              <span className="font-semibold text-gray-700">Affichage:</span>
              <span className="text-gray-900 font-medium capitalize">
                {options.displayMode}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-blue-200">
              <span className="font-semibold text-gray-700">Colonnes:</span>
              <span className="text-gray-900 font-medium">{options.columns}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-semibold text-gray-700">Articles/page:</span>
              <span className="text-gray-900 font-medium">{options.articlesPerPage}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Boutons d'action */}
      <div className="flex gap-3 justify-center pb-6">
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            size="lg"
            disabled={isLoading}
            className="min-w-[150px]"
          >
            ← Annuler
          </Button>
        )}
        <Button
          onClick={handleSave}
          size="lg"
          disabled={isLoading}
          className="min-w-[150px]"
        >
          {isLoading ? '⏳ Création...' : '✅ Créer mon layout'}
        </Button>
      </div>

      {/* Info helper */}
      <div className="text-center text-sm text-gray-500 pb-4">
        💡 Vous pourrez modifier ces options plus tard ou essayer un layout différent
      </div>
    </div>
  );
}
