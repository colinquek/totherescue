## Project Overview

**Purpose:** Automated email query toolkit for SomeGPT (NCS GPT platform) enabling API discovery, token extraction, and scalable load generation for traffic testing.

**Target System:** https://ncsgpt.ncs.com.sg/

**Test Focus:** Direct API calls with JWT token authentication, sequential question execution, automated token lifecycle management, and completion detection.

**Current API:** Email Intelligence endpoint (`/msagents/api/v1/email-intelligence`)

## Goals

1. **Token Management:** Automatic extraction and validation of JWT tokens from browser sessions
2. **Email Query:** Parallel session support with configurable concurrency and pause duration
3. **Metrics Collection:** Response time, success rate, and token usage tracking
4. **Team Collaboration:** Cross-platform scripts for easy onboarding and Git-safe configuration

## Scope

### In Scope
- Automated token extraction via Playwright browser automation
- Direct API email querying (no browser overhead during tests)
- Automatic token validation and refresh on expiration (auto re-extraction on 401)
- Cross-platform automation scripts (Windows, Mac, Linux)
- Results storage and analysis (JSON format)
- Team-friendly workflows (setup + run scripts)
- Sequential question execution with configurable pause duration
- Completion detection via `-=COMPLETED=-` keyword

### Out of Scope
- Containerization (Docker) - deferred for simplicity
- Automated login (Azure AD MFA requires manual intervention)
- Real-time monitoring dashboard
- CI/CD pipeline integration

## Success Criteria

- [x] Token extraction automated (Playwright-based)
- [x] Direct API calls working with dual authentication headers
- [x] Parallel session support implemented
- [x] Automatic token validation and refresh
- [x] Cross-platform setup and runner scripts
- [x] Results saved to timestamped JSON files
- [x] Git-safe (tokens never committed)

## Key Constraints

- JWT tokens expire every ~1 hour (requires re-extraction)
- Azure AD MFA blocks automated login (manual step required)
- API requires dual headers: Authorization + X-API-Key
- Nested request format: `message: [[{type, text}]]`
- Email Intelligence API requires `graph_token` field in request body
