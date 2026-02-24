import { LayoutConfig } from "./layout-manager";

export const LAYOUT_PRESETS = {
  grid: {
    id: "grid-3-cols",
    name: "Grid (3 Colonnes)",
    description: "Layout classique en grille 3 colonnes avec hero en haut",
    layoutType: "grid",
    config: {
      sections: [
        {
          id: "hero",
          type: "hero",
          position: { row: 0, col: 0 },
          size: { width: 12, height: 3 },
          settings: {
            displayMode: "featured",
            articlesPerPage: 1,
          },
        },
        {
          id: "articles-grid",
          type: "articles",
          position: { row: 3, col: 0 },
          size: { width: 12, height: 10 },
          settings: {
            displayMode: "cards",
            columns: 3,
            articlesPerPage: 12,
            sortBy: "recommended",
          },
        },
      ],
      responsive: {
        mobile: {
          sections: [
            {
              id: "hero",
              type: "hero",
              position: { row: 0, col: 0 },
              size: { width: 4, height: 3 },
              settings: { displayMode: "featured" },
            },
            {
              id: "articles-list",
              type: "articles",
              position: { row: 3, col: 0 },
              size: { width: 4, height: 10 },
              settings: {
                displayMode: "list",
                columns: 1,
                articlesPerPage: 5,
              },
            },
          ],
        },
      },
      theme: {
        columns: 3,
        gap: "1.5rem",
        displayMode: "cards",
      },
    } as LayoutConfig,
  },

  list: {
    id: "list-view",
    name: "Vue Linéaire",
    description: "Layout linéaire avec images et descriptions",
    layoutType: "list",
    config: {
      sections: [
        {
          id: "hero",
          type: "hero",
          position: { row: 0, col: 0 },
          size: { width: 12, height: 3 },
          settings: { displayMode: "featured" },
        },
        {
          id: "articles-list",
          type: "articles",
          position: { row: 3, col: 0 },
          size: { width: 12, height: 10 },
          settings: {
            displayMode: "list",
            columns: 1,
            articlesPerPage: 15,
            sortBy: "recommended",
          },
        },
      ],
      responsive: {
        mobile: {
          sections: [
            {
              id: "hero",
              type: "hero",
              position: { row: 0, col: 0 },
              size: { width: 4, height: 2 },
              settings: { displayMode: "featured" },
            },
            {
              id: "articles-list",
              type: "articles",
              position: { row: 2, col: 0 },
              size: { width: 4, height: 10 },
              settings: {
                displayMode: "list",
                columns: 1,
                articlesPerPage: 10,
              },
            },
          ],
        },
      },
      theme: {
        columns: 1,
        gap: "1rem",
        displayMode: "list",
      },
    } as LayoutConfig,
  },

  magazine: {
    id: "magazine-layout",
    name: "Magazine (Asymétrique)",
    description: "Layout magazine avec article large + sidebar",
    layoutType: "magazine",
    config: {
      sections: [
        {
          id: "hero",
          type: "hero",
          position: { row: 0, col: 0 },
          size: { width: 12, height: 2 },
          settings: { displayMode: "featured" },
        },
        {
          id: "articles-main",
          type: "articles",
          position: { row: 2, col: 0 },
          size: { width: 8, height: 8 },
          settings: {
            displayMode: "cards",
            columns: 2,
            articlesPerPage: 8,
            sortBy: "recommended",
          },
        },
        {
          id: "trending",
          type: "trending",
          position: { row: 2, col: 8 },
          size: { width: 4, height: 8 },
          settings: {
            displayMode: "minimal",
            articlesPerPage: 5,
          },
        },
        {
          id: "categories",
          type: "categories",
          position: { row: 10, col: 0 },
          size: { width: 12, height: 2 },
          settings: {
            displayMode: "list",
          },
        },
      ],
      responsive: {
        mobile: {
          sections: [
            {
              id: "hero",
              type: "hero",
              position: { row: 0, col: 0 },
              size: { width: 4, height: 2 },
              settings: { displayMode: "featured" },
            },
            {
              id: "articles-main",
              type: "articles",
              position: { row: 2, col: 0 },
              size: { width: 4, height: 6 },
              settings: { displayMode: "list", columns: 1, articlesPerPage: 5 },
            },
            {
              id: "trending",
              type: "trending",
              position: { row: 8, col: 0 },
              size: { width: 4, height: 4 },
              settings: {
                displayMode: "minimal",
                articlesPerPage: 3,
              },
            },
          ],
        },
      },
      theme: {
        columns: 12,
        gap: "1.5rem",
        displayMode: "cards",
      },
    } as LayoutConfig,
  },

  timeline: {
    id: "timeline-layout",
    name: "Timeline (Chronologique)",
    description: "Vue chronologique des articles avec timeline verticale",
    layoutType: "timeline",
    config: {
      sections: [
        {
          id: "hero",
          type: "hero",
          position: { row: 0, col: 0 },
          size: { width: 12, height: 2 },
          settings: { displayMode: "featured" },
        },
        {
          id: "articles-timeline",
          type: "articles",
          position: { row: 2, col: 0 },
          size: { width: 12, height: 10 },
          settings: {
            displayMode: "minimal",
            columns: 1,
            articlesPerPage: 20,
            sortBy: "date",
          },
        },
      ],
      responsive: {
        mobile: {
          sections: [
            {
              id: "hero",
              type: "hero",
              position: { row: 0, col: 0 },
              size: { width: 4, height: 2 },
              settings: { displayMode: "featured" },
            },
            {
              id: "articles-timeline",
              type: "articles",
              position: { row: 2, col: 0 },
              size: { width: 4, height: 10 },
              settings: {
                displayMode: "minimal",
                columns: 1,
                articlesPerPage: 15,
              },
            },
          ],
        },
      },
      theme: {
        columns: 1,
        gap: "2rem",
        displayMode: "minimal",
      },
    } as LayoutConfig,
  },

  compact: {
    id: "compact-layout",
    name: "Compact (Minimal)",
    description: "Layout minimaliste avec focus sur le contenu",
    layoutType: "custom",
    config: {
      sections: [
        {
          id: "hero",
          type: "hero",
          position: { row: 0, col: 0 },
          size: { width: 12, height: 2 },
          settings: { displayMode: "featured" },
        },
        {
          id: "articles",
          type: "articles",
          position: { row: 2, col: 0 },
          size: { width: 12, height: 8 },
          settings: {
            displayMode: "minimal",
            columns: 2,
            articlesPerPage: 10,
            sortBy: "recommended",
          },
        },
      ],
      responsive: {
        mobile: {
          sections: [
            {
              id: "hero",
              type: "hero",
              position: { row: 0, col: 0 },
              size: { width: 4, height: 2 },
              settings: { displayMode: "featured" },
            },
            {
              id: "articles",
              type: "articles",
              position: { row: 2, col: 0 },
              size: { width: 4, height: 6 },
              settings: {
                displayMode: "list",
                columns: 1,
                articlesPerPage: 5,
              },
            },
          ],
        },
      },
      theme: {
        columns: 2,
        gap: "1rem",
        displayMode: "minimal",
      },
    } as LayoutConfig,
  },
};

export const LAYOUT_TEMPLATES = Object.values(LAYOUT_PRESETS);
