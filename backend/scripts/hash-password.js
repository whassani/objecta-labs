#!/usr/bin/env node

/**
 * Password Hash Generator for Admin Users
 * 
 * Usage:
 *   node scripts/hash-password.js <password>
 *   node scripts/hash-password.js <password> <email> <fullname> <role>
 * 
 * Examples:
 *   node scripts/hash-password.js MySecurePass123!
 *   node scripts/hash-password.js MySecurePass123! admin@company.com "John Doe" super_admin
 */

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// Get command line arguments
const password = process.argv[2];
const email = process.argv[3];
const fullName = process.argv[4];
const role = process.argv[5] || 'super_admin';

// Validate
if (!password) {
  console.error('❌ Error: Password is required\n');
  console.log('Usage:');
  console.log('  node scripts/hash-password.js <password>');
  console.log('  node scripts/hash-password.js <password> <email> <fullname> <role>\n');
  console.log('Examples:');
  console.log('  node scripts/hash-password.js MySecurePass123!');
  console.log('  node scripts/hash-password.js MySecurePass123! admin@company.com "John Doe" super_admin\n');
  process.exit(1);
}

// Validate role
const validRoles = ['super_admin', 'admin', 'support'];
if (!validRoles.includes(role)) {
  console.error(`❌ Error: Invalid role "${role}". Must be one of: ${validRoles.join(', ')}\n`);
  process.exit(1);
}

console.log('🔐 Generating password hash...\n');

// Generate hash
bcrypt.hash(password, SALT_ROUNDS)
  .then(hash => {
    console.log('✅ Password hash generated successfully!\n');
    console.log('═'.repeat(70));
    console.log('📋 COPY THIS HASH:');
    console.log('═'.repeat(70));
    console.log(hash);
    console.log('═'.repeat(70));
    console.log('');

    // If email provided, generate SQL commands
    if (email) {
      console.log('📝 SQL COMMANDS:\n');
      
      // Method 1: Update existing user
      console.log('Method 1: Grant admin access to existing user');
      console.log('─'.repeat(70));
      console.log(`UPDATE users`);
      console.log(`SET "isAdmin" = true, "adminRole" = '${role}'`);
      console.log(`WHERE email = '${email}';\n`);
      
      // Method 2: Create dedicated admin user
      console.log('Method 2: Create dedicated admin account');
      console.log('─'.repeat(70));
      console.log(`INSERT INTO admin_users (email, password_hash, full_name, admin_role, is_active)`);
      console.log(`VALUES (`);
      console.log(`  '${email}',`);
      console.log(`  '${hash}',`);
      console.log(`  '${fullName || 'Admin User'}',`);
      console.log(`  '${role}',`);
      console.log(`  true`);
      console.log(`);\n`);
      
      // Verification
      console.log('Verify the admin was created:');
      console.log('─'.repeat(70));
      console.log(`SELECT * FROM users WHERE email = '${email}' AND "isAdmin" = true;`);
      console.log(`-- OR`);
      console.log(`SELECT * FROM admin_users WHERE email = '${email}';\n`);
      
      console.log('═'.repeat(70));
      console.log('');
    } else {
      console.log('💡 Tip: To generate SQL commands, provide email and name:');
      console.log(`   node scripts/hash-password.js "${password}" admin@company.com "Admin Name" super_admin\n`);
    }

    // Security warnings
    console.log('⚠️  SECURITY REMINDERS:');
    console.log('─'.repeat(70));
    console.log('1. ✅ Use strong passwords (mix of uppercase, lowercase, numbers, symbols)');
    console.log('2. ✅ Never commit passwords or hashes to version control');
    console.log('3. ✅ Change default admin passwords immediately');
    console.log('4. ✅ Store passwords securely (use password manager)');
    console.log('5. ✅ Logout and login again after granting admin access');
    console.log('═'.repeat(70));
    console.log('');
    
    // Next steps
    if (email) {
      console.log('📌 NEXT STEPS:');
      console.log('─'.repeat(70));
      console.log('1. Run one of the SQL commands above in your database');
      console.log('2. Logout from the application');
      console.log('3. Login with the admin credentials');
      console.log('4. Navigate to http://localhost:3000/admin/dashboard');
      console.log('═'.repeat(70));
      console.log('');
    }
  })
  .catch(error => {
    console.error('❌ Error generating hash:', error.message);
    process.exit(1);
  });
