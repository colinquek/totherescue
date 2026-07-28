# Setup script for MailSage Email Querying Toolkit (PowerShell, Go version)
# Installs Go dependencies and builds binaries

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "MailSage Email Query - Setup (Go)" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Check Go version
Write-Host "Checking Go version..."
try {
  $goVersion = go version
  Write-Host "$goVersion" -ForegroundColor Green
} catch {
  Write-Host "Go is not installed" -ForegroundColor Red
  Write-Host "   Please install Go 1.21 or higher from https://go.dev/dl/"
  exit 1
}

Write-Host ""

# Download Go dependencies
Write-Host "Downloading Go dependencies..."
go mod download
Write-Host "Dependencies downloaded" -ForegroundColor Green
Write-Host ""

# Build binaries
Write-Host "Building binaries..."
$env:GOOS = "windows"
$env:GOARCH = "amd64"
go build -o bin/extract-tokens.exe ./cmd/extract-tokens
go build -o bin/test-chat.exe ./cmd/test-chat
go build -o bin/run-queries.exe ./cmd/run-queries
Write-Host "Binaries built successfully" -ForegroundColor Green
Write-Host ""

# Verify binaries
Write-Host "Verifying binaries..."
if ((Test-Path "bin\extract-tokens.exe") -and (Test-Path "bin\test-chat.exe") -and (Test-Path "bin\run-queries.exe")) {
  Write-Host "All binaries found in bin/" -ForegroundColor Green
  Get-ChildItem bin\*.exe | Format-Table Name, Length
} else {
  Write-Host "Some binaries are missing" -ForegroundColor Red
  exit 1
}
Write-Host ""

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Run '.\scripts\run-tests.ps1' to start email querying" -ForegroundColor White
Write-Host "     - Automatically extracts tokens (opens browser)"
Write-Host "     - You login to SomeGPT once"
Write-Host "     - Runs email query with fresh tokens"
Write-Host ""
Write-Host "  2. Tokens are saved to .env.local (gitignored, never commit!)" -ForegroundColor Yellow
Write-Host "     - Valid for ~1 hour"
Write-Host "     - Script auto-refreshes when expired"
Write-Host ""
Write-Host "  3. Or run individual commands:"
Write-Host "     .\bin\extract-tokens.exe  # Extract fresh tokens"
Write-Host "     .\bin\test-chat.exe       # Test API connection"
Write-Host "     .\bin\run-queries.exe       # Run email query"
Write-Host ""
