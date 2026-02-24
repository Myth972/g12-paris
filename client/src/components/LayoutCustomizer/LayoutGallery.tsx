'use client';

import React, { useState } from 'react';
import { UserLayout } from '../../hooks/useLayoutPreferences';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Trash2, Edit, Check } from 'lucide-react';

interface LayoutGalleryProps {
  layouts: UserLayout[];
  activeLayoutId?: string;
  onSelectLayout: (layoutId: string) => void;
  onEditLayout: (layoutId: string) => void;
  onDeleteLayout: (layoutId: string) => void;
}

export function LayoutGallery({
  layouts,
  activeLayoutId,
  onSelectLayout,
  onEditLayout,
  onDeleteLayout,
}: LayoutGalleryProps) {
  const [confirming, setConfirming] = useState<string | null>(null);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      grid: 'Grille',
      list: 'Liste',
      magazine: 'Magazine',
      timeline: 'Timeline',
      custom: 'Personnalisé',
    };
    return labels[type] || type;
  };

  if (layouts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500 py-8">
            Aucun layout personnalisé. Créez-en un maintenant !
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {layouts.map((layout) => (
        <Card
          key={layout.id}
          className={`transition-all ${
            activeLayoutId === layout.id
              ? 'ring-2 ring-blue-500 shadow-lg'
              : 'hover:shadow-md'
          }`}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base">{layout.layoutName}</CardTitle>
                <CardDescription>
                  {getTypeLabel(layout.layoutType)}
                </CardDescription>
              </div>
              {activeLayoutId === layout.id && (
                <Badge className="bg-green-500">
                  <Check className="w-3 h-3 mr-1" />
                  Actif
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Layout Preview Mini */}
            <div className="bg-gray-50 rounded p-3 min-h-24">
              <div className="text-xs text-gray-500 mb-2">
                {layout.config.sections.length} sections
              </div>
              <div className="space-y-1">
                {layout.config.sections.slice(0, 3).map((section) => (
                  <div
                    key={section.id}
                    className="h-2 bg-blue-200 rounded w-full"
                  ></div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>Créé: {new Date(layout.createdAt).toLocaleDateString('fr')}</p>
              <p>
                Modifié:{' '}
                {new Date(layout.updatedAt).toLocaleDateString('fr')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {activeLayoutId !== layout.id && (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => onSelectLayout(layout.id)}
                >
                  Utiliser
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onEditLayout(layout.id)}
              >
                <Edit className="w-3 h-3 mr-1" />
                Éditer
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-700"
                onClick={() => setConfirming(layout.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            {confirming === layout.id && (
              <div className="border-t pt-3">
                <p className="text-xs text-gray-600 mb-2">
                  Confirmer la suppression ?
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      onDeleteLayout(layout.id);
                      setConfirming(null);
                    }}
                  >
                    Supprimer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setConfirming(null)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
