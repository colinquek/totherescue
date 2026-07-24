# Setup script for SomeGPT Load Testing Toolkit (PowerShell)
# Installs all required dependencies

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "SomeGPT Load Test - Setup" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "Checking Node.js version..."
try {
  $nodeVersion = node --version
  Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
  Write-Host "❌ Node.js is not installed" -ForegroundColor Red
  Write-Host "   Please install Node.js v18 or higher from https://nodejs.org/"
  exit 1
}

# Check npm
Write-Host "Checking npm..."
try {
  $npmVersion = npm --version
  Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
  Write-Host "❌ npm is not installed" -ForegroundColor Red
  Write-Host "   npm comes with Node.js. Please reinstall Node.js."
  exit 1
}

Write-Host ""

# Install Node.js dependencies
Write-Host "Installing Node.js dependencies..."
npm install
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Install Playwright browser
Write-Host "Installing Playwright browser (Chromium)..."
Write-Host "   This is a one-time download (~150MB)"
npx playwright install chromium
Write-Host "✅ Playwright browser installed" -ForegroundColor Green
Write-Host ""

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Run '.\scripts\run-tests.ps1' to start load testing" -ForegroundColor White
Write-Host "     - Automatically extracts tokens (opens browser)"
Write-Host "     - You login to SomeGPT once"
Write-Host "     - Runs load test with fresh tokens"
Write-Host ""
Write-Host "  2. Tokens are saved to .env.local (gitignored, never commit!)" -ForegroundColor Yellow
Write-Host "     - Valid for ~1 hour"
Write-Host "     - Script auto-refreshes when expired"
Write-Host ""
