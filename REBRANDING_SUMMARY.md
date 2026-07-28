# MailSage Rebranding Summary

**Date:** 2026-07-28  
**From:** SomeGPT Load Testing Toolkit  
**To:** MailSage - Email Best Practice Prompter

## What Changed

### Product Name
- **Old:** SomeGPT Load Testing Toolkit
- **New:** MailSage - Email Best Practice Prompter

### Terminology
| Old Term | New Term |
|----------|----------|
| load test | email query |
| Load Test | Email Query |
| load testing | email querying |
| Load Testing | Email Query |
| load-test (binary) | run-queries (binary) |
| LoadTestResults | QueryResults |

### Files Updated

#### User-Facing (Tier 1)
- ✅ `README.md` - Complete rebrand
- ✅ `scripts/run-tests.sh` - Updated messaging
- ✅ `scripts/run-tests.ps1` - Updated messaging
- ✅ `scripts/setup.sh` - Updated messaging
- ✅ `scripts/setup.ps1` - Updated messaging

#### Source Code (Tier 2)
- ✅ `cmd/load-test/` → `cmd/run-queries/` - Directory renamed
- ✅ `cmd/run-queries/main.go` - Updated messages
- ✅ `cmd/test-chat/main.go` - Rebranded to MailSage
- ✅ `cmd/extract-tokens/main.go` - Rebranded to MailSage
- ✅ `internal/api/client.go` - Hash value updated

#### Documentation (Tier 3)
- ✅ `.memory-bank/projectbrief.md`
- ✅ `.memory-bank/productContext.md`
- ✅ `.memory-bank/activeContext.md`
- ✅ `.memory-bank/progress.md`
- ✅ `.memory-bank/systemPatterns.md`
- ✅ `.memory-bank/techContext.md`

#### Build System
- ✅ `Makefile` - Updated targets
- ✅ `.gitignore` - Updated result file patterns

## New Binary Names

```
bin/
├── extract-tokens    # Token extraction (unchanged)
├── test-chat        # API validation (unchanged)
└── run-queries      # Email query runner (renamed from load-test)
```

## New Commands

```bash
# Extract tokens
./bin/extract-tokens

# Test API connection
./bin/test-chat

# Run all 10 email queries
./bin/run-queries

# Or use the automated runner
./scripts/run-tests.sh
```

## Result Files

Result files now use the new naming convention:
- **Old:** `results/load-test-2026-07-28T13-43-08-000Z.json`
- **New:** `results/email-query-2026-07-28T13-43-08-000Z.json`

## Verification

All builds passing:
```bash
make build
✅ Success

go test ./...
✅ Success

go vet ./...
✅ Success
```

## Branding Elements

- **Product:** MailSage
- **Tagline:** Email Best Practice Prompter
- **Binary:** run-queries
- **Output:** MailSage Email Query
- **Purpose:** Run 10 pre-configured email best practice queries

## What Stayed the Same

- All 10 prompt files in `questions/` directory (unchanged)
- Token extraction workflow (unchanged)
- API endpoint and authentication (unchanged)
- Sequential execution with pauses (unchanged)
- Results JSON format (unchanged)
- Configuration via `.env.local` (unchanged)

## Migration Notes

For existing users:
1. Pull latest changes
2. Run `./scripts/setup.sh` to rebuild binaries
3. Old `bin/load-test` replaced with `bin/run-queries`
4. Update any scripts or documentation referencing old binary name
