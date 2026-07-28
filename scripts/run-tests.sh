#!/bin/bash
# Run SomeGPT email querys with automatic token validation
# Checks token validity, extracts fresh tokens if needed, then runs email query

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "==================================="
echo "MailSage Email Query Runner"
echo "==================================="
echo ""

# Step 1: Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo "No tokens found. Extracting fresh tokens..."
  echo ""
  ./bin/extract-tokens
  echo ""
fi

# Step 2: Validate tokens with a test API call
echo "Validating tokens..."
if ./bin/test-chat > /dev/null 2>&1; then
  echo "Tokens are valid"
else
  echo "Tokens are invalid or expired"
  echo "Extracting fresh tokens..."
  echo ""
  ./bin/extract-tokens
  echo ""
  
  # Validate again after extraction
  if ! ./bin/test-chat > /dev/null 2>&1; then
    echo "Token validation failed. Please try again."
    exit 1
  fi
  echo "Tokens validated"
fi

echo ""
echo "==================================="
echo "Starting Load Test"
echo "==================================="
echo ""

# Step 3: Run email query
./bin/run-queries

EXIT_CODE=$?

echo ""
echo "==================================="
if [ $EXIT_CODE -eq 0 ]; then
  echo "Load test completed successfully!"
else
  echo "Load test completed with errors"
fi
echo "==================================="
echo ""

# Step 4: Show latest results
echo "Latest Results:"
LATEST_RESULT=$(ls -t results/*.json 2>/dev/null | head -1)
if [ -n "$LATEST_RESULT" ]; then
  echo "   File: $LATEST_RESULT"
  echo ""
  echo "Summary:"
  cat "$LATEST_RESULT" | grep -A 10 '"summary"' || true
else
  echo "   No results found in results/ directory"
fi

echo ""
exit $EXIT_CODE
