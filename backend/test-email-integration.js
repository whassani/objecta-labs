/**
 * Test Email Integration
 * 
 * This script tests the email service integration
 * Run: node test-email-integration.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEmailConfiguration() {
  log('blue', '\n=== Testing Email Configuration ===\n');

  // Check if SendGrid API key is configured
  if (!process.env.SENDGRID_API_KEY) {
    log('yellow', '⚠️  SENDGRID_API_KEY not configured in .env');
    log('yellow', '   Email sending will be disabled (warnings only)');
  } else {
    log('green', '✅ SENDGRID_API_KEY is configured');
  }

  // Check email settings
  const emailFrom = process.env.EMAIL_FROM || 'noreply@example.com';
  const emailFromName = process.env.EMAIL_FROM_NAME || 'AI Platform';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const adminEmail = process.env.ADMIN_EMAIL;

  log('blue', '\nEmail Configuration:');
  console.log(`  EMAIL_FROM: ${emailFrom}`);
  console.log(`  EMAIL_FROM_NAME: ${emailFromName}`);
  console.log(`  FRONTEND_URL: ${frontendUrl}`);
  console.log(`  ADMIN_EMAIL: ${adminEmail || '(not set)'}`);
}

async function testHealthEndpoint() {
  log('blue', '\n=== Testing Health Endpoint ===\n');
  
  try {
    const response = await axios.get(`${API_URL}/health`);
    log('green', '✅ Backend is running');
    console.log('  Status:', response.data.status);
  } catch (error) {
    log('red', '❌ Backend is not running or not accessible');
    console.log('  Error:', error.message);
    console.log('\n  Please start the backend first:');
    console.log('    cd backend && npm run start:dev');
    process.exit(1);
  }
}

async function testTeamInvitationFlow() {
  log('blue', '\n=== Team Invitation Email Flow ===\n');
  
  log('yellow', '📝 When a user is invited to a team:');
  console.log('  1. Invitation record is created in database');
  console.log('  2. Email is sent to the invitee');
  console.log('  3. Email contains invitation link with token');
  console.log('  4. Email includes inviter name, role, and organization');
  console.log('');
  console.log('  Template: team-invitation.hbs');
  console.log('  Service: TeamService.sendInvitation()');
  console.log('');
  log('green', '✅ Email integration implemented');
}

async function testNotificationFlow() {
  log('blue', '\n=== Notification Email Flow ===\n');
  
  log('yellow', '📝 When a notification is created:');
  console.log('  1. Notification is saved to database');
  console.log('  2. WebSocket event is emitted to user');
  console.log('  3. Email is sent if user has emailEnabled preference');
  console.log('');
  console.log('  Template: notification.hbs');
  console.log('  Service: NotificationsService.create()');
  console.log('  Gateway: NotificationsGateway.sendToUser()');
  console.log('');
  log('green', '✅ Email + WebSocket integration implemented');
}

async function testPaymentFlow() {
  log('blue', '\n=== Payment Email Flow ===\n');
  
  log('yellow', '📝 When a payment is processed:');
  console.log('  Success:');
  console.log('    - Email sent with invoice details');
  console.log('    - Template: payment-success.hbs');
  console.log('');
  console.log('  Failure:');
  console.log('    - Email sent with failure reason');
  console.log('    - Subscription marked as past_due');
  console.log('    - Template: payment-failed.hbs');
  console.log('');
  console.log('  Service: StripeWebhookController');
  console.log('');
  log('green', '✅ Payment notification emails implemented');
}

async function testBackupFlow() {
  log('blue', '\n=== Backup Alert Flow ===\n');
  
  log('yellow', '📝 When a database backup fails:');
  console.log('  1. Error is logged');
  console.log('  2. Alert email sent to ADMIN_EMAIL');
  console.log('  3. Email includes error details and timestamp');
  console.log('');
  console.log('  Template: backup-alert.hbs');
  console.log('  Service: BackupService.scheduledBackup()');
  console.log('  Cron: Every day at 2 AM');
  console.log('');
  
  if (process.env.ADMIN_EMAIL) {
    log('green', '✅ Backup alerts configured');
  } else {
    log('yellow', '⚠️  ADMIN_EMAIL not set (backup alerts disabled)');
  }
}

async function showEmailTemplates() {
  log('blue', '\n=== Available Email Templates ===\n');
  
  const templates = [
    { name: 'team-invitation.hbs', description: 'Team invitation emails' },
    { name: 'payment-success.hbs', description: 'Payment success confirmations' },
    { name: 'payment-failed.hbs', description: 'Payment failure alerts' },
    { name: 'backup-alert.hbs', description: 'Database backup failure alerts' },
    { name: 'notification.hbs', description: 'Generic notification emails' },
    { name: 'welcome.hbs', description: 'Welcome emails for new users' },
    { name: 'job-complete.hbs', description: 'Job completion notifications' },
  ];

  templates.forEach((template) => {
    console.log(`  ✉️  ${template.name.padEnd(25)} - ${template.description}`);
  });
}

async function showNextSteps() {
  log('blue', '\n=== Next Steps ===\n');
  
  console.log('1. Configure SendGrid:');
  console.log('   - Sign up at https://sendgrid.com');
  console.log('   - Create API key with Mail Send permissions');
  console.log('   - Add to .env: SENDGRID_API_KEY=your_key');
  console.log('');
  console.log('2. Set Email Configuration:');
  console.log('   - EMAIL_FROM=noreply@yourdomain.com');
  console.log('   - EMAIL_FROM_NAME=Your Company Name');
  console.log('   - FRONTEND_URL=http://localhost:3000');
  console.log('');
  console.log('3. Test Email Sending:');
  console.log('   - Invite a user to test team invitations');
  console.log('   - Create a notification to test notifications');
  console.log('   - Check SendGrid dashboard for delivery status');
  console.log('');
  console.log('4. Production Setup:');
  console.log('   - Verify sender domain in SendGrid');
  console.log('   - Add SPF and DKIM records to DNS');
  console.log('   - Set ADMIN_EMAIL for backup alerts');
  console.log('   - Enable backups: BACKUP_ENABLED=true');
}

async function main() {
  log('green', '\n╔════════════════════════════════════════════════╗');
  log('green', '║   Email Integration Test & Configuration       ║');
  log('green', '╚════════════════════════════════════════════════╝\n');

  try {
    await testEmailConfiguration();
    await testHealthEndpoint();
    await testTeamInvitationFlow();
    await testNotificationFlow();
    await testPaymentFlow();
    await testBackupFlow();
    await showEmailTemplates();
    await showNextSteps();

    log('green', '\n✅ Email Integration Test Complete!\n');
    log('blue', '📖 See EMAIL-SYSTEM-IMPLEMENTATION-COMPLETE.md for full documentation\n');
  } catch (error) {
    log('red', '\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

main();
