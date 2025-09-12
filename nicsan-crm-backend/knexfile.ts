import type { Knex } from "knex";

const cfg: Knex.Config = {
  client: "pg",
  connection: {
    // Use DATABASE_URL if available, otherwise fall back to individual variables
    connectionString: process.env.DATABASE_URL || undefined,
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
    database: process.env.DB_NAME || process.env.PGDATABASE || 'nicsan_crm',
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'your_password',
    ssl: process.env.DB_SSL === 'true' || process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  pool: { min: 2, max: 20 },
  migrations: { tableName: "knex_migrations", directory: "./migrations" },
};

// Export same cfg for all envs; SSL handled inside resolveSSL()
module.exports = { development: cfg, staging: cfg, production: cfg };