import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "../lib/trpc";
import { useState } from "react";

export interface LayoutSection {
  id: string;
  type: "hero" | "articles" | "categories" | "trending" | "featured" | "custom";
  position: { row: number; col: number };
  size: { width: number; height: number };
  settings: Record<string, any>;
}

export interface LayoutConfig {
  sections: LayoutSection[];
  responsive?: {
    mobile?: { sections: LayoutSection[] };
    tablet?: { sections: LayoutSection[] };
  };
  theme?: {
    columns?: number;
    gap?: string;
    displayMode?: "cards" | "list" | "minimal";
  };
}

export interface UserLayout {
  id: string;
  userId: number;
  layoutName: string;
  layoutType: string;
  config: LayoutConfig;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function useLayoutPreferences() {
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);

  const layoutsQuery = trpc.personalization.getLayouts.useQuery();
  const activeLayoutQuery = trpc.personalization.getActiveLayout.useQuery();
  const templateQuery = trpc.personalization.getLayoutTemplates.useQuery();

  const createLayoutMutation = trpc.personalization.createLayout.useMutation({
    onSuccess: (data) => {
      layoutsQuery.refetch();
    },
  });

  const updateLayoutMutation = trpc.personalization.updateLayout.useMutation({
    onSuccess: () => {
      layoutsQuery.refetch();
    },
  });

  const setActiveLayoutMutation = trpc.personalization.setActiveLayout.useMutation({
    onSuccess: () => {
      activeLayoutQuery.refetch();
      layoutsQuery.refetch();
    },
  });

  const deleteLayoutMutation = trpc.personalization.deleteLayout.useMutation({
    onSuccess: () => {
      layoutsQuery.refetch();
    },
  });

  const applyTemplateMutation = trpc.personalization.applyTemplate.useMutation({
    onSuccess: (data) => {
      layoutsQuery.refetch();
      if (data) {
        setSelectedLayoutId(data.id);
      }
    },
  });

  return {
    layouts: layoutsQuery.data || [],
    activeLayout: activeLayoutQuery.data,
    templates: templateQuery.data || [],
    selectedLayoutId,
    setSelectedLayoutId,
    createLayout: createLayoutMutation.mutate,
    updateLayout: updateLayoutMutation.mutate,
    setActiveLayout: setActiveLayoutMutation.mutate,
    deleteLayout: deleteLayoutMutation.mutate,
    applyTemplate: applyTemplateMutation.mutate,
    isLoading:
      layoutsQuery.isLoading ||
      activeLayoutQuery.isLoading ||
      templateQuery.isLoading,
  };
}
