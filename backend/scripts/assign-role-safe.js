#!/usr/bin/env node
/**
 * Assign Role to User (Safe Version - JavaScript)
 * 
 * Uses TypeORM repositories instead of raw SQL queries.
 * This ensures the script stays synchronized with entity definitions.
 * 
 * Usage:
 *   node backend/scripts/assign-role-safe.js <user-email> <role-name> [organization-name]
 * 
 * Examples:
 *   node backend/scripts/assign-role-safe.js admin@example.com owner
 *   node backend/scripts/assign-role-safe.js user@acme.com admin "Acme Corp"
 *   node backend/scripts/assign-role-safe.js dev@test.com member "Test Org"
 * 
 * Available Roles:
 *   - owner (OWNER)
 *   - admin (ADMIN)
 *   - member (MEMBER)
 *   - viewer (VIEWER)
 *   - platform_admin (PLATFORM_ADMIN)
 */

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function showUsage() {
  console.log(`
${colors.bright}Assign Role to User (Safe Version)${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node backend/scripts/assign-role-safe.js <user-email> <role-name> [organization-name]

${colors.cyan}Examples:${colors.reset}
  node backend/scripts/assign-role-safe.js admin@example.com owner
  node backend/scripts/assign-role-safe.js user@acme.com admin "Acme Corp"
  node backend/scripts/assign-role-safe.js dev@test.com member "Test Org"

${colors.cyan}Available Roles:${colors.reset}
  ${colors.green}owner${colors.reset}          - Organization owner (all permissions)
  ${colors.green}admin${colors.reset}          - Administrator (most permissions)
  ${colors.green}member${colors.reset}         - Regular member (basic access)
  ${colors.green}viewer${colors.reset}         - Read-only access
  ${colors.green}platform_admin${colors.reset} - Platform-wide administrator

${colors.cyan}Notes:${colors.reset}
  - Role names are case-insensitive
  - If organization name is omitted, role is assigned globally
  - Organization name should match exactly (case-sensitive)
  `);
}

async function assignRole() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    showUsage();
    process.exit(1);
  }

  const userEmail = args[0];
  const roleName = args[1].toUpperCase();
  const organizationName = args[2] || null;

  logInfo(`Starting role assignment process...`);
  logInfo(`User: ${userEmail}`);
  logInfo(`Role: ${roleName}`);
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
    logInfo('Looking up user...');
    const userRepo = app.get('UserRepository');
    const user = await userRepo.findOne({ where: { email: userEmail } });
    
    if (!user) {
      logError(`User not found: ${userEmail}`);
      process.exit(1);
    }
    logSuccess(`User found: ${user.fullName || user.email} (${user.id})`);
    console.log('');

    // Find role
    logInfo('Looking up role...');
    const roleRepo = app.get('RoleRepository');
    const role = await roleRepo.findOne({ where: { name: roleName } });
    
    if (!role) {
      logError(`Role not found: ${roleName}`);
      logWarning('Available roles: OWNER, ADMIN, MEMBER, VIEWER, PLATFORM_ADMIN');
      process.exit(1);
    }
    logSuccess(`Role found: ${role.name} (Level: ${role.level})`);
    console.log('');

    // Find organization if specified
    let organization = null;
    if (organizationName) {
      logInfo('Looking up organization...');
      const orgRepo = app.get('OrganizationRepository');
      organization = await orgRepo.findOne({ where: { name: organizationName } });
      
      if (!organization) {
        logError(`Organization not found: ${organizationName}`);
        process.exit(1);
      }
      logSuccess(`Organization found: ${organization.name} (${organization.id})`);
      console.log('');
    }

    // Check if assignment already exists
    const assignmentRepo = app.get('UserRoleAssignmentRepository');
    const existingAssignment = await assignmentRepo.findOne({
      where: {
        userId: user.id,
        roleId: role.id,
        organizationId: organization?.id || user.organizationId,
      },
    });

    if (existingAssignment) {
      logWarning('User already has this role!');
      logInfo('No action needed - assignment already exists.');
      process.exit(0);
    }

    // Assign the role
    logInfo('Assigning role...');
    const assignment = await roleAssignmentService.assignRole(
      user.id,
      role.id,
      organization?.id || user.organizationId,
      user.id // grantedBy
    );

    console.log('');
    logSuccess('Role assigned successfully!');
    console.log('');
    log(`${colors.bright}Assignment Details:${colors.reset}`);
    log(`  User:         ${user.email}`, colors.cyan);
    log(`  Role:         ${role.name} (Level: ${role.level})`, colors.cyan);
    log(`  Organization: ${organization?.name || 'Global'}`, colors.cyan);
    log(`  Granted At:   ${new Date().toISOString()}`, colors.cyan);
    console.log('');
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
assignRole();
