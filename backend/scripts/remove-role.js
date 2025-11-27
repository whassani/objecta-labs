#!/usr/bin/env node
/**
 * Remove Role from User
 * 
 * This script removes a role from a user by email.
 * Usage: node remove-role.js <email> <role>
 * Example: node remove-role.js user@example.com admin
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'objecta-labs',
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function removeRole(email, roleName) {
  const client = await pool.connect();
  
  try {
    console.log();
    log('blue', '═══════════════════════════════════════════════════');
    log('blue', '           REMOVE ROLE FROM USER                  ');
    log('blue', '═══════════════════════════════════════════════════');
    console.log();

    if (!email || !roleName) {
      log('red', '❌ Error: Both email and role name are required');
      console.log();
      log('yellow', 'Usage: node remove-role.js <email> <role>');
      log('yellow', 'Example: node remove-role.js user@example.com admin');
      return;
    }

    log('cyan', `📧 User Email: ${email}`);
    log('cyan', `👤 Role to Remove: ${roleName}`);
    console.log();

    // Get user
    const userResult = await client.query(
      'SELECT id, email, organization_id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      log('red', `❌ User not found: ${email}`);
      return;
    }

    const user = userResult.rows[0];
    log('green', `✅ User found: ${user.email}`);
    console.log();

    // Get role
    const roleResult = await client.query(
      'SELECT id, name, "displayName" FROM roles WHERE name = $1',
      [roleName.toLowerCase()]
    );

    if (roleResult.rows.length === 0) {
      log('red', `❌ Role not found: ${roleName}`);
      return;
    }

    const role = roleResult.rows[0];

    // Remove assignment
    const deleteResult = await client.query(
      `DELETE FROM user_role_assignments
       WHERE user_id = $1 AND role_id = $2 AND organization_id = $3
       RETURNING id`,
      [user.id, role.id, user.organization_id]
    );

    if (deleteResult.rows.length === 0) {
      log('yellow', `⚠️  User doesn't have this role assigned`);
      return;
    }

    console.log();
    log('green', '✅ Role removed successfully!');
    console.log();

    // Show remaining roles
    const remainingRoles = await client.query(
      `SELECT r."displayName", r.level
       FROM user_role_assignments ura
       JOIN roles r ON ura.role_id = r.id
       WHERE ura.user_id = $1
       ORDER BY r.level DESC`,
      [user.id]
    );

    if (remainingRoles.rows.length > 0) {
      log('cyan', '📋 Remaining roles:');
      remainingRoles.rows.forEach(r => {
        console.log(`   • ${r.displayName} (Level ${r.level})`);
      });
    } else {
      log('yellow', '⚠️  User now has NO roles assigned!');
      console.log('   Consider assigning at least one role.');
    }
    console.log();

  } catch (error) {
    log('red', `❌ Error: ${error.message}`);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

const email = process.argv[2];
const roleName = process.argv[3];

removeRole(email, roleName)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
