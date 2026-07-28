/**
 * Automatic Token Extractor for SomeGPT
 * 
 * This script:
 * 1. Opens SomeGPT in your browser (reuses existing session if logged in)
 * 2. Waits for you to send a message
 * 3. Captures the Authorization and X-API-Key tokens
 * 4. Saves them to .env file
 * 5. Updates test-chat-api.ts automatically
 * 
 * Usage: npm run extract-tokens
 */

import { chromium } from 'playwright';
import type { Browser, BrowserContext, Page, Request } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ExtractedTokens {
  authorization: string;
  xApiKey: string;
  apiEndpoint: string;
  timestamp: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extractTokens(): Promise<void> {
  console.log('SomeGPT Token Extractor');
  console.log('=========================\n');
  
  let extractedTokens: ExtractedTokens | null = null;
  
  // Launch browser (will reuse existing session if already logged in)
  console.log('Launching browser...');
  console.log('   - If you\'re already logged in to SomeGPT, just use that window');
  console.log('   - If not, login in the new browser window\n');
  
  const browser: Browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });
  
  const context: BrowserContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
    ignoreHTTPSErrors: true // Ignore SSL certificate errors for corporate networks
  });
  
  const page: Page = await context.newPage();
  
  // Set up network interception BEFORE navigating
  console.log('Setting up network monitoring...');
  console.log('   Watching for: /orchestrator/sk-chat/stream requests\n');
  
  page.on('request', (request: Request) => {
    const url = request.url();
    
    // Look for the chat stream endpoint (POST requests only)
    if (url.includes('/orchestrator/sk-chat/stream') && request.method() === 'POST') {
      console.log('Found chat API request!');
      
      const headers = request.headers();
      const authHeader = headers['authorization'];
      const apiKeyHeader = headers['x-api-key'];
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        console.log('   ✓ Authorization token captured');
        extractedTokens = {
          authorization: authHeader.substring(7), // Remove "Bearer " prefix
          xApiKey: apiKeyHeader ? apiKeyHeader.substring(7) : '',
          timestamp: new Date().toISOString()
        };
      }
    }
  });
  
  // Navigate to NCSGPT
  console.log('Opening NCSGPT...');
  await page.goto('https://ncsgpt.ncs.com.sg/', { waitUntil: 'networkidle' });
  
  console.log('\nNext Steps:');
  console.log('   1. If not already logged in, login to SomeGPT');
  console.log('   2. Navigate to any conversation');
  console.log('   3. Send a message (e.g., "test")');
  console.log('   4. I\'ll automatically capture the tokens...\n');
  
  // Wait for tokens to be captured (max 5 minutes)
  const maxWaitTime = 5 * 60 * 1000; // 5 minutes
  const checkInterval = 1000; // 1 second
  let waited = 0;
  
  while (!extractedTokens && waited < maxWaitTime) {
    await sleep(checkInterval);
    waited += checkInterval;
    
    // Show progress every 30 seconds
    if (waited % 30000 === 0) {
      const minutes = Math.floor((maxWaitTime - waited) / 60000);
      const seconds = Math.floor(((maxWaitTime - waited) % 60000) / 1000);
      console.log(`Still waiting... (${minutes}m ${seconds}s remaining)`);
    }
  }
  
  if (!extractedTokens) {
    console.log('\nNo tokens captured after 5 minutes.');
    console.log('\nTroubleshooting:');
    console.log('   - Make sure you sent a message in the chat');
    console.log('   - Check if the message was actually sent (visible in conversation)');
    console.log('   - Try refreshing the page and sending another message\n');
    await browser.close();
    return;
  }
  
  console.log('\nTokens captured successfully!\n');
  console.log(`   Authorization: ${extractedTokens.authorization.substring(0, 50)}...`);
  console.log(`   X-API-Key: ${extractedTokens.xApiKey.substring(0, 50)}...`);
  console.log(`   Timestamp: ${extractedTokens.timestamp}\n`);
  
  // Save to .env file
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = `# SomeGPT API Tokens (Auto-extracted)
# Extracted: ${extractedTokens.timestamp}
# These tokens expire after ~1 hour

AUTH_TOKEN=${extractedTokens.authorization}
API_KEY=${extractedTokens.xApiKey}
# CONVERSATION_ID=leave blank to auto-generate, or paste your own
PAUSE_MINUTES=1
CONCURRENT_SESSIONS=1
DURATION_MINUTES=0
`;
  
  fs.writeFileSync(envPath, envContent, 'utf-8');
  console.log(`Tokens saved to: ${envPath}`);
  
  // Update test-chat-api.ts
  const testChatPath = path.join(__dirname, 'test-chat-api.ts');
  if (fs.existsSync(testChatPath)) {
    let testChatContent = fs.readFileSync(testChatPath, 'utf-8');
    
    // Replace AUTH_TOKEN
    testChatContent = testChatContent.replace(
      /const AUTH_TOKEN = '.*?';/s,
      `const AUTH_TOKEN = '${extractedTokens.authorization}';`
    );
    
    // Replace API_KEY
    testChatContent = testChatContent.replace(
      /const API_KEY = '.*?';/s,
      `const API_KEY = '${extractedTokens.xApiKey}';`
    );
    
    fs.writeFileSync(testChatPath, testChatContent, 'utf-8');
    console.log(`Updated: ${testChatPath}`);
  }
  
  console.log('\nSetup Complete!\n');
  console.log('Next Steps:');
  console.log('   1. Run: npm run test-chat  (to verify tokens work)');
  console.log('   2. Run: npm run load-test  (to start load testing)');
  console.log('\nImportant:');
  console.log('   - Tokens expire after ~1 hour');
  console.log('   - Re-run this script to get fresh tokens');
  console.log('   - Tokens are saved in .env.local (gitignored)\n');
  
  await browser.close();
}

// Run the extraction
extractTokens().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
