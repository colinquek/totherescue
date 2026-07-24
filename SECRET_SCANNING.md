# Secret Scanning with Gitleaks

This repository uses [Gitleaks](https://github.com/gitleaks/gitleaks) to scan for secrets, API keys, and sensitive data.

## Automated Scanning

A GitHub Actions workflow runs automatically on:
- Every push to main/master branches
- Every pull request
- Daily scheduled scan at 2 AM UTC

## Local Scanning

### Install Gitleaks

**macOS:**
```bash
brew install gitleaks
```

**Windows:**
```powershell
choco install gitleaks
# or
winget install gitleaks
```

**Linux:**
```bash
# Download from https://github.com/gitleaks/gitleaks/releases
wget https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_linux_x64.tar.gz
tar -xzf gitleaks_linux_x64.tar.gz
sudo mv gitleaks /usr/local/bin/
```

### Run Scans

**Scan entire git history:**
```bash
gitleaks detect --source . --verbose
```

**Scan staged changes (pre-commit):**
```bash
gitleaks protect --source . --staged --verbose
```

**Scan with custom config:**
```bash
gitleaks detect --source . --config .gitleaks.toml --verbose
```

## Configuration

The `.gitleaks.toml` file customizes Gitleaks behavior:
- Extends default rules (AWS keys, GitHub tokens, private keys, etc.)
- Allows test/placeholder patterns
- Excludes test files and documentation

## What Gets Detected

Gitleaks scans for:
- API keys (AWS, Azure, Google Cloud, etc.)
- Private keys and certificates
- Database credentials
- JWT tokens
- Generic high-entropy strings
- Custom patterns defined in config

## Fixing Findings

If Gitleaks finds secrets:

1. **Rotate the secret immediately** (revoke and generate new)
2. Remove from git history:
   ```bash
   # For recent commits
   git reset --soft HEAD~1
   # Then amend commit without the secret
   
   # For older commits, use BFG or git-filter-repo
   bfg --delete-files <filename>
   ```
3. Add to `.gitignore` if it's a local file
4. Push cleaned history:
   ```bash
   git push --force
   ```

## Pre-commit Hook (Optional)

Add to your local pre-commit hook:

```bash
#!/bin/bash
if command -v gitleaks &> /dev/null; then
  gitleaks protect --staged --verbose
  if [ $? -ne 0 ]; then
    echo "❌ Secrets detected in staged changes!"
    exit 1
  fi
fi
```

## GitHub Token

The workflow uses the default `GITHUB_TOKEN`. For private repos or advanced features, you may need a Gitleaks license:

1. Get license at: https://gitleaks.io
2. Add to GitHub Secrets: `GITLEAKS_LICENSE`

## References

- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [Gitleaks GitHub Action](https://github.com/gitleaks/gitleaks-action)
- [Gitleaks Configuration](https://github.com/gitleaks/gitleaks/blob/master/README.md#configuration)
