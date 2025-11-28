/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable('policies', (table) => {
    table.index('created_at', 'idx_policies_created_at');
    table.index('caller_name', 'idx_policies_caller_name');
    table.index('executive', 'idx_policies_executive');
    table.index('branch', 'idx_policies_branch');
    table.index('insurer', 'idx_policies_insurer');
    table.index('source', 'idx_policies_source');
    table.index('rollover', 'idx_policies_rollover');
    table.index('vehicle_type', 'idx_policies_vehicle_type');
    table.index('issue_date', 'idx_policies_issue_date');
    table.index('expiry_date', 'idx_policies_expiry_date');
    table.index(['issue_date', 'expiry_date'], 'idx_policies_issue_expiry_window');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  await knex.schema.alterTable('policies', (table) => {
    table.dropIndex('created_at', 'idx_policies_created_at');
    table.dropIndex('caller_name', 'idx_policies_caller_name');
    table.dropIndex('executive', 'idx_policies_executive');
    table.dropIndex('branch', 'idx_policies_branch');
    table.dropIndex('insurer', 'idx_policies_insurer');
    table.dropIndex('source', 'idx_policies_source');
    table.dropIndex('rollover', 'idx_policies_rollover');
    table.dropIndex('vehicle_type', 'idx_policies_vehicle_type');
    table.dropIndex('issue_date', 'idx_policies_issue_date');
    table.dropIndex('expiry_date', 'idx_policies_expiry_date');
    table.dropIndex(['issue_date', 'expiry_date'], 'idx_policies_issue_expiry_window');
  });
};

