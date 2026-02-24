'use client';

import React from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  layoutType: string;
  previewImage?: string;
}

interface LayoutTemplatesProps {
  templates: LayoutTemplate[];
  onSelectTemplate?: (templateId: string) => void;
}

export function LayoutTemplates({
  templates,
  onSelectTemplate,
}: LayoutTemplatesProps) {
  const getTemplateIcon = (layoutType: string) => {
    switch (layoutType) {
      case 'grid':
        return '📊';
      case 'list':
        return '📋';
      case 'magazine':
        return '📄';
      case 'timeline':
        return '📈';
      case 'custom':
        return '✨';
      default:
        return '📐';
    }
  };

  return (
    <div className="space-y-3">
      {templates.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          Aucun template disponible
        </p>
      ) : (
        templates.map((template) => (
          <Card key={template.id} className="p-3 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {getTemplateIcon(template.layoutType)}
                  </span>
                  <div>
                    <h4 className="font-semibold text-sm">{template.name}</h4>
                    <p className="text-xs text-gray-500">
                      {template.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {onSelectTemplate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSelectTemplate(template.id)}
                className="w-full text-xs"
              >
                Utiliser
              </Button>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
