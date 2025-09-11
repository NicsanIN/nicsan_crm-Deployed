import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (t) => {
    t.bigIncrements("id").primary();           // numeric PK (no extensions needed)
    t.string("email", 255).notNullable().unique();
    t.string("password_hash", 255).notNullable();
    t.string("name", 255).notNullable();
    t.string("role", 50).notNullable().defaultTo("user"); // e.g. 'ops','admin','user'
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}
