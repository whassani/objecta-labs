#!/usr/bin/env node
/**
 * Assign Role to User
 * 
 * This script assigns a role to a user by email.
 * Usage: node assign-role.js <email> <role>
 * Example: node assign-role.js user@example.com admin
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME,
});

// Colors for console output
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

async function assignRole(email, roleName) {
  const client = await pool.connect();
  
  try {
    console.log();
    log('blue', '═══════════════════════════════════════════════════');
    log('blue', '           ASSIGN ROLE TO USER                    ');
    log('blue', '═══════════════════════════════════════════════════');
    console.log();

    // 1. Validate inputs
    if (!email || !roleName) {
      log('red', '❌ Error: Both email and role name are required');
      console.log();
      log('yellow', 'Usage: node assign-role.js <email> <role>');
      log('yellow', 'Example: node assign-role.js user@example.com admin');
      console.log();
      log('cyan', 'Available roles: owner, admin, member, viewer');
      return;
    }

    log('cyan', `📧 User Email: ${email}`);
    log('cyan', `👤 Role: ${roleName}`);
    console.log();

    // 2. Check if role exists
    log('blue', '🔍 Checking if role exists...');
    const roleResult = await client.query(
      'SELECT id, name, "displayName", level, "isSystem", jsonb_array_length(permissions) as perm_count FROM roles WHERE name = $1',
      [roleName.toLowerCase()]
    );

    if (roleResult.rows.length === 0) {
      log('red', `❌ Role "${roleName}" not found`);
      console.log();
      
      // Show available roles
      log('yellow', '📋 Available roles:');
      const allRoles = await client.query(
        'SELECT name, "displayName", level, "isSystem" FROM roles ORDER BY level DESC'
      );
      
      allRoles.rows.forEach(role => {
        const systemBadge = role.isSystem ? '🔒 System' : '✏️ Custom';
        console.log(`   ${systemBadge} ${role.displayName.padEnd(20)} (${role.name}) - Level ${role.level}`);
      });
      
      return;
    }

    const role = roleResult.rows[0];
    log('green', `✅ Role found: ${role.displayName} (Level ${role.level}, ${role.perm_count} permissions)`);
    console.log();

    // 3. Check if user exists
    log('blue', '🔍 Checking if user exists...');
    const userResult = await client.query(
      'SELECT id, email, organization_id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      log('red', `❌ User not found: ${email}`);
      console.log();
      
      // Show available users (first 10)
      log('yellow', '📋 Available users (showing first 10):');
      const allUsers = await client.query(
        'SELECT email FROM users ORDER BY email LIMIT 10'
      );
      
      allUsers.rows.forEach(user => {
        console.log(`   📧 ${user.email}`);
      });
      
      return;
    }

    const user = userResult.rows[0];
    log('green', `✅ User found: ${user.email}`);
    log('cyan', `   Organization ID: ${user.organization_id}`);
    console.log();

    // 4. Check if user already has this role
    log('blue', '🔍 Checking existing role assignments...');
    const existingAssignment = await client.query(
      `SELECT ura.id, ura.granted_by
       FROM user_role_assignments ura
       WHERE ura.user_id = $1 AND ura.role_id = $2 AND ura.organization_id = $3`,
      [user.id, role.id, user.organization_id]
    );

    if (existingAssignment.rows.length > 0) {
      const grantedBy = existingAssignment.rows[0].granted_by;
      log('yellow', `⚠️  User already has this role!`);
      log('cyan', `   Granted at: ${grantedBy}`);
      console.log();
      
      // Show all current roles
      const currentRoles = await client.query(
        `SELECT r.name, r."displayName", r.level, ura.granted_by
         FROM user_role_assignments ura
         JOIN roles r ON ura.role_id = r.id
         WHERE ura.user_id = $1
         ORDER BY r.level DESC`,
        [user.id]
      );
      
      log('cyan', '📋 Current roles for this user:');
      currentRoles.rows.forEach(r => {
        console.log(`   • ${r.displayName} (Level ${r.level}) - Granted by: ${r.granted_by}`);
      });
      
      return;
    }

    // 5. Assign the role
    log('blue', '✨ Assigning role to user...');
    await client.query(
      `INSERT INTO user_role_assignments (user_id, role_id, organization_id, granted_by, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [user.id, role.id, user.organization_id, user.id]
    );

    console.log();
    log('green', '═══════════════════════════════════════════════════');
    log('green', '             ✅ SUCCESS!                          ');
    log('green', '═══════════════════════════════════════════════════');
    console.log();
    
    log('bright', `✅ Role "${role.displayName}" assigned to ${user.email}`);
    console.log();

    // 6. Show updated permissions summary
    const allRoles = await client.query(
      `SELECT r.name, r."displayName", r.level, jsonb_array_length(r.permissions) as perm_count
       FROM user_role_assignments ura
       JOIN roles r ON ura.role_id = r.id
       WHERE ura.user_id = $1
       ORDER BY r.level DESC`,
      [user.id]
    );

    log('cyan', '📊 Updated Role Summary:');
    console.log();
    console.log('   Role                Level  Permissions');
    console.log('   ──────────────────────────────────────');
    
    allRoles.rows.forEach(r => {
      console.log(`   ${r.displayName.padEnd(20)} ${String(r.level).padEnd(6)} ${r.perm_count}`);
    });
    console.log();

    // 7. Get all permissions
    const allPermissions = await client.query(
      `SELECT DISTINCT jsonb_array_elements_text(r.permissions) as permission
       FROM user_role_assignments ura
       JOIN roles r ON ura.role_id = r.id
       WHERE ura.user_id = $1
       ORDER BY permission`,
      [user.id]
    );

    log('cyan', `🔑 Total Permissions: ${allPermissions.rows.length}`);
    console.log();

    // Group by resource
    const permsByResource = {};
    allPermissions.rows.forEach(p => {
      const [resource, action] = p.permission.split(':');
      if (!permsByResource[resource]) {
        permsByResource[resource] = [];
      }
      permsByResource[resource].push(action);
    });

    log('cyan', '📋 Permissions by Resource:');
    Object.keys(permsByResource).sort().slice(0, 10).forEach(resource => {
      console.log(`   ${resource}: ${permsByResource[resource].join(', ')}`);
    });
    
    if (Object.keys(permsByResource).length > 10) {
      console.log(`   ... and ${Object.keys(permsByResource).length - 10} more resources`);
    }
    console.log();

    // 8. Next steps
    log('yellow', '⚡ Next Steps:');
    console.log();
    console.log('   1. User should logout and login again to refresh JWT token');
    console.log('   2. Test access to protected resources');
    console.log('   3. Verify permissions in UI: http://localhost:3000/dashboard/permissions');
    console.log();
    
    log('cyan', '💡 Tips:');
    console.log('   • Logout/login is required for permissions to take effect');
    console.log('   • Check permissions: node scripts/check-user-permissions.js ' + email);
    console.log('   • Remove role: node scripts/remove-role.js ' + email + ' ' + roleName);
    console.log();

  } catch (error) {
    console.log();
    log('red', '═══════════════════════════════════════════════════');
    log('red', '             ❌ ERROR                             ');
    log('red', '═══════════════════════════════════════════════════');
    console.log();
    log('red', `Error: ${error.message}`);
    console.log();
    
    if (error.code === 'ECONNREFUSED') {
      log('yellow', '💡 Database connection refused. Check:');
      console.log('   • Is PostgreSQL running?');
      console.log('   • Are database credentials correct in .env?');
      console.log('   • Connection string: postgresql://user:pass@host:port/database');
    }
    
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Interactive mode if no arguments
async function interactiveMode() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise(resolve => rl.question(query, resolve));

  try {
    console.log();
    log('blue', '═══════════════════════════════════════════════════');
    log('blue', '           ASSIGN ROLE TO USER (Interactive)      ');
    log('blue', '═══════════════════════════════════════════════════');
    console.log();

    // Show available roles
    const client = await pool.connect();
    const roles = await client.query(
      'SELECT name, "displayName", level, "isSystem" FROM roles ORDER BY level DESC'
    );
    client.release();

    log('cyan', '📋 Available roles:');
    console.log();
    roles.rows.forEach((role, index) => {
      const systemBadge = role.isSystem ? '🔒' : '✏️';
      console.log(`   ${index + 1}. ${systemBadge} ${role.displayName.padEnd(20)} (${role.name}) - Level ${role.level}`);
    });
    console.log();

    const email = await question(colors.cyan + '📧 Enter user email: ' + colors.reset);
    const roleName = await question(colors.cyan + '👤 Enter role name (e.g., admin, member): ' + colors.reset);

    rl.close();

    await assignRole(email.trim(), roleName.trim());
  } catch (error) {
    rl.close();
    throw error;
  }
}

// Main execution
const email = process.argv[2];
const roleName = process.argv[3];

if (!email || !roleName) {
  // Interactive mode
  interactiveMode()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else {
  // Command line mode
  assignRole(email, roleName)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
