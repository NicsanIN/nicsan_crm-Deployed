import type { Knex } from "knex";

function resolveSSL() {
  // 1) Explicit override via env
  const flag = process.env.DB_SSL?.toLowerCase();
  if (flag === "true") return { rejectUnauthorized: false }; // RDS/Cloud
  if (flag === "false") return false;                         // Local dev

  // 2) Sensible default from URL host
  try {
    const url = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
    const host = url?.hostname || "";
    const isLocal = host === "localhost" || host === "127.0.0.1";
    return isLocal ? false : { rejectUnauthorized: false };
  } catch {
    // If URL is missing/bad, default to no SSL (local)
    return false;
  }
}

const cfg: Knex.Config = {
  client: "pg",
  connection: {
    connectionString: process.env.DATABASE_URL as string,
    // IMPORTANT: require: true is not needed; pg respects presence of this object
    ssl: resolveSSL(),
  },
  pool: { min: 2, max: 20 },
  migrations: { tableName: "knex_migrations", directory: "./migrations" },
};

// Export same cfg for all envs; SSL handled inside resolveSSL()
module.exports = { development: cfg, staging: cfg, production: cfg };