/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('monthly_recurring_costs', function(table) {
      table.increments('id').primary();
      table.string('product_name', 255).notNullable();
      table.decimal('cost_amount', 10, 2).notNullable();
      table.string('currency', 3).defaultTo('INR').notNullable();
      table.date('start_date').notNullable();
      table.date('end_date').nullable();
      table.string('status', 20).defaultTo('active').notNullable();
      table.string('category', 100).notNullable();
      table.text('description').nullable();
      table.integer('created_by').references('id').inTable('users').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .then(function() {
      return knex.schema
        .createIndex('idx_monthly_costs_created_by', 'monthly_recurring_costs', 'created_by')
        .createIndex('idx_monthly_costs_status', 'monthly_recurring_costs', 'status')
        .createIndex('idx_monthly_costs_category', 'monthly_recurring_costs', 'category')
        .createIndex('idx_monthly_costs_start_date', 'monthly_recurring_costs', 'start_date');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('monthly_recurring_costs');
};
