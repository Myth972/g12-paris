#!/usr/bin/env node
/**
 * Contrôle de dérive documentaire.
 *
 * La documentation (AGENTS.md, README.md, AGENTS-System.md) annonce des
 * versions de paquets et des comptages (pages, composants, tables, procédures
 * tRPC, lignes de routers.ts). Ces valeurs se périment en silence : une montée
 * de version ou l'ajout d'une table ne casse aucun build, donc personne ne
 * s'en aperçoit avant qu'un nouvel arrivant ne suive une consigne fausse.
 *
 * Ce script confronte chaque affirmation à la réalité du dépôt et sort en
 * erreur (code 1) dès qu'un écart est détecté, ce qui le rend utilisable en
 * CI (`pnpm run check:docs`). Il ne réécrit rien : il signale.
 *
 * Les versions installées sont lues dans `node_modules` (source de vérité),
 * avec repli sur la version déclarée dans package.json si le paquet est
 * absent. Une affirmation dont le motif est introuvable est signalée comme
 * telle : une doc reformulée ne doit pas produire un faux vert.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = rel => readFileSync(path.join(ROOT, rel), "utf8");

const DOC = {
  "AGENTS.md": read("AGENTS.md"),
  "README.md": read("README.md"),
  "AGENTS-System.md": read("AGENTS-System.md"),
};

const pkg = JSON.parse(read("package.json"));
const DECLARED = {
  ...pkg.peerDependencies,
  ...pkg.optionalDependencies,
  ...pkg.devDependencies,
  ...pkg.dependencies,
};

/** Version réellement installée, sinon version déclarée sans opérateur. */
function installedVersion(name) {
  const manifest = path.join(ROOT, "node_modules", name, "package.json");
  if (existsSync(manifest)) {
    try {
      return JSON.parse(readFileSync(manifest, "utf8")).version;
    } catch {
      // Manifeste illisible : on retombe sur la déclaration.
    }
  }
  return DECLARED[name]?.replace(/^[\^~>=<\s]+/, "") ?? null;
}

/** « v5 (strict) » → « 5 » ; « 3.x » conservé tel quel. */
function normalizeDocVersion(raw) {
  return raw
    .replace(/\([^)]*\)/g, "")
    .trim()
    .replace(/^v/i, "");
}

/**
 * La doc peut n'annoncer qu'un préfixe (« 19 » pour 19.3.1) : on compare
 * segment par segment, `x` servant de joker. Un préfixe plus court que la
 * version réelle est donc accepté, un segment différent ne l'est pas.
 */
function versionMatches(docVersion, realVersion) {
  if (!realVersion) return null;
  const doc = normalizeDocVersion(docVersion)
    .split(".")
    .map(part => part.trim());
  const real = String(realVersion).split(".");
  return doc.every((segment, i) => {
    if (segment.toLowerCase() === "x") return true;
    return segment === (real[i] ?? "").trim();
  });
}

/** Technologie du tableau → paquet(s) npm à contrôler. */
const TECHNO_TO_PACKAGES = {
  React: ["react"],
  Vite: ["vite"],
  "Tailwind CSS": ["tailwindcss"],
  Wouter: ["wouter"],
  "TanStack Query + tRPC": ["@tanstack/react-query", "@trpc/client"],
  "React Hook Form + Zod": ["react-hook-form", "zod"],
  TipTap: ["@tiptap/react"],
  "Framer Motion": ["framer-motion"],
  i18next: ["i18next"],
  tRPC: ["@trpc/server"],
  "Drizzle ORM": ["drizzle-orm"],
  Resend: ["resend"],
  Vitest: ["vitest"],
  Playwright: ["@playwright/test"],
  TypeScript: ["typescript"],
};

/** Extrait les lignes du tableau « ## Stack Technique » d'AGENTS.md. */
function parseStackTable(source) {
  const section = /##\s+Stack Technique([\s\S]*?)\n##\s/.exec(source)?.[1];
  if (!section) return [];
  return [...section.matchAll(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/gm)]
    .map(m => ({ couche: m[1], techno: m[2], version: m[3] }))
    .filter(row => !/^-+$/.test(row.version) && row.techno !== "Technologie");
}

/** Compte les fichiers d'un dossier pour une ou plusieurs extensions. */
function countFiles(dir, extensions) {
  const abs = path.join(ROOT, dir);
  if (!existsSync(abs)) return null;
  return readdirSync(abs, { withFileTypes: true }).filter(
    entry =>
      entry.isFile() &&
      extensions.some(ext => entry.name.endsWith(ext)) &&
      !/\.(test|spec)\.[cm]?[jt]sx?$/.test(entry.name)
  ).length;
}

