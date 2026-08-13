# JMeter Load Test Setup

## Prerequisites
- JMeter 5.6+ installed
- Tokens extracted (see below)

## Step 1: Extract Tokens

Run the Go token extractor:
```bash
go run cmd/extract-tokens/main.go
```

This saves tokens to `.env.local`.

## Step 2: Set Environment Variables

Export tokens to environment variables:
```bash
# Linux/Mac (WSL)
export API_ENDPOINT="https://ncsgptapimiddlewareprod.victoriousglacier-6d23f7bf.southeastasia.azurecontainerapps.io/msagents/api/v1/email-intelligence"
export AUTH_TOKEN="your-token-here"
export API_KEY="your-api-key-here"
export GRAPH_TOKEN="your-graph-token-here"
```

**Windows PowerShell:**
```powershell
$env:API_ENDPOINT="https://..."
$env:AUTH_TOKEN="your-token-here"
$env:API_KEY="your-api-key-here"
$env:GRAPH_TOKEN="your-graph-token-here"
```

## Step 3: Run JMeter Test

**GUI Mode (for debugging):**
```bash
jmeter -n -t mailSage-test.jmx
```

**Non-GUI Mode (recommended):**
```bash
jmeter -n -t mailSage-test.jmx -l results.jtl -e -o results-report
```

This will:
- Run all 10 questions from `questions.csv`
- Wait 1 minute between each request
- Check for `-=COMPLETED=-` marker in responses
- Generate HTML report in `results-report/` folder

## Test Plan Structure

```
MailSage Email Intelligence Test
├── Environment Variables (from env vars)
├── CSV Data Set Config (questions.csv)
├── Loop Controller (10 iterations)
│   ├── HTTP Request (API call)
│   │   ├── HTTP Headers (Auth tokens)
│   │   ├── JSON Body (with question)
│   │   └── Response Assertion (check -=COMPLETED=-)
│   └── Constant Timer (1 minute)
├── Summary Report
└── View Results Tree
```

## Questions

The 10 test questions are in `questions.csv`:
1. Email summary table
2. List today's emails
3. Unread emails (24h)
4. "Urgent" keyword emails
5. Manager's emails
6. Meeting invitations
7. Emails with attachments
8. "Project update" emails
9. Flagged emails
10. Long email threads (>5 replies)

## Customization

**Change pause duration:**
- Edit "Constant Timer" in JMX file (milliseconds)

**Change number of iterations:**
- Edit "Loop Controller" loops count

**Add more questions:**
- Add lines to `questions.csv`
- Update loop count to match

**Change API endpoint:**
- Edit in JMX file or set `API_ENDPOINT` env var

## Troubleshooting

**Token expired:**
- Re-run `go run cmd/extract-tokens/main.go`
- Re-export environment variables

**Assertion failures:**
- Check if response contains `-=COMPLETED=-`
- View response in "View Results Tree"

**Connection errors:**
- Verify API_ENDPOINT is correct
- Check network connectivity
