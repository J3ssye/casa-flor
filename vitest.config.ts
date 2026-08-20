import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    // Banco de teste isolado — nunca o banco real. Sobrescreve o .env.
    env: {
      DATABASE_URL: "postgresql://republica:republica123@localhost:5432/republica_test",
    },
    // Testes de integração compartilham o mesmo banco: rodar em série evita corridas entre arquivos.
    fileParallelism: false,
  },
});
