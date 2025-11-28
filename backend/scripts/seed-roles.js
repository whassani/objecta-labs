#!/usr/bin/env node
/**
 * Seed Default Roles
 * 
 * This script seeds the default system roles into the database.
 * Roles: Owner, Admin, Editor, Viewer
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

const roles = [
  {
    name: 'owner',
    displayName: 'Owner',
    description: 'Full control over the organization including billing and user management',
    level: 100,
    isSystem: true,
    isDefault: false,
    permissions: [
      'organizations:manage', 'organizations:read', 'organizations:update', 'organizations:delete',
      'workspaces:manage', 'workspaces:create', 'workspaces:read', 'workspaces:update', 'workspaces:delete',
      'users:manage', 'users:create', 'users:read', 'users:update', 'users:delete',
      'settings:manage', 'settings:read', 'settings:update',
      'api-keys:manage', 'api-keys:create', 'api-keys:read', 'api-keys:delete',
      'agents:create', 'agents:read', 'agents:update', 'agents:delete', 'agents:deploy', 'agents:share',
      'conversations:create', 'conversations:read', 'conversations:update', 'conversations:delete',
      'knowledge-base:create', 'knowledge-base:read', 'knowledge-base:update', 'knowledge-base:delete',
      'documents:create', 'documents:read', 'documents:update', 'documents:delete',
      'workflows:create', 'workflows:read', 'workflows:update', 'workflows:delete', 'workflows:execute', 'workflows:deploy',
      'tools:create', 'tools:read', 'tools:update', 'tools:delete', 'tools:execute',
      'fine-tuning:create', 'fine-tuning:read', 'fine-tuning:update', 'fine-tuning:delete',
      'datasets:create', 'datasets:read', 'datasets:update', 'datasets:delete',
      'jobs:create', 'jobs:read', 'jobs:update', 'jobs:delete',
    ],
  },
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Can manage workspaces, users, and all resources',
    level: 80,
    isSystem: true,
    isDefault: false,
    permissions: [
      'workspaces:read', 'workspaces:update',
      'users:read', 'users:update',
      'settings:read', 'settings:update',
      'api-keys:create', 'api-keys:read', 'api-keys:delete',
      'agents:create', 'agents:read', 'agents:update', 'agents:delete', 'agents:deploy',
      'conversations:create', 'conversations:read', 'conversations:update', 'conversations:delete',
      'knowledge-base:create', 'knowledge-base:read', 'knowledge-base:update', 'knowledge-base:delete',
      'documents:create', 'documents:read', 'documents:update', 'documents:delete',
      'workflows:create', 'workflows:read', 'workflows:update', 'workflows:delete', 'workflows:execute',
      'tools:create', 'tools:read', 'tools:update', 'tools:delete', 'tools:execute',
      'fine-tuning:create', 'fine-tuning:read', 'fine-tuning:update',
      'datasets:create', 'datasets:read', 'datasets:update',
      'jobs:create', 'jobs:read',
    ],
  },
  {
    name: 'member',
    displayName: 'Member',
    description: 'Can create and edit resources, execute workflows and tools',
    level: 50,
    isSystem: true,
    isDefault: true,
    permissions: [
      'agents:create', 'agents:read', 'agents:update',
      'conversations:create', 'conversations:read', 'conversations:update',
      'knowledge-base:create', 'knowledge-base:read', 'knowledge-base:update',
      'documents:create', 'documents:read', 'documents:update',
      'workflows:create', 'workflows:read', 'workflows:update', 'workflows:execute',
      'tools:create', 'tools:read', 'tools:update', 'tools:execute',
      'fine-tuning:create', 'fine-tuning:read', 'fine-tuning:update',
      'datasets:create', 'datasets:read', 'datasets:update',
      'jobs:create', 'jobs:read',
    ],
  },
  {
    name: 'viewer',
    displayName: 'Viewer',
    description: 'Read-only access to all resources',
    level: 20,
    isSystem: true,
    isDefault: false,
    permissions: [
      'agents:read',
      'conversations:read',
      'knowledge-base:read',
      'documents:read',
      'workflows:read',
      'tools:read',
      'fine-tuning:read',
      'datasets:read',
      'jobs:read',
    ],
  },
];

async function seedRoles() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding default roles...\n');

    for (const role of roles) {
      // Check if role already exists
      const existingRole = await client.query(
        'SELECT id, name FROM roles WHERE name = $1',
        [role.name]
      );

      if (existingRole.rows.length > 0) {
        console.log(`✓ Role "${role.displayName}" already exists (skipping)`);
        continue;
      }

      // Insert role
      await client.query(
        `INSERT INTO roles (name, "displayName", description, permissions, level, "isSystem", "isDefault", created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          role.name,
          role.displayName,
          role.description,
          JSON.stringify(role.permissions),
          role.level,
          role.isSystem,
          role.isDefault,
        ]
      );

      console.log(`✅ Created role: ${role.displayName} (${role.permissions.length} permissions)`);
    }

    console.log('\n🎉 Role seeding completed!');
    
    // Show summary
    const result = await client.query(
      'SELECT name, "displayName", level, "isDefault", jsonb_array_length(permissions) as permission_count FROM roles ORDER BY level DESC'
    );
    
    console.log('\n📊 Current Roles:\n');
    console.log('Name          Display Name       Level  Default  Permissions');
    console.log('─────────────────────────────────────────────────────────────');
    
    result.rows.forEach(row => {
      const name = row.name.padEnd(13);
      const displayName = row.displayName.padEnd(17);
      const level = String(row.level).padEnd(6);
      const isDefault = (row.isDefault ? 'Yes' : 'No').padEnd(8);
      const permCount = row.permission_count || 0;
      
      console.log(`${name} ${displayName} ${level} ${isDefault} ${permCount}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding roles:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeding
seedRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
