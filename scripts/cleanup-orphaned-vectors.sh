#!/bin/bash

# Cleanup Orphaned Vectors Script
# This script helps you clean up orphaned vectors from Qdrant after deploying the fix

echo "=== Orphaned Vectors Cleanup Script ==="
echo ""

# Check if backend is running
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "❌ Backend is not running. Please start it first."
    echo "   cd backend && npm run start:dev"
    exit 1
fi

echo "✅ Backend is running"
echo ""

# Prompt for JWT token
echo "To clean up orphaned vectors, you need to authenticate."
echo "Please provide a JWT token (with admin/organization access):"
read -p "JWT Token: " JWT_TOKEN

if [ -z "$JWT_TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

echo ""
echo "=== Step 1: Check Current Vector Store Status ==="
echo ""

VECTOR_INFO=$(curl -s -X GET http://localhost:3000/knowledge-base/vector-store/info \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "$VECTOR_INFO" | jq '.' 2>/dev/null || echo "$VECTOR_INFO"

echo ""
echo "=== Step 2: List Document IDs in Vector Store ==="
echo ""

VECTOR_DOCS=$(curl -s -X GET http://localhost:3000/knowledge-base/vector-store/document-ids \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "$VECTOR_DOCS" | jq '.' 2>/dev/null || echo "$VECTOR_DOCS"

echo ""
read -p "Do you want to proceed with cleanup? (y/n): " PROCEED

if [ "$PROCEED" != "y" ] && [ "$PROCEED" != "Y" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "=== Step 3: Running Cleanup ==="
echo ""

CLEANUP_RESULT=$(curl -s -X POST http://localhost:3000/knowledge-base/vector-store/cleanup-orphaned \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "$CLEANUP_RESULT" | jq '.' 2>/dev/null || echo "$CLEANUP_RESULT"

echo ""
echo "=== Step 4: Verify Cleanup Results ==="
echo ""

VECTOR_INFO_AFTER=$(curl -s -X GET http://localhost:3000/knowledge-base/vector-store/info \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "$VECTOR_INFO_AFTER" | jq '.' 2>/dev/null || echo "$VECTOR_INFO_AFTER"

echo ""
echo "=== Cleanup Complete! ==="
echo ""
echo "Summary:"
echo "--------"

# Extract numbers from JSON (works even without jq)
SCANNED=$(echo "$CLEANUP_RESULT" | grep -o '"scanned":[0-9]*' | grep -o '[0-9]*')
ORPHANED=$(echo "$CLEANUP_RESULT" | grep -o '"orphaned":[0-9]*' | grep -o '[0-9]*')
DELETED=$(echo "$CLEANUP_RESULT" | grep -o '"deleted":[0-9]*' | grep -o '[0-9]*')
ERRORS=$(echo "$CLEANUP_RESULT" | grep -o '"errors":[0-9]*' | grep -o '[0-9]*')

echo "- Vectors scanned: ${SCANNED:-N/A}"
echo "- Orphaned vectors found: ${ORPHANED:-N/A}"
echo "- Successfully deleted: ${DELETED:-N/A}"
echo "- Errors: ${ERRORS:-N/A}"
echo ""

if [ "${ORPHANED:-0}" -eq "0" ]; then
    echo "✅ No orphaned vectors found! Your vector store is clean."
elif [ "${DELETED:-0}" -eq "${ORPHANED:-0}" ]; then
    echo "✅ All orphaned vectors were successfully removed!"
else
    echo "⚠️  Some orphaned vectors could not be deleted. Check the logs for details."
fi

echo ""
echo "Logs are available in the backend application logs."
echo "Filter with: grep '\[Orphan Cleanup\]' logs/application.log"
