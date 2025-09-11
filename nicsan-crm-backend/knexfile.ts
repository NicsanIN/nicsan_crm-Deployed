import type { Knex } from "knex";

const cfg: Knex.Config = {
  client: "pg",
  connection: {
    connectionString: process.env.DATABASE_URL as string,  // no ?sslmode= in URL
    ssl: { require: true, rejectUnauthorized: false } as any      // <- force SSL for RDS
  },
  pool: { min: 2, max: 20 },
  migrations: { tableName: "knex_migrations", directory: "./migrations" }
};

module.exports = { development: cfg, staging: cfg, production: cfg };
