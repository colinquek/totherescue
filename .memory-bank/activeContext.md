## Current Focus

**Date:** 2026-07-28

**Status:** Core functionality complete, 10 test questions configured, preparing for Go refactor

## Recent Work

### Completed Features
- ✅ Token extraction via Playwright (automated, captures dual headers)
- ✅ Direct API load testing (no browser needed during tests)
- ✅ Automatic token validation and refresh (401 detection + auto re-extraction)
- ✅ Sequential question execution (runs all questions in order)
- ✅ Cross-platform scripts (bash + PowerShell)
- ✅ Results storage (timestamped JSON files)
- ✅ Git-safe configuration (`.env.local` ignored)
- ✅ Completion detection (`-=COMPLETED=-` keyword)
- ✅ 10 test questions configured (email summary, unread, high priority, system alerts, etc.)

### Documentation Created
- ✅ Comprehensive README with workflows
- ✅ Memory Bank files (6 core files)
- ✅ Setup and runner scripts
- ✅ Troubleshooting guide
- ✅ Security scanning documentation (SECRET_SCANNING.md)

## Next Steps

- [x] Token extraction automated
- [x] Load test script working with auto token refresh
- [x] Automation scripts created
- [x] Documentation complete
- [x] 10 test questions configured
- [ ] Refactor from Node.js/TypeScript to Go
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
