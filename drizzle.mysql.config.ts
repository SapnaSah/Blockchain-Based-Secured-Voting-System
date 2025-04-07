import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load environment variables
config();

// Allow empty DATABASE_URL for local development with default MySQL settings
const databaseUrl = process.env.DATABASE_URL || "mysql://root:@localhost:3306/blockvote";

export default defineConfig({
  out: "./mysql-migrations",
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url: databaseUrl,
  },
});