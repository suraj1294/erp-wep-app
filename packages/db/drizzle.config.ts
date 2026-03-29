import { defineConfig } from "drizzle-kit"
import { config } from "dotenv"
import { resolve } from "path"

// Load env from apps/web/.env.local (or a local .env file in packages/db)
config({ path: resolve(__dirname, "../../apps/web/.env.local") })
config({ path: resolve(__dirname, ".env") }) // allows local override

export default defineConfig({
  out: "./src/migrations",
  schema: "./src/schema",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
