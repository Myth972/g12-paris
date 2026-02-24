'use client';

import React from 'react';
import { LayoutConfig } from '../../hooks/useLayoutPreferences';
import { Grid, List, Minimize } from 'lucide-react';

interface LayoutPreviewProps {
  config: LayoutConfig;
}

export function LayoutPreview({ config }: LayoutPreviewProps) {
  const gap = config.theme?.gap || '1.5rem';
  const displayMode = config.theme?.displayMode || 'cards';

  const getDisplayIcon = () => {
    switch (displayMode) {
      case 'list':
        return <List className="w-4 h-4" />;
      case 'minimal':
        return <Minimize className="w-4 h-4" />;
      default:
        return <Grid className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 min-h-96">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
        {getDisplayIcon()}
        <span>
          {displayMode === 'cards' ? 'Mode Cartes' : displayMode === 'list' ? 'Mode Liste' : 'Mode Minimal'}
        </span>
      </div>

      {/* Grid Preview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${config.theme?.columns || 12}, 1fr)`,
          gap: gap,
        }}
        className="w-full"
      >
        {config.sections.map((section) => (
          <div
            key={section.id}
            style={{
              gridColumn: `span ${section.size.width}`,
              gridRow: `span ${section.size.height}`,
            }}
            className="bg-white border-2 border-dashed border-blue-300 rounded-lg p-3 min-h-12"
          >
            <div className="text-xs font-semibold text-blue-600 mb-1">
              {section.id}
            </div>
            <div className="text-xs text-gray-500 mb-2">
              {section.type === 'articles' ? '📰 Articles' : null}
              {section.type === 'hero' ? '🎯 Héro' : null}
              {section.type === 'categories' ? '📂 Catégories' : null}
              {section.type === 'trending' ? '🔥 Tendances' : null}
              {section.type === 'featured' ? '⭐ Recommandés' : null}
            </div>
            <div className="text-xs text-gray-400">
              {section.size.width}×{section.size.height}
            </div>

            {/* Simulate content */}
            <div className="mt-2 space-y-1">
              {displayMode === 'cards' && (
                <div className="space-y-1">
                  <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              )}
              {displayMode === 'list' && (
                <div className="space-y-1">
                  <div className="h-1 bg-gray-200 rounded"></div>
                  <div className="h-1 bg-gray-200 rounded w-3/4"></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Device Previews */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-600 mb-3">
          Responsif
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="bg-white border border-gray-300 rounded p-2 aspect-video flex items-center justify-center">
              <span className="text-xs text-gray-500">📱 Mobile</span>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white border border-gray-300 rounded p-2 aspect-video flex items-center justify-center">
              <span className="text-xs text-gray-500">📱 Tablette</span>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white border border-gray-300 rounded p-2 aspect-video flex items-center justify-center">
              <span className="text-xs text-gray-500">🖥️ Desktop</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
