#!/bin/bash

# Vector Store Monitoring Script
# Run this periodically to check the health of your vector store

echo "=== Vector Store Monitoring Dashboard ==="
echo ""

# Check if backend is running
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "❌ Backend is not running"
    exit 1
fi

echo "✅ Backend is running"
echo ""

# Get JWT token from argument or environment
JWT_TOKEN="${1:-$VECTOR_STORE_JWT_TOKEN}"

if [ -z "$JWT_TOKEN" ]; then
    echo "Usage: $0 <JWT_TOKEN>"
    echo "Or set VECTOR_STORE_JWT_TOKEN environment variable"
    exit 1
fi

BASE_URL="${VECTOR_STORE_BASE_URL:-http://localhost:3000}"

echo "=== Vector Store Statistics ==="
echo ""

# Get vector store info
VECTOR_INFO=$(curl -s -X GET "$BASE_URL/knowledge-base/vector-store/info" \
  -H "Authorization: Bearer $JWT_TOKEN")

if [ $? -ne 0 ]; then
    echo "❌ Failed to fetch vector store info"
    exit 1
fi

echo "$VECTOR_INFO" | jq '.' 2>/dev/null || echo "$VECTOR_INFO"

# Extract stats
VECTOR_COUNT=$(echo "$VECTOR_INFO" | jq -r '.vectorsCount // 0' 2>/dev/null || echo "0")
POINTS_COUNT=$(echo "$VECTOR_INFO" | jq -r '.pointsCount // 0' 2>/dev/null || echo "0")
STATUS=$(echo "$VECTOR_INFO" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")

echo ""
echo "=== Database Document Count ==="
echo ""

# Get document count from database
DOCUMENTS=$(curl -s -X GET "$BASE_URL/knowledge-base/documents" \
  -H "Authorization: Bearer $JWT_TOKEN")

DOC_COUNT=$(echo "$DOCUMENTS" | jq '. | length' 2>/dev/null || echo "0")

echo "Documents in database: $DOC_COUNT"

echo ""
echo "=== Vector Store Document IDs ==="
echo ""

# Get document IDs in vector store
VECTOR_DOCS=$(curl -s -X GET "$BASE_URL/knowledge-base/vector-store/document-ids" \
  -H "Authorization: Bearer $JWT_TOKEN")

VECTOR_DOC_COUNT=$(echo "$VECTOR_DOCS" | jq -r '.count // 0' 2>/dev/null || echo "0")

echo "Unique documents in vector store: $VECTOR_DOC_COUNT"

echo ""
echo "=== Health Check Summary ==="
echo ""

# Compare counts
if [ "$VECTOR_DOC_COUNT" -eq "$DOC_COUNT" ]; then
    echo "✅ Vector store in sync with database ($DOC_COUNT documents)"
elif [ "$VECTOR_DOC_COUNT" -gt "$DOC_COUNT" ]; then
    DIFF=$((VECTOR_DOC_COUNT - DOC_COUNT))
    echo "⚠️  Vector store has $DIFF MORE documents than database"
    echo "   This may indicate orphaned vectors"
    echo "   Run: curl -X POST $BASE_URL/knowledge-base/vector-store/cleanup-orphaned"
elif [ "$VECTOR_DOC_COUNT" -lt "$DOC_COUNT" ]; then
    DIFF=$((DOC_COUNT - VECTOR_DOC_COUNT))
    echo "⚠️  Database has $DIFF MORE documents than vector store"
    echo "   Some documents may not be indexed"
    echo "   Run: curl -X POST $BASE_URL/knowledge-base/documents/reindex-all"
fi

echo ""

# Check Qdrant status
if [ "$STATUS" = "green" ]; then
    echo "✅ Qdrant status: $STATUS"
elif [ "$STATUS" = "yellow" ]; then
    echo "⚠️  Qdrant status: $STATUS (degraded performance)"
elif [ "$STATUS" = "red" ]; then
    echo "❌ Qdrant status: $STATUS (critical issues)"
else
    echo "❓ Qdrant status: $STATUS"
fi

echo ""

# Check vector count per document ratio
if [ "$VECTOR_DOC_COUNT" -gt 0 ]; then
    AVG_VECTORS=$((VECTOR_COUNT / VECTOR_DOC_COUNT))
    echo "Average vectors per document: $AVG_VECTORS"
    
    if [ "$AVG_VECTORS" -lt 5 ]; then
        echo "⚠️  Low vectors per document (may indicate small documents)"
    elif [ "$AVG_VECTORS" -gt 100 ]; then
        echo "⚠️  High vectors per document (may indicate large documents)"
    else
        echo "✅ Normal vectors per document ratio"
    fi
fi

echo ""
echo "=== Recent Deletion Logs ==="
echo ""

# Check logs if available
if [ -f "logs/application.log" ]; then
    echo "Last 5 vector deletion operations:"
    grep "\[Vector Deletion\]" logs/application.log | tail -5
    echo ""
    
    echo "Last 3 cleanup operations:"
    grep "\[Orphan Cleanup\] Completed" logs/application.log | tail -3
elif [ -f "../logs/application.log" ]; then
    echo "Last 5 vector deletion operations:"
    grep "\[Vector Deletion\]" ../logs/application.log | tail -5
    echo ""
    
    echo "Last 3 cleanup operations:"
    grep "\[Orphan Cleanup\] Completed" ../logs/application.log | tail -3
else
    echo "Log file not found (checked logs/application.log)"
fi

echo ""
echo "=== Recommendations ==="
echo ""

# Provide recommendations based on findings
if [ "$VECTOR_DOC_COUNT" -gt "$DOC_COUNT" ]; then
    echo "1. Run cleanup utility to remove orphaned vectors"
    echo "   ./tmp_rovodev_cleanup_orphaned_vectors.sh"
fi

if [ "$VECTOR_DOC_COUNT" -lt "$DOC_COUNT" ]; then
    echo "1. Re-index missing documents"
    echo "   curl -X POST $BASE_URL/knowledge-base/documents/reindex-all"
fi

if [ "$STATUS" != "green" ]; then
    echo "1. Check Qdrant service health"
    echo "   docker ps | grep qdrant"
    echo "   docker logs qdrant"
fi

# Calculate recommended cleanup frequency
if [ "$VECTOR_COUNT" -gt 10000 ]; then
    echo "1. Run cleanup weekly (large vector store)"
elif [ "$VECTOR_COUNT" -gt 1000 ]; then
    echo "1. Run cleanup bi-weekly (medium vector store)"
else
    echo "1. Run cleanup monthly (small vector store)"
fi

echo ""
echo "=== Monitoring Complete ==="
echo ""
echo "Run this script periodically to monitor vector store health"
echo "Set up a cron job for automated monitoring:"
echo "0 */6 * * * /path/to/monitor-vector-store.sh \$JWT_TOKEN >> /var/log/vector-store-monitor.log 2>&1"
