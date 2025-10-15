/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Create users table first (no dependencies)
    .createTable('users', function(table) {
      table.increments('id').primary();
      table.string('email', 255).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      table.string('name', 255).notNullable();
      table.string('role', 50).defaultTo('ops').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.specificType('permissions', 'text[]');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('last_login');
      table.string('phone', 20);
      table.string('department', 100);
    })
    
    // Create telecallers table
    .createTable('telecallers', function(table) {
      table.increments('id').primary();
      table.string('name', 255).notNullable().unique();
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.string('email', 255);
      table.string('phone', 20);
      table.string('branch', 255);
    })
    
    // Create settings table
    .createTable('settings', function(table) {
      table.increments('id').primary();
      table.string('key', 100).notNullable().unique();
      table.text('value').notNullable();
      table.text('description');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    
    // Create password_change_logs table (depends on users)
    .createTable('password_change_logs', function(table) {
      table.increments('id').primary();
      table.integer('changed_by').references('id').inTable('users');
      table.integer('target_user').references('id').inTable('users');
      table.string('action', 50).notNullable();
      table.timestamp('timestamp').defaultTo(knex.fn.now());
    })
    
    // Create indexes for performance
    .then(function() {
      return knex.schema
        .createIndex('idx_password_change_logs_changed_by', 'password_change_logs', 'changed_by')
        .createIndex('idx_password_change_logs_target_user', 'password_change_logs', 'target_user');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('password_change_logs')
    .dropTableIfExists('settings')
    .dropTableIfExists('telecallers')
    .dropTableIfExists('users');
};
