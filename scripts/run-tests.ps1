# Run SomeGPT email querys with automatic token validation (PowerShell)
# Checks token validity, extracts fresh tokens if needed, then runs email query

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Set-Location $ProjectRoot

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "MailSage Email Query Runner" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if .env.local exists
if (-not (Test-Path ".env.local")) {
  Write-Host "No tokens found. Extracting fresh tokens..." -ForegroundColor Yellow
  Write-Host ""
  .\bin\extract-tokens.exe
  Write-Host ""
}

# Step 2: Validate tokens with a test API call
Write-Host "Validating tokens..."
.\bin\test-chat.exe *> $null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Tokens are valid" -ForegroundColor Green
} else {
  Write-Host "Tokens are invalid or expired" -ForegroundColor Yellow
  Write-Host "Extracting fresh tokens..." -ForegroundColor Yellow
  Write-Host ""
  .\bin\extract-tokens.exe
  Write-Host ""
  
  # Validate again after extraction
  .\bin\test-chat.exe *> $null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Token validation failed. Please try again." -ForegroundColor Red
    exit 1
  fi
  Write-Host "Tokens validated" -ForegroundColor Green
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Starting Email Query" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Step 3: Run email query
.\bin\run-queries.exe
$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
if ($exitCode -eq 0) {
  Write-Host "Load test completed successfully!" -ForegroundColor Green
} else {
  Write-Host "Load test completed with errors" -ForegroundColor Yellow
}
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Step 4: Show latest results
Write-Host "Latest Results:" -ForegroundColor Cyan
$latestResult = Get-ChildItem -Path "results\*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($latestResult) {
  Write-Host "   File: $($latestResult.FullName)"
  Write-Host ""
  Write-Host "Summary:"
  $json = Get-Content $latestResult.FullName -Raw | ConvertFrom-Json
  $summary = $json.summary
  Write-Host "   Total Requests: $($summary.totalRequests)"
  Write-Host "   Success Rate: $($summary.successRate)%"
  Write-Host "   Avg Response Time: $([math]::Round($summary.avgResponseTime, 2))ms"
  Write-Host "   Total Tokens: $($summary.totalTokens)"
} else {
  Write-Host "   No results found in results/ directory"
}

Write-Host ""
exit $exitCode
