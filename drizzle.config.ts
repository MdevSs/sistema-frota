import { defineConfig } from "drizzle-kit";

// Usar DATABASE_URL_LOGISTICA para migrations
const connectionString = process.env.DATABASE_URL_LOGISTICA || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL_LOGISTICA ou DATABASE_URL é necessário para executar comandos drizzle");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
