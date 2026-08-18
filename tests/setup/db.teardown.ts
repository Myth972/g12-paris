import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function setup() {}

export async function teardown() {
  // Nettoyage des bases SQLite temporaires créées par vitest.setup.ts.
  // S'exécute après la fermeture de tous les workers : les fichiers sont
  // alors déverrouillés et peuvent être supprimés.
  const tmp = os.tmpdir();
  try {
    for (const file of fs.readdirSync(tmp)) {
      if (file.startsWith("g12-test-") && file.endsWith(".sqlite")) {
        fs.rmSync(path.join(tmp, file), { force: true });
      }
    }
  } catch {}
}