#!/usr/bin/env node
/**
 * Diagnose Permission Issues
 * 
 * This script checks:
 * 1. If user exists
 * 2. What roles are assigned
 * 3. What permissions they should have
 * 4. What's in their JWT token
 */

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module');

async function diagnose() {
  const userEmail = process.argv[2];
  
  if (!userEmail) {
    console.log('Usage: node diagnose-permissions.js <user-email>');
    process.exit(1);
  }

  console.log('🔍 Diagnosing permission issues for:', userEmail);
  console.log('');

  let app;
  
  try {
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    });

    const { Repository } = require('typeorm');
    const userRepo = app.get('UserRepository');
    const roleAssignmentRepo = app.get('UserRoleAssignmentRepository');
    const roleRepo = app.get('RoleRepository');
    const { RbacService } = require('../dist/src/modules/auth/services/rbac.service');
    const rbacService = app.get(RbacService);

    // 1. Find user
    console.log('1️⃣ Checking user...');
    const user = await userRepo.findOne({ where: { email: userEmail } });
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }
    
    console.log('✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Organization ID:', user.organizationId);
    console.log('');

    // 2. Check role assignments
    console.log('2️⃣ Checking role assignments...');
    const assignments = await roleAssignmentRepo.find({
      where: { userId: user.id },
      relations: ['role'],
    });
    
    if (assignments.length === 0) {
      console.log('❌ No roles assigned!');
      console.log('');
      console.log('To assign OWNER role, run:');
      console.log(`   node scripts/assign-role-safe.js ${userEmail} owner`);
      process.exit(1);
    }
    
    console.log(`✅ ${assignments.length} role(s) assigned:`);
    for (const assignment of assignments) {
      console.log(`   - ${assignment.role.name} (level: ${assignment.role.level})`);
    }
    console.log('');

    // 3. Check roles and permissions from RBAC service
    console.log('3️⃣ Checking RBAC service...');
    try {
      const roles = await rbacService.getUserRoles(user.id, user.organizationId);
      const permissions = await rbacService.getUserPermissions(user.id, user.organizationId);
      
      console.log('✅ Roles from RBAC service:', roles.map(r => r.name));
      console.log('✅ Permissions count:', permissions.length);
      console.log('');
      
      // Check for specific permission
      const hasAgentsRead = permissions.includes('agents:read');
      console.log('   Has agents:read permission?', hasAgentsRead ? '✅ YES' : '❌ NO');
      
      if (!hasAgentsRead) {
        console.log('');
        console.log('❌ Missing agents:read permission!');
        console.log('');
        console.log('Your permissions:', permissions.slice(0, 10).join(', '), '...');
      }
    } catch (error) {
      console.log('❌ Error getting permissions:', error.message);
    }
    console.log('');

    // 4. Check what role has what permissions
    console.log('4️⃣ Checking role permissions in database...');
    for (const assignment of assignments) {
      const role = await roleRepo.findOne({ where: { id: assignment.role.id } });
      console.log(`\n   Role: ${role.name}`);
      console.log(`   Permissions in DB:`, role.permissions);
      
      // Check if it's an array or string
      let perms = role.permissions;
      if (typeof perms === 'string') {
        try {
          perms = JSON.parse(perms);
        } catch (e) {
          console.log('   ⚠️  Warning: Permissions are not valid JSON');
        }
      }
      
      if (Array.isArray(perms)) {
        const hasAgentsRead = perms.includes('agents:read');
        console.log(`   Has agents:read in role? ${hasAgentsRead ? '✅ YES' : '❌ NO'}`);
        console.log(`   Total permissions: ${perms.length}`);
        console.log(`   Sample: ${perms.slice(0, 5).join(', ')}...`);
      }
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📋 DIAGNOSIS COMPLETE');
    console.log('');
    
    if (assignments.length > 0 && assignments[0].role.name.toLowerCase() === 'owner') {
      console.log('✅ User has OWNER role');
      console.log('');
      console.log('If you\'re still getting 403 errors, try:');
      console.log('1. Log out and log back in (to get fresh JWT token)');
      console.log('2. Check browser console for actual error message');
      console.log('3. Verify the JWT token includes permissions');
    } else {
      console.log('⚠️  User does not have OWNER role');
      console.log('');
      console.log('To assign OWNER role, run:');
      console.log(`   node scripts/assign-role-safe.js ${userEmail} owner`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    if (app) {
      await app.close();
    }
  }
}

diagnose();
