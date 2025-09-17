import type { Knex } from "knex";

// Base configuration
const baseConfig: Knex.Config = {
  client: "pg",
  pool: { min: 2, max: 20 },
  migrations: { tableName: "knex_migrations", directory: "./migrations" },
};

// Development configuration (for teammates with local PostgreSQL)
const development: Knex.Config = {
  ...baseConfig,
  connection: {
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
    database: process.env.DB_NAME || process.env.PGDATABASE || 'nicsan_crm',
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'your_password',
    ssl: false, // Local development doesn't need SSL
  },
};

// Staging configuration (RDS PostgreSQL)
const staging: Knex.Config = {
  ...baseConfig,
  connection: {
    // Use DATABASE_URL if available, otherwise fall back to individual variables
    connectionString: process.env.DATABASE_URL || undefined,
    host: process.env.DB_HOST || process.env.PGHOST,
    port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
    database: process.env.DB_NAME || process.env.PGDATABASE,
    user: process.env.DB_USER || process.env.PGUSER,
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false, // Conditional SSL based on env
  },
  pool: { min: 2, max: 10 }, // Smaller pool for staging
};

// Production configuration (RDS PostgreSQL)
const production: Knex.Config = {
  ...baseConfig,
  connection: {
    // Use DATABASE_URL if available, otherwise fall back to individual variables
    connectionString: process.env.DATABASE_URL || undefined,
    host: process.env.DB_HOST || process.env.PGHOST,
    port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
    database: process.env.DB_NAME || process.env.PGDATABASE,
    user: process.env.DB_USER || process.env.PGUSER,
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false }, // RDS requires SSL
  },
  pool: { min: 2, max: 20 }, // Larger pool for production
};

module.exports = { development, staging, production };