import { createdBundledHighlighter } from "@shikijs/core";

const bundledLanguages = {
  bash: () => import("@shikijs/langs/bash"),
  css: () => import("@shikijs/langs/css"),
  diff: () => import("@shikijs/langs/diff"),
  html: () => import("@shikijs/langs/html"),
  ini: () => import("@shikijs/langs/ini"),
  javascript: () => import("@shikijs/langs/javascript"),
  jsx: () => import("@shikijs/langs/jsx"),
  json: () => import("@shikijs/langs/json"),
  markdown: () => import("@shikijs/langs/markdown"),
  mermaid: () => import("@shikijs/langs/mermaid"),
  python: () => import("@shikijs/langs/python"),
  sql: () => import("@shikijs/langs/sql"),
  shell: () => import("@shikijs/langs/shell"),
  tsx: () => import("@shikijs/langs/tsx"),
  typescript: () => import("@shikijs/langs/typescript"),
  yaml: () => import("@shikijs/langs/yaml"),
};

const bundledThemes = {
  "github-light": () => import("@shikijs/themes/github-light"),
  "github-dark": () => import("@shikijs/themes/github-dark"),
};

export { bundledLanguages, bundledThemes };

const createHighlighter = createdBundledHighlighter({
  langs: bundledLanguages,
  themes: bundledThemes,
  engine: () =>
    import("@shikijs/engine-javascript").then((m) =>
      m.createJavaScriptRegexEngine({ forgiving: true }),
    ),
});

export { createHighlighter };
