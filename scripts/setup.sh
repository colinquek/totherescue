#!/bin/bash
# Setup script for MailSage Email Querying Toolkit (Go version)
# Installs Go and builds binaries

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "==================================="
echo "MailSage Email Query - Setup (Go)"
echo "==================================="
echo ""

# Check Go version
echo "Checking Go version..."
GO_VERSION=$(go version 2>&1 || echo "not installed")
if [[ "$GO_VERSION" == "not installed" ]]; then
  echo "Go is not installed"
  echo "   Please install Go 1.21 or higher from https://go.dev/dl/"
  exit 1
fi

echo "$GO_VERSION"
echo ""

# Download Go dependencies
echo "Downloading Go dependencies..."
go mod download
echo "Dependencies downloaded"
echo ""

# Build binaries
echo "Building binaries..."
make build
echo "Binaries built successfully"
echo ""

# Verify binaries
echo "Verifying binaries..."
if [ -f "bin/extract-tokens" ] && [ -f "bin/test-chat" ] && [ -f "bin/run-queries" ]; then
  echo "All binaries found in bin/"
  ls -lh bin/
else
  echo "Some binaries are missing"
  exit 1
fi
echo ""

echo "==================================="
echo "Setup complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "  1. Run './scripts/run-tests.sh' to start email querying"
echo "     - Automatically extracts tokens (opens browser)"
echo "     - You login to SomeGPT once"
echo "     - Runs email query with fresh tokens"
echo ""
echo "  2. Tokens are saved to .env.local (gitignored, never commit!)"
echo "     - Valid for ~1 hour"
echo "     - Script auto-refreshes when expired"
echo ""
echo "  3. Or run individual commands:"
echo "     ./bin/extract-tokens  # Extract fresh tokens"
echo "     ./bin/test-chat       # Test API connection"
echo "     ./bin/run-queries       # Run email query"
echo ""
