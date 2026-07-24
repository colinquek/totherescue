## Problem Statement

SomeGPT platform needs load testing to:
- Validate API performance under concurrent user load
- Generate realistic traffic patterns for monitoring
- Test system behavior with sustained usage
- Measure token consumption and response times

Manual load testing is impractical because:
- Tokens expire every ~1 hour (requires re-authentication)
- Browser-based testing doesn't scale (one browser = one session)
- Manual API calls are error-prone (complex request format)
- Team members need consistent, repeatable testing

## User Workflows

### Primary Workflow: Automated Token Management
1. User runs `./scripts/run-tests.sh`
2. Script checks for `.env.local` (token storage)
3. If missing/invalid: Opens browser, user logs in once
4. Tokens auto-saved to `.env.local` (gitignored)
5. Load test runs with parallel sessions
6. Results saved to `results/` folder

### Alternative Workflow: Team Collaboration
**Option A: Each user extracts own tokens**
- Clone repo, run setup script
- Each user logs in once (tokens stored locally)
- Run tests independently

**Option B: Share tokens securely**
- One user extracts tokens
- Share `.env.local` via secure channel (NOT git)
- Team runs load tests immediately (no browser needed)

## User Experience Goals

- **First-time user:** Run `./scripts/setup.sh`, then `./scripts/run-tests.sh`
- **Returning user:** Just run `./scripts/run-tests.sh` (auto-handles tokens)
- **Team collaboration:** Share repo via Git, each user extracts their own tokens
- **Security:** Tokens never committed, stored locally only
- **Minimal friction:** One command does everything

## Key Features

### Token Lifecycle Management
- **Extraction:** Playwright captures headers from browser session
- **Validation:** Test API call before running load test
- **Auto-refresh:** Detect 401, re-extract tokens automatically
- **Storage:** `.env.local` (gitignored, local only)

### Load Testing Configuration
- **Concurrency:** Configurable parallel sessions (default: 1)
- **Pause duration:** Configurable delay between requests (default: 1 minute)
- **Duration:** Single run or sustained testing (configurable minutes)
- **Questions:** Complexity Level 1 & 5 (alternating)

### Metrics Tracked
- Response time (ms)
- Token count (estimated from response length)
- Success/failure rate (%)
- Per-session breakdown + summary
