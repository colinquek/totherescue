<div align="center">
  <img src="totherescue.png" alt="totherescue" width="256" height="256" />
</div>

# MailSage - Email Best Practice Prompter

Automated API discovery, token extraction, and email querying for SomeGPT (NCS GPT platform).

**Built with Go** - Single binary deployment, no runtime dependencies.

## What This Does

This toolkit helps you:
1. **Extract fresh authentication tokens** automatically from your browser
2. **Test the SomeGPT API** directly (no browser needed)
3. **Run email queries** with sequential question execution
4. **Track metrics** - response times, token usage, success rates

## Quick Start

### For First-Time Users

**Run the setup script:**

```bash
# Linux/Mac (WSL)
./scripts/setup.sh

# Windows (PowerShell)
.\scripts\setup.ps1
```

This will:
- Check Go installation (requires Go 1.21+)
- Download dependencies
- Build binaries (`bin/extract-tokens`, `bin/test-chat`, `bin/run-queries`)

### Step 1: Extract Fresh Tokens

Tokens expire every ~1 hour, so extract fresh ones before testing:

```bash
./bin/extract-tokens
```

**What happens:**
- Opens browser with SomeGPT
- You send any message (e.g., "test")
- Script automatically captures auth tokens
- Saves to `.env.local` (gitignored)

### Step 2: Test API Connection

```bash
./bin/test-chat
```

**Expected output:**
```
✅ SUCCESS!
Response: data: [bot] Hello...
```

### Step 3: Run Email Queries

**Option 1: Smart Runner (Recommended)**

Automatically validates tokens and extracts fresh ones if needed:

```bash
# Linux/Mac (WSL)
./scripts/run-tests.sh

# Windows (PowerShell)
.\scripts\run-tests.ps1
```

**Option 2: Direct Email Query**

```bash
./bin/run-queries
```

**Default behavior:**
- Runs all 10 questions from `questions/` directory
- 1-minute pause between questions (configurable)
- Sequential execution (one question at a time)
- Saves results to `results/` folder

## Configuration

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Authentication cookie (auto-filled by capture script)
AUTH_TOKEN=your-token-here
API_KEY=your-api-key-here

# Optional: Graph token for Email Intelligence API
GRAPH_TOKEN=default-graph-token

# Conversation ID (use existing or leave blank for auto-gen)
CONVERSATION_ID=a6971918-50ca-455b-b822-13c780bdb05b

# Pause between prompts in minutes
PAUSE_MINUTES=1

# Test duration (0 = run once, >0 = minutes)
DURATION_MINUTES=0
```

## Understanding Results

### Email Query Summary

```
MailSage
===================

Sequential Test Summary
=========================
Questions Completed: 10/10
Successful: 9 (90.00%)
Failed: 1
Avg Response Time: 313.78ms
Total Tokens Generated: 22646
Total Duration: 9.87 minutes

Results saved to: results/run-queries-2026-07-28T13-43-08-000Z.json
```

### JSON Results

Each test run saves a detailed JSON file with:
- Per-question metrics (response time, tokens, success/failure)
- Summary statistics
- Full response bodies
- Error details

## For Other Users

### Sharing Email Queries with Your Team

**Option 1: Full Setup (They Extract Their Own Tokens)**

Share this repo with your team. They run:

```bash
# One-time setup
./scripts/setup.sh    # Linux/Mac
.\scripts\setup.ps1   # Windows

# Run tests (handles token extraction automatically)
./scripts/run-tests.sh    # Linux/Mac
.\scripts\run-tests.ps1   # Windows
```

**What they need:**
- Go 1.21+
- ~20MB for binaries
- Ability to login to SomeGPT (for token extraction)

**Option 2: Quick Start (You Provide Tokens)**

1. Extract tokens and endpoint on your machine:
   ```bash
   ./bin/extract-tokens
   ```

2. Share `.env.local` securely (NOT via git):
   - Use secure channel (Teams, email, password manager)
   - Tokens valid for ~1 hour
   - **Important:** Make sure `API_ENDPOINT` is included

3. They run:
   ```bash
   ./bin/run-queries
   ```

**What they need:**
- Go 1.21+ (or pre-built binaries)
- No browser/Playwright dependencies
- Fresh `.env.local` from you (hourly)

### Finding Conversation IDs

- Open SomeGPT conversation in browser
- URL format: `https://SomeGPT.ncs.com.sg/?conversation_id=SESSION-ID`
- Copy the `SESSION-ID` part

