import type { Knex } from "knex";

const cfg: Knex.Config = {
  client: "pg",
  connection: {
    // Use individual environment variables (same as database.js)
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'nicsan_crm',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'your_password',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  pool: { min: 2, max: 20 },
  migrations: { tableName: "knex_migrations", directory: "./migrations" },
};

// Export same cfg for all envs; SSL handled inside resolveSSL()
module.exports = { development: cfg, staging: cfg, production: cfg };