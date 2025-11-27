#!/bin/bash
# Quick script to assign Owner role to yourself

echo "🔐 Assign Owner Role to User"
echo "════════════════════════════════════════"
echo ""

# Get user email
read -p "Enter your email address: " USER_EMAIL

if [ -z "$USER_EMAIL" ]; then
  echo "❌ Email is required"
  exit 1
fi

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Build connection string
DB_URL="postgresql://${DATABASE_USER:-postgres}:${DATABASE_PASSWORD:-postgres}@${DATABASE_HOST:-localhost}:${DATABASE_PORT:-5432}/${DATABASE_NAME:-objecta-labs}"

echo "📧 Looking for user: $USER_EMAIL"
echo ""

# Check if user exists
USER_EXISTS=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM users WHERE email = '$USER_EMAIL';" 2>/dev/null)

if [ -z "$USER_EXISTS" ] || [ "$USER_EXISTS" -eq 0 ]; then
  echo "❌ User not found with email: $USER_EMAIL"
  echo ""
  echo "Available users:"
  psql "$DB_URL" -c "SELECT email FROM users;" 2>/dev/null
  exit 1
fi

# Assign owner role
echo "👑 Assigning Owner role..."
psql "$DB_URL" -c "
INSERT INTO user_role_assignments (user_id, role_id, organization_id, granted_by)
SELECT u.id, r.id, u.organization_id, u.id
FROM users u
CROSS JOIN roles r
WHERE r.name = 'owner' AND u.email = '$USER_EMAIL'
ON CONFLICT (user_id, role_id, organization_id, COALESCE(workspace_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
" 2>/dev/null

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Owner role assigned successfully!"
  echo ""
  echo "📊 Your roles:"
  psql "$DB_URL" -c "
  SELECT r.\"displayName\" as \"Role\", r.level as \"Level\", jsonb_array_length(r.permissions) as \"Permissions\"
  FROM user_role_assignments ura
  JOIN users u ON ura.user_id = u.id
  JOIN roles r ON ura.role_id = r.id
  WHERE u.email = '$USER_EMAIL'
  ORDER BY r.level DESC;
  " 2>/dev/null
  
  echo ""
  echo "🎉 You now have full Owner access!"
  echo "   Access permission management: http://localhost:3000/dashboard/permissions"
else
  echo "❌ Failed to assign role"
  exit 1
fi
