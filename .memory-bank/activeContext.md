## Current Focus

**Date:** 2026-07-28

**Status:** Go Implementation Complete - TypeScript Removed

## Recent Work

### Completed Features (Go Implementation)
- ✅ Token extraction via rod (browser automation)
- ✅ Direct API email querying (HTTP client)
- ✅ Automatic token validation and refresh (401 detection + auto re-extraction)
- ✅ Sequential question execution (all 10 questions in order)
- ✅ Cross-platform scripts (bash + PowerShell)
- ✅ Results storage (timestamped JSON files)
- ✅ Git-safe configuration (`.env.local` ignored)
- ✅ Completion detection (`-=COMPLETED=-` keyword)
- ✅ 10 test questions configured and tested
- ✅ TypeScript/Node.js code removed

### Documentation Created
- ✅ README.md updated for Go
- ✅ Memory Bank files updated
- ✅ Setup and runner scripts updated
- ✅ Makefile for build automation

## Next Steps

### Completed ✅
- [x] Go module structure created
- [x] Token extraction implemented (rod-based)
- [x] HTTP client for Email Intelligence API implemented
- [x] Question loader implemented with tests
- [x] CLI commands created (extract-tokens, test-chat, load-test)
- [x] Cross-platform binaries built (7-14MB each)
- [x] Unit tests passing (6 tests)
- [x] Integration test: All 10 questions ran sequentially (9.87 minutes, 90% success rate)
- [x] Shell scripts updated to use Go binaries
- [x] README.md updated for Go
- [x] TypeScript code removed
- [x] .gitignore updated for Go
- [x] JMeter exploration completed (JMX file created, version incompatibility found)

### Remaining
- [ ] Push to Git for team access
- [ ] Team onboarding and testing

## Active Decisions

### Token Management
**Decision:** Extract tokens on host machine via Playwright, store in `.env.local`, auto-refresh on expiration.

**Rationale:** 
- Azure AD MFA requires manual login (can't automate)
- One-time login per hour is acceptable
- Scripts handle validation and refresh automatically

### Script Approach
**Decision:** Shell scripts (bash/PowerShell) over Docker containers.

**Rationale:**
- Simpler setup (no Docker knowledge needed)
- No container overhead (~500MB image vs ~5MB scripts)
- Easier debugging and maintenance
- Cross-platform support built-in

### Language Choice (Upcoming)
**Decision:** Refactor from TypeScript to Go.

**Rationale:**
- Single binary deployment (no Node.js runtime needed)
- Better performance for concurrent HTTP requests
- Smaller memory footprint
- Easier cross-platform compilation

### Pause Duration
**Decision:** 1 minute between requests (reduced from 3 minutes).

**Rationale:**
- Faster testing cycles (3x more requests per hour)
- Still respectful of rate limits
- Configurable via `.env.local`

### Completion Detection
**Decision:** Use `-=COMPLETED=-` keyword to detect end of response.

**Rationale:**
- Clear signal that question processing is complete
- Allows immediate exit without waiting for timeout
- All 10 test questions include this keyword

### Question Complexity
**Decision:** Use Complexity Level 5 questions for maximum token generation.

**Rationale:**
- Multi-step reasoning required
- Generates extensive working/show-your-work output
- Tests context retention across conversation turns

## Considerations

- Must respect 3-minute pause between prompts (user requirement)
- Monitor for CAPTCHA or bot detection mechanisms
- Auth tokens may expire - need refresh logic
- Conversation IDs can be reused or dynamically created
- Rate limiting unknown - start conservative

## Project Insights

- SomeGPT runs exclusively in browser (no official API)
- Conversation state is maintained via conversation_id parameter
- LLM model selection available (Qwen-3.5-27B observed)
- Response includes structured markdown with mathematical notation
- Processing status visible in UI ("Syncing with the timeline...", "Charting a course through the data...")
