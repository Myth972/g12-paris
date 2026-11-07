#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Vite pré-bundle les paquets listés dans `optimizeDeps.include`, mais il doit
 * pouvoir les résoudre depuis la racine du projet Vite (`client/`). Un paquet
 * seulement transitif n'est pas hissé à la racine par pnpm : le serveur
 * affiche alors « Failed to resolve dependency: <pkg> » et la page reste
 * blanche.
 *
 * Ce contrôle échoue dès qu'une entrée de `optimizeDeps.include` n'est pas
 * déclarée dans package.json (dependencies, devDependencies,
 * optionalDependencies ou peerDependencies).
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_FILE = path.join(ROOT, "vite.config.ts");
const PACKAGE_FILE = path.join(ROOT, "package.json");

const DECLARATION_SECTIONS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

/** Extrait les entrées littérales du tableau `optimizeDeps.include`. */
export function extractOptimizeDepsInclude(configSource) {
  // Pas d'ancrage de ligne : la config peut écrire `optimizeDeps: { include:
  // [...] }` sur une seule ligne, et un ancrage rendrait alors le contrôle
  // silencieusement inopérant (faux vert).
  const blockStart = /\boptimizeDeps\s*:\s*\{/.exec(configSource);
  if (!blockStart) return [];

  const includeMatch = /include\s*:\s*\[([\s\S]*?)\]/.exec(
    configSource.slice(blockStart.index)
  );
  if (!includeMatch) return [];

  return [...includeMatch[1].matchAll(/["']([^"']+)["']/g)].map(
    match => match[1]
  );
}

/** "es-toolkit/compat" → "es-toolkit", "@scope/pkg/sub" → "@scope/pkg". */
export function toPackageName(entry) {
  const segments = entry.split("/");
  return entry.startsWith("@") ? segments.slice(0, 2).join("/") : segments[0];
}

export function findUndeclaredOptimizeDeps({ configSource, pkg }) {
  const checked = [
    ...new Set(extractOptimizeDepsInclude(configSource).map(toPackageName)),
  ];
  const declared = new Set(
    DECLARATION_SECTIONS.flatMap(section => Object.keys(pkg[section] ?? {}))
  );

  return {
    checked,
    missing: checked.filter(name => !declared.has(name)),
  };
}

const invokedDirectly =
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const pkg = JSON.parse(readFileSync(PACKAGE_FILE, "utf8"));
  const { checked, missing } = findUndeclaredOptimizeDeps({
    configSource: readFileSync(CONFIG_FILE, "utf8"),
    pkg,
  });

  if (missing.length > 0) {
    console.error(
      "optimizeDeps.include contient des paquets non déclarés :\n" +
        missing.map(name => `  - ${name}`).join("\n") +
        "\n\nAjoutez-les aux dépendances (pnpm add <pkg>) : un paquet" +
        " seulement transitif n'est pas résolu depuis client/ et Vite" +
        " échoue avec « Failed to resolve dependency »."
    );
    process.exit(1);
  }

  console.log(
    `optimizeDeps.include : ${checked.length} paquet(s) vérifié(s)` +
      (checked.length > 0 ? ` (${checked.join(", ")})` : "") +
      " — tous déclarés dans package.json."
  );
}
