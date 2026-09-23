// Vault configuration for the indexer.
//
// Resolution order:
//   1. VAULT_PATH env var (explicit override)
//   2. ./vault/system_design        (bundled with the repo — used by Docker / CI)
//   3. ./vault                      (alternative bundled location)
//
// This file is Node-only — never import it from browser code.

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CANDIDATES = [
  process.env.VAULT_PATH,
  resolve(__dirname, "vault", "system_design"),
  resolve(__dirname, "vault"),
].filter(Boolean);

function resolveVaultRoot() {
  for (const candidate of CANDIDATES) {
    try {
      if (existsSync(candidate)) return candidate;
    } catch {
      /* ignore */
    }
  }
  // Fall back to the first candidate even if missing — the indexer will
  // produce a clearer error than we can here.
  return CANDIDATES[0];
}

export const VAULT_ROOT = resolveVaultRoot();
