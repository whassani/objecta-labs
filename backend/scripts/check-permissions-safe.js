#!/usr/bin/env node
/**
 * Check User Permissions (Safe Version - JavaScript)
 * 
 * Uses TypeORM repositories instead of raw SQL queries.
 * This ensures the script stays synchronized with entity definitions.
 * 
 * Usage:
 *   node backend/scripts/check-permissions-safe.js <user-email> [organization-name]
 * 
 * Examples:
 *   node backend/scripts/check-permissions-safe.js admin@example.com
 *   node backend/scripts/check-permissions-safe.js user@acme.com "Acme Corp"
 */

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function showUsage() {
  console.log(`
${colors.bright}Check User Permissions (Safe Version)${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node backend/scripts/check-permissions-safe.js <user-email> [organization-name]

${colors.cyan}Examples:${colors.reset}
  node backend/scripts/check-permissions-safe.js admin@example.com
  node backend/scripts/check-permissions-safe.js user@acme.com "Acme Corp"

${colors.cyan}Description:${colors.reset}
  Shows all roles and permissions for a user, optionally filtered by organization.
  `);
}

async function checkPermissions() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    showUsage();
    process.exit(1);
  }

  const userEmail = args[0];
  const organizationName = args[1] || null;

  console.log('');
  log(`🔍 Checking permissions for: ${colors.bright}${userEmail}${colors.reset}`);
  if (organizationName) {
    logInfo(`Organization: ${organizationName}`);
  }
  console.log('');

  let app;
  
  try {
    // Create NestJS application
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: false, // Disable NestJS logging for cleaner output
    });

    // Get the RoleAssignmentService
    const { RoleAssignmentService } = require('../dist/src/modules/auth/services/role-assignment.service');
    const roleAssignmentService = app.get(RoleAssignmentService);

    // Find user
    const userRepo = app.get('UserRepository');
    const user = await userRepo.findOne({ 
      where: { email: userEmail },
      relations: ['organization'],
    });
    
    if (!user) {
      logError(`User not found: ${userEmail}`);
      process.exit(1);
    }

    // Display user info
    logSuccess('User found:');
    log(`   ID: ${user.id}`, colors.dim);
    log(`   Email: ${user.email}`, colors.cyan);
    log(`   Name: ${user.fullName || 'N/A'}`, colors.cyan);
    if (user.organization) {
      log(`   Organization: ${user.organization.name}`, colors.cyan);
    }
    console.log('');

    // Find organization if specified
    let organizationId = user.organizationId;
    if (organizationName) {
      const orgRepo = app.get('OrganizationRepository');
      const organization = await orgRepo.findOne({ where: { name: organizationName } });
      
      if (!organization) {
        logError(`Organization not found: ${organizationName}`);
        process.exit(1);
      }
      organizationId = organization.id;
    }

    // Get user roles
    const assignmentRepo = app.get('UserRoleAssignmentRepository');
    const assignments = await assignmentRepo.find({
      where: {
        userId: user.id,
        organizationId: organizationId || user.organizationId,
      },
      relations: ['role'],
    });

    if (assignments.length === 0) {
      logInfo('No roles assigned to this user.');
      console.log('');
      process.exit(0);
    }

    // Display roles
    log(`📋 Assigned Roles (${assignments.length}):`, colors.bright);
    console.log('');
    
    for (const assignment of assignments) {
      const role = assignment.role;
      log(`   🔒 ${role.name}`, colors.green + colors.bright);
      log(`      Description: ${role.description || 'N/A'}`, colors.dim);
      log(`      Level: ${role.level}`, colors.dim);
      log(`      Granted: ${assignment.createdAt.toISOString().split('T')[0]}`, colors.dim);
      console.log('');
    }

    // Get all permissions
    const permissions = await roleAssignmentService.getUserPermissions(user.id, organizationId);
    
    log(`🔑 Total Unique Permissions: ${colors.bright}${permissions.length}${colors.reset}`);
    console.log('');

    // Group permissions by resource
    const permissionsByResource = {};
    for (const permission of permissions) {
      const [resource, action] = permission.split(':');
      if (!permissionsByResource[resource]) {
        permissionsByResource[resource] = [];
      }
      permissionsByResource[resource].push(action);
    }

    // Display permissions by resource
    log(`📋 Permissions by Resource:`, colors.bright);
    console.log('');

    const sortedResources = Object.keys(permissionsByResource).sort();
    for (const resource of sortedResources) {
      const actions = permissionsByResource[resource].sort();
      log(`   ${resource}:`, colors.cyan);
      log(`      ${actions.join(', ')}`, colors.dim);
      console.log('');
    }

    logSuccess('✨ Done!');

  } catch (error) {
    console.error('');
    logError(`Error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
    }
  }
}

// Run the script
checkPermissions();
