#!/usr/bin/env node
/**
 * Check User Permissions
 * 
 * This script checks what roles and permissions a user has.
 * Usage: node check-user-permissions.js <email>
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

async function checkUserPermissions(email) {
  const client = await pool.connect();
  
  try {
    console.log(`\n🔍 Checking permissions for: ${email}\n`);

    // 1. Check if user exists
    const userResult = await client.query(
      'SELECT id, email, organization_id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found\n');
      console.log('Available users:');
      const allUsers = await client.query('SELECT email FROM users LIMIT 10');
      allUsers.rows.forEach(u => console.log(`  - ${u.email}`));
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Organization ID: ${user.organization_id}`);
    console.log();

    // 2. Check role assignments
    const rolesResult = await client.query(
      `SELECT r.id, r.name, r."displayName", r.level, r."isSystem", r."isDefault",
              jsonb_array_length(r.permissions) as perm_count,
              ura.granted_at, ura.workspace_id
       FROM user_role_assignments ura
       JOIN roles r ON ura.role_id = r.id
       WHERE ura.user_id = $1
       ORDER BY r.level DESC`,
      [user.id]
    );

    if (rolesResult.rows.length === 0) {
      console.log('❌ No roles assigned to this user!\n');
      console.log('💡 Solution: Assign a role using:');
      console.log(`   ./QUICK-ASSIGN-OWNER-ROLE.sh`);
      console.log(`   or`);
      console.log(`   node scripts/seed-roles.js (if roles don't exist)`);
      return;
    }

    console.log(`📋 Assigned Roles (${rolesResult.rows.length}):\n`);
    rolesResult.rows.forEach(role => {
      console.log(`   ${role.isSystem ? '🔒' : '✏️'} ${role.displayName} (${role.name})`);
      console.log(`      Level: ${role.level}`);
      console.log(`      Permissions: ${role.perm_count}`);
      console.log(`      Granted: ${role.granted_at.toISOString().split('T')[0]}`);
      console.log();
    });

    // 3. Get all permissions
    const permissionsResult = await client.query(
      `SELECT DISTINCT jsonb_array_elements_text(r.permissions) as permission
       FROM user_role_assignments ura
       JOIN roles r ON ura.role_id = r.id
       WHERE ura.user_id = $1
       ORDER BY permission`,
      [user.id]
    );

    console.log(`🔑 All Permissions (${permissionsResult.rows.length}):\n`);
    
    // Group by resource
    const permsByResource = {};
    permissionsResult.rows.forEach(p => {
      const [resource, action] = p.permission.split(':');
      if (!permsByResource[resource]) {
        permsByResource[resource] = [];
      }
      permsByResource[resource].push(action);
    });

    Object.keys(permsByResource).sort().forEach(resource => {
      console.log(`   ${resource}:`);
      console.log(`      ${permsByResource[resource].join(', ')}`);
    });
    console.log();

    // 4. Check specific permission
    const hasAgentsRead = permissionsResult.rows.some(p => p.permission === 'agents:read');
    console.log('🎯 Key Permissions Check:\n');
    console.log(`   agents:read       ${hasAgentsRead ? '✅ YES' : '❌ NO'}`);
    console.log(`   agents:create     ${permissionsResult.rows.some(p => p.permission === 'agents:create') ? '✅ YES' : '❌ NO'}`);
    console.log(`   workflows:read    ${permissionsResult.rows.some(p => p.permission === 'workflows:read') ? '✅ YES' : '❌ NO'}`);
    console.log(`   users:read        ${permissionsResult.rows.some(p => p.permission === 'users:read') ? '✅ YES' : '❌ NO'}`);
    console.log(`   users:manage      ${permissionsResult.rows.some(p => p.permission === 'users:manage') ? '✅ YES' : '❌ NO'}`);
    console.log();

    if (!hasAgentsRead) {
      console.log('⚠️  WARNING: User does not have agents:read permission!');
      console.log('   This will cause 403 errors when accessing agents.\n');
      console.log('💡 Solution: Assign admin or member role to this user.');
      console.log();
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.log('Usage: node check-user-permissions.js <email>');
  console.log('Example: node check-user-permissions.js user@example.com');
  process.exit(1);
}

checkUserPermissions(email);
