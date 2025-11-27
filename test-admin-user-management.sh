#!/bin/bash

# Test Admin User Management Refactor
# This script tests the new endpoints and functionality

echo "🧪 Testing Admin User Management Refactor"
echo "=========================================="
echo ""

# Configuration
BACKEND_URL="http://localhost:3001"
ADMIN_TOKEN=""  # Replace with actual super_admin token

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Test 1: Create Organization
echo "📝 Test 1: Create Organization"
echo "------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/v1/admin/users/organizations" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Corp",
    "subdomain": "testcorp",
    "plan": "starter"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Organization created successfully"
    ORG_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "   Organization ID: $ORG_ID"
else
    print_result 1 "Failed to create organization (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
fi
echo ""

# Test 2: Create Platform Team User
echo "📝 Test 2: Create Platform Team User"
echo "------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/v1/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "platform.test@example.com",
    "firstName": "Platform",
    "lastName": "Tester",
    "password": "TestPass123!",
    "role": "member",
    "userType": "platform_team",
    "isAdmin": true,
    "adminRole": "support"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Platform team user created successfully"
    PLATFORM_USER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "   User ID: $PLATFORM_USER_ID"
    
    # Verify organizationId is null
    ORG_ID_NULL=$(echo "$BODY" | grep '"organizationId":null')
    if [ -n "$ORG_ID_NULL" ]; then
        print_result 0 "   ✓ organizationId is null (correct for platform team)"
    else
        print_result 1 "   ✗ organizationId should be null"
    fi
else
    print_result 1 "Failed to create platform team user (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
fi
echo ""

# Test 3: Create Customer User
echo "📝 Test 3: Create Customer User"
echo "-------------------------------"
if [ -n "$ORG_ID" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/v1/admin/users" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"customer.test@example.com\",
        \"firstName\": \"Customer\",
        \"lastName\": \"Tester\",
        \"password\": \"TestPass123!\",
        \"organizationId\": \"$ORG_ID\",
        \"role\": \"admin\",
        \"userType\": \"customer\"
      }")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
        print_result 0 "Customer user created successfully"
        CUSTOMER_USER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        echo "   User ID: $CUSTOMER_USER_ID"
        
        # Verify organizationId is set
        HAS_ORG=$(echo "$BODY" | grep "\"organizationId\":\"$ORG_ID\"")
        if [ -n "$HAS_ORG" ]; then
            print_result 0 "   ✓ organizationId is set (correct for customer user)"
        else
            print_result 1 "   ✗ organizationId should be set"
        fi
    else
        print_result 1 "Failed to create customer user (HTTP $HTTP_CODE)"
        echo "   Response: $BODY"
    fi
else
    print_result 1 "Skipped (no organization ID from Test 1)"
fi
echo ""

# Test 4: Filter Platform Team Users
echo "📝 Test 4: Filter Platform Team Users"
echo "-------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/v1/admin/users?organizationId=platform_team" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Platform team filter working"
    USER_COUNT=$(echo "$BODY" | grep -o '"users":\[' | wc -l)
    echo "   Retrieved platform team users"
else
    print_result 1 "Failed to filter platform team users (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
fi
echo ""

# Test 5: Get All Users
echo "📝 Test 5: Get All Users"
echo "------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/v1/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Retrieved all users successfully"
    TOTAL=$(echo "$BODY" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    echo "   Total users: $TOTAL"
else
    print_result 1 "Failed to get all users (HTTP $HTTP_CODE)"
fi
echo ""

# Test 6: Validation - Create Customer User Without Organization
echo "📝 Test 6: Validation Test"
echo "--------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/v1/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid.test@example.com",
    "firstName": "Invalid",
    "lastName": "Test",
    "password": "TestPass123!",
    "role": "member",
    "userType": "customer"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
    print_result 0 "Validation working (correctly rejected customer user without org)"
    echo "   Error message: $(echo "$BODY" | grep -o '"message":"[^"]*' | cut -d'"' -f4)"
else
    print_result 1 "Validation failed (should return 400 for customer user without org)"
fi
echo ""

# Test 7: Duplicate Subdomain Check
echo "📝 Test 7: Duplicate Subdomain Check"
echo "------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/v1/admin/users/organizations" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Duplicate Test",
    "subdomain": "testcorp",
    "plan": "starter"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
    print_result 0 "Duplicate subdomain validation working"
    echo "   Error message: $(echo "$BODY" | grep -o '"message":"[^"]*' | cut -d'"' -f4)"
else
    print_result 1 "Should reject duplicate subdomain"
fi
echo ""

# Cleanup (optional)
echo "🧹 Cleanup"
echo "----------"
echo "To clean up test data, you can manually delete:"
if [ -n "$ORG_ID" ]; then
    echo "  - Organization: $ORG_ID"
fi
if [ -n "$PLATFORM_USER_ID" ]; then
    echo "  - Platform User: $PLATFORM_USER_ID"
fi
if [ -n "$CUSTOMER_USER_ID" ]; then
    echo "  - Customer User: $CUSTOMER_USER_ID"
fi
echo ""

echo "=========================================="
echo "✅ Tests completed!"
echo ""
echo "Next Steps:"
echo "1. Review test results above"
echo "2. Test the UI at http://localhost:3000/admin/users"
echo "3. Try creating organizations and users through the interface"
echo ""