## How to Find the API Endpoint

If the API endpoint changes or you need to discover it from scratch:

### Browser DevTools Method

1. **Open SomeGPT in your browser**
   - Navigate to `https://ncsgpt.ncs.com.sg`
   - Login if needed

2. **Open Developer Tools**
   - Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Go to the **Network** tab
   - Filter by **Fetch** or **XHR**

3. **Capture the API Call**
   - Send any message in the chat (e.g., "test")
   - Look for a request to `/orchestrator/...` or similar path
   - Click on the request

4. **Extract the Details**
   - **URL**: Copy the full endpoint
   - **Headers**: Note `Authorization`, `X-API-Key`, `Content-Type`
   - **Request Body**: Copy the JSON payload structure

5. **Update Configuration**
   - Paste the new endpoint into `.env.local` as `API_ENDPOINT`
   - Update any changed headers in the code

### Quick Validation

After updating the endpoint:

```bash
./bin/test-chat

# Expected: "✅ SUCCESS!" with response data
```

## Scaling Email Queries

### For longer tests:

```bash
# Edit .env.local
DURATION_MINUTES=30

# Run
./bin/run-queries
```

## Troubleshooting

### "Command not found: ./bin/extract-tokens"

Build the binaries first:
```bash
./scripts/setup.sh
# or
make build
```

### "HTTP 401 Unauthorized"

- Tokens have expired (~1 hour lifetime)
- Re-run `./bin/extract-tokens` to get fresh tokens
- Or use the smart runner: `./scripts/run-tests.sh` (auto-refreshes tokens)

### "Go not installed"

Install Go 1.21 or higher:
```bash
# Check version
go version

# Download from https://go.dev/dl/
```

### Results Not Showing

Check the results directory:
```bash
ls -lt results/
cat results/run-queries-*.json
```

### "HTTP 429 Too Many Requests"

- Rate limiting detected
- Increase `PAUSE_MINUTES` in `.env`

## 📁 Project Structure

```
totherescue/
├── cmd/
│   ├── extract-tokens/    # Token extraction CLI
│   ├── test-chat/         # API validation CLI
│   └── run-queries/         # Load test CLI
├── internal/
│   ├── api/               # HTTP client
│   ├── config/            # Configuration loader
│   ├── questions/         # Question loader
│   └── tokens/            # Token extractor (rod-based)
├── questions/             # Test questions (10 files + index.json)
├── results/               # Test results (auto-created, gitignored)
├── bin/                   # Compiled binaries (gitignored)
├── .env.local             # Configuration (gitignored)
├── .env.example           # Template
├── go.mod                 # Go module
├── Makefile               # Build targets
└── README.md
```

## 🔐 Security Notes

- **Never commit `.env.local`** - Contains sensitive auth cookies
- **Rotate tokens regularly** - They expire after ~1 hour
- **Use test conversations** - Don't use production conversation IDs
- **Monitor rate limits** - Respect platform usage policies

## 📝 Test Questions

The toolkit includes 10 pre-configured test questions:

1. Email Summary (Complexity 1)
2. Unread Mails (Complexity 1)
3. High Priority Mails (Complexity 2)
4. System Alert Mails (Complexity 2)
5. System Alert Mails Chart (Complexity 3)
6. External Emails (Complexity 2)
7. Emails with Attachments (Complexity 2)
8. Sender Search (Complexity 2)
9. Keyword Search (Complexity 2)
10. Unread High Priority (Complexity 3)

Questions are loaded from `questions/index.json` and executed sequentially.

## 🎓 Technical Details

### Go Dependencies

```go
require (
    github.com/go-rod/rod v0.116.0    // Browser automation
    github.com/joho/godotenv v1.5.0   // .env parsing
)
```

### Binary Sizes

- `extract-tokens`: ~14MB
- `test-chat`: ~7.4MB
- `run-queries`: ~7.7MB

### Build Commands

```bash
make build      # Build all binaries
make test       # Run unit tests
make vet        # Run go vet
make clean      # Remove binaries
```

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repo
2. Create feature branch
3. Add tests
4. Submit PR

---

**Built for:** MailSage Email Query & API Exploration  
**Language:** Go 1.21+  
**Last Updated:** 2026-07-28
