import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // All test files share one live Postgres test database (no per-file schema/transaction
    // isolation), and several files clean up fixtures with broad `contains` filters (e.g.
    // "Item Teste", "Tipo Teste"). Running files in parallel lets one file's afterAll delete
    // rows another file's still-running tests depend on. Serialize file execution to avoid
    // that cross-file race.
    fileParallelism: false,
  },
});