const routersSource = read("server/routers.ts");
const counts = {
  pages: countFiles("client/src/pages", [".tsx"]),
  components: countFiles("client/src/components", [".tsx"]),
  uiComponents: countFiles("client/src/components/ui", [".tsx"]),
  hooks: countFiles("client/src/hooks", [".ts", ".tsx"]),
  tables: (read("drizzle/schema.ts").match(/sqliteTable\(/g) || []).length,
  routers: (routersSource.match(/^ {2}[A-Za-z][\w]*: router\(/gm) || []).length,
  // On compte les procédures réellement exposées (`publicProcedure`,
  // `editeurProcedure`…), pas la fabrique `createRoleProcedure`.
  procedures: (
    routersSource.match(
      /(?:public|protected|admin|editeur|bibliotheque|adminOnly)Procedure\b/g
    ) || []
  ).length,
  // Sans la ligne vide finale, sinon le compte est systématiquement +1.
  routerLines: routersSource.replace(/\r?\n$/, "").split(/\r?\n/).length,
};

/**
 * Affirmations de comptage. `group` cible la capture à lire quand le motif en
 * contient plusieurs ; `approximate` applique la tolérance des « ~ ».
 */
const COUNT_CHECKS = [
  { file: "AGENTS.md", label: "pages", pattern: /Pages \((\d+) fichiers?\)/, actual: counts.pages },
  { file: "AGENTS.md", label: "composants métier", pattern: /Composants métier \((\d+) fichiers?\)/, actual: counts.components },
  { file: "AGENTS.md", label: "composants UI", pattern: /Composants UI shadcn\/ui \((\d+) fichiers?\)/, actual: counts.uiComponents },
  { file: "AGENTS.md", label: "hooks", pattern: /Hooks personnalisés \((\d+) fichiers?\)/, actual: counts.hooks },
  { file: "AGENTS.md", label: "lignes de routers.ts", pattern: /~(\d+) lignes/, actual: counts.routerLines, approximate: true },
  { file: "AGENTS.md", label: "procédures tRPC", pattern: /~?\d+ lignes, (\d+)\+? procédures/, actual: counts.procedures },
  { file: "AGENTS.md", label: "tables", pattern: /Définition des tables \((\d+) tables?\)/, actual: counts.tables },
  { file: "AGENTS.md", label: "tables (liste)", pattern: /: (\d+) tables? \(/, actual: counts.tables },
  { file: "README.md", label: "routeurs", pattern: /expose (\d+) routeurs/, actual: counts.routers },
  { file: "README.md", label: "procédures (structure)", pattern: /Routes tRPC \(~(\d+) procédures\)/, actual: counts.procedures, approximate: true },
  { file: "README.md", label: "procédures (état)", pattern: /Express, tRPC, ~(\d+) procédures/, actual: counts.procedures, approximate: true },
  { file: "README.md", label: "tables", pattern: /Schéma database \((\d+) tables?\)/, actual: counts.tables },
  { file: "AGENTS-System.md", label: "tables", pattern: /^(\d+) tables?\s*:/m, actual: counts.tables },
  { file: "AGENTS-System.md", label: "routeurs", pattern: /\((\d+) routeurs,/, actual: counts.routers, group: 1 },
  { file: "AGENTS-System.md", label: "procédures", pattern: /routeurs, ~(\d+) procédures/, actual: counts.procedures, approximate: true },
  { file: "AGENTS-System.md", label: "lignes de routers.ts", pattern: /~(\d+) lignes\)/, actual: counts.routerLines, approximate: true },
];

const TOLERANCE = 0.1; // ±10 % pour les valeurs annoncées avec « ~ »

function countMatches(docValue, actual, approximate) {
  if (actual === null || actual === undefined) return null;
  if (!approximate) return docValue === actual;
  return Math.abs(docValue - actual) <= Math.max(1, Math.round(actual * TOLERANCE));
}

const problems = [];
const lines = [];

// ── Versions ────────────────────────────────────────────────────────────────
lines.push("Versions (AGENTS.md § Stack Technique)");
const stack = parseStackTable(DOC["AGENTS.md"]);
if (stack.length === 0) {
  problems.push("Tableau « Stack Technique » introuvable dans AGENTS.md");
  lines.push("  ⚠ tableau introuvable — le motif a peut-être changé");
}

for (const row of stack) {
  const packages = TECHNO_TO_PACKAGES[row.techno];
  const docVersion = normalizeDocVersion(row.version);
  // « — » et technos sans paquet npm identifiable : rien à comparer.
  if (!packages || packages.length === 0 || docVersion === "—") continue;

  const announced = docVersion.split("/").map(part => part.trim());
  packages.forEach((name, i) => {
    const expected = announced[i] ?? announced[0];
    const real = installedVersion(name);
    const ok = versionMatches(expected, real);
    if (ok === null) {
      problems.push(`${name} absent de node_modules et de package.json`);
      lines.push(`  ✘ ${name.padEnd(24)} ${expected.padEnd(9)} introuvable`);
      return;
    }
    if (!ok) problems.push(`${name} : doc ${expected} / réel ${real}`);
    lines.push(
      `  ${ok ? "✔" : "✘"} ${name.padEnd(24)} ${expected.padEnd(9)} (${real})`
    );
  });
}

// ── Comptages ───────────────────────────────────────────────────────────────
lines.push("", "Comptages");
for (const check of COUNT_CHECKS) {
  const match = check.pattern.exec(DOC[check.file]);
  if (!match) {
    lines.push(
      `  ⚠ ${check.file} — « ${check.label} » : motif introuvable (doc reformulée ?)`
    );
    problems.push(`${check.file} : motif introuvable pour ${check.label}`);
    continue;
  }
  const announced = Number(match[check.group ?? 1]);
  const ok = countMatches(announced, check.actual, check.approximate);
  if (!ok) {
    problems.push(`${check.file} ${check.label} : doc ${announced} / réel ${check.actual}`);
  }
  lines.push(
    `  ${ok ? "✔" : "✘"} ${check.file.padEnd(16)} ${check.label.padEnd(22)} ` +
      `doc ${String(announced).padEnd(6)} réel ${check.actual ?? "?"}`
  );
}

// ── Rapport ─────────────────────────────────────────────────────────────────
if (process.argv.includes("--json")) {
  console.log(
    JSON.stringify({ ok: problems.length === 0, problems, counts, lines }, null, 2)
  );
} else {
  console.log(`\nContrôle de dérive documentaire — ${ROOT}\n`);
  console.log(lines.join("\n"));
  console.log("");
  if (problems.length === 0) {
    console.log("✔ Documentation alignée sur le dépôt.");
  } else {
    console.log(`✘ ${problems.length} écart(s) à corriger :`);
    for (const problem of problems) console.log(`  - ${problem}`);
  }
}

process.exit(problems.length === 0 ? 0 : 1);
