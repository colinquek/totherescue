#!/bin/bash
# Setup script for SomeGPT Load Testing Toolkit
# Installs all required dependencies

set -e

echo "==================================="
echo "SomeGPT Load Test - Setup"
echo "==================================="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node --version 2>&1 || echo "not installed")
if [[ "$NODE_VERSION" == "not installed" ]]; then
  echo "❌ Node.js is not installed"
  echo "   Please install Node.js v18 or higher from https://nodejs.org/"
  exit 1
fi

echo "✅ Node.js: $NODE_VERSION"

# Check npm
echo "Checking npm..."
NPM_VERSION=$(npm --version 2>&1 || echo "not installed")
if [[ "$NPM_VERSION" == "not installed" ]]; then
  echo "❌ npm is not installed"
  echo "   npm comes with Node.js. Please reinstall Node.js."
  exit 1
fi

echo "✅ npm: $NPM_VERSION"
echo ""

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Install Playwright browser
echo "Installing Playwright browser (Chromium)..."
echo "   This is a one-time download (~150MB)"
npx playwright install chromium
echo "✅ Playwright browser installed"
echo ""

# Check if on Linux and offer to install system dependencies
if [[ "$OSTYPE" == "linux-gnu"* ]] && [[ ! "$OSTYPE" == "linux-musl"* ]]; then
  echo "Detected Linux system."
  echo "Playwright requires system dependencies to run Chromium."
  echo ""
  read -p "Install system dependencies now? (requires sudo) [y/N]: " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Installing system dependencies..."
    npx playwright install-deps chromium
    echo "✅ System dependencies installed"
  else
    echo "⚠️  Skipping system dependencies"
    echo "   If browser automation fails, run: npx playwright install-deps chromium"
  fi
  echo ""
fi

echo "==================================="
echo "✅ Setup complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "  1. Run './scripts/run-tests.sh' to start load testing"
echo "     - Automatically extracts tokens (opens browser)"
echo "     - You login to SomeGPT once"
echo "     - Runs load test with fresh tokens"
echo ""
echo "  2. Tokens are saved to .env.local (gitignored, never commit!)"
echo "     - Valid for ~1 hour"
echo "     - Script auto-refreshes when expired"
echo ""
