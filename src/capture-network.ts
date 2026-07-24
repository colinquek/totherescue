/**
 * SomeGPT Network Capture Script
 * 
 * This script uses Playwright to:
 * 1. Open SomeGPT in a browser
 * 2. Intercept all network requests
 * 3. Filter for API calls (XHR/fetch)
 * 4. Log request URLs, methods, headers, bodies
 * 5. Save captured data to captured-api-endpoints.json
 * 6. Extract auth cookies
 * 
 * Usage: npm run capture
 */

import { chromium } from 'playwright';
import type { Browser, BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  timestamp: number;
  resourceType: string;
}

interface CapturedResponse {
  url: string;
  status: number;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
}

interface CaptureResult {
  requests: CapturedRequest[];
  responses: CapturedResponse[];
  cookies: Array<{ name: string; value: string; domain: string; path: string }>;
  apiEndpoints: string[];
  timestamp: string;
}

const TARGET_URL = 'https://ncsgpt.ncs.com.sg/';
const OUTPUT_FILE = path.join(__dirname, '..', 'captured-api-endpoints.json');

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureNetwork(): Promise<void> {
  console.log('🎯 SomeGPT Network Capture Tool');
  console.log('================================\n');
  
  const capturedRequests: CapturedRequest[] = [];
  const capturedResponses: CapturedResponse[] = [];
  const apiEndpoints = new Set<string>();
  
  // Launch browser
  console.log('🚀 Launching browser...');
  const browser: Browser = await chromium.launch({
    headless: false, // Set to true for automated runs
    args: ['--start-maximized'],
    ignoreDefaultArgs: ['--disable-extensions'],
    env: {
      ...process.env,
      NODE_TLS_REJECT_UNAUTHORIZED: '0' // Ignore self-signed certs for corporate networks
    }
  });
  
  // Create context with network interception
  const context: BrowserContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    recordHar: {
      path: path.join(__dirname, '..', 'network-traffic.har'),
      mode: 'full'
    }
  });
  
  const page: Page = await context.newPage();
  
  // Set up network interception
  console.log('📡 Setting up network interception...');
  
  page.on('request', request => {
    const url = request.url();
    const method = request.method();
    const resourceType = request.resourceType();
    
    // Filter for API calls (exclude static assets)
    if (resourceType === 'xhr' || resourceType === 'fetch' || url.includes('api') || url.includes('graphql')) {
      const postData = request.postData();
      
      capturedRequests.push({
        url,
        method,
        headers: request.headers(),
        postData: postData || undefined,
        timestamp: Date.now(),
        resourceType
      });
      
      // Extract API endpoints
      try {
        const urlObj = new URL(url);
        const endpoint = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
        apiEndpoints.add(endpoint);
      } catch (e) {
        // Invalid URL, skip
      }
      
      console.log(`📤 [${method}] ${url}`);
      if (postData) {
        console.log(`   Body: ${postData.substring(0, 200)}${postData.length > 200 ? '...' : ''}`);
      }
    }
  });
  
  page.on('response', async response => {
    const url = response.url();
    const status = response.status();
    const resourceType = response.request().resourceType();
    
    // Filter for API responses
    if (resourceType === 'xhr' || resourceType === 'fetch' || url.includes('api') || url.includes('graphql')) {
      try {
        const body = await response.text();
        const headers = response.headers();
        
        capturedResponses.push({
          url,
          status,
          headers,
          body: body.substring(0, 5000), // Limit body size
          timestamp: Date.now()
        });
        
        console.log(`📥 [${status}] ${url}`);
      } catch (e) {
        console.log(`⚠️  Could not read response body: ${e}`);
      }
    }
  });
  
  // Navigate to SomeGPT
  console.log(`\n🌐 Navigating to ${TARGET_URL}...`);
  console.log('📝 Please login to SomeGPT if not already logged in.\n');
  
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  
  // Wait for user to login and interact
  console.log('⏳ Waiting for you to navigate to a conversation and send a message...');
  console.log('   Once you\'ve sent at least one message, press Enter in this terminal to continue.\n');
  
  await new Promise<void>(resolve => {
    process.stdin.once('data', () => resolve());
  });
  
  // Wait a bit more to capture any pending requests
  console.log('📸 Capturing final network state...');
  await sleep(3000);
  
  // Extract cookies
  console.log('🍪 Extracting authentication cookies...');
  const cookies = await context.cookies();
  const authCookies = cookies
    .filter(c => c.name.toLowerCase().includes('auth') || c.name.toLowerCase().includes('session') || c.name.toLowerCase().includes('token'))
    .map(c => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path || '/'
    }));
  
  // Also save all cookies for reference
  const allCookies = cookies.map(c => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path || '/'
  }));
  
  // Prepare results
  const result: CaptureResult = {
    requests: capturedRequests,
    responses: capturedResponses,
    cookies: allCookies,
    apiEndpoints: Array.from(apiEndpoints),
    timestamp: new Date().toISOString()
  };
  
  // Save to file
  console.log(`\n💾 Saving captured data to ${OUTPUT_FILE}...`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');
  
  // Save .env file with auth cookie
  const envPath = path.join(__dirname, '..', '.env');
  const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  const envContent = `# Auto-generated by capture-network.ts on ${new Date().toISOString()}\nAUTH_COOKIE=${cookieString}\nCONVERSATION_ID=\nAPI_ENDPOINT=${Array.from(apiEndpoints)[0] || ''}\nPAUSE_MINUTES=3\nCONCURRENT_SESSIONS=1\nDURATION_MINUTES=0\n`;
  
  fs.writeFileSync(envPath, envContent, 'utf-8');
  console.log(`🔐 Authentication cookies saved to ${envPath}`);
  
  // Summary
  console.log('\n✅ Capture Complete!');
  console.log('==================');
  console.log(`📊 Total requests captured: ${capturedRequests.length}`);
  console.log(`📊 Total responses captured: ${capturedResponses.length}`);
  console.log(`🔗 API endpoints discovered: ${apiEndpoints.size}`);
  console.log(`🍪 Cookies extracted: ${cookies.length}`);
  console.log(`\n📁 Results saved to:`);
  console.log(`   - ${OUTPUT_FILE}`);
  console.log(`   - ${envPath}`);
  console.log(`   - network-traffic.har (full HAR file)\n`);
  
  if (apiEndpoints.size > 0) {
    console.log('🔗 Discovered API Endpoints:');
    apiEndpoints.forEach(endpoint => console.log(`   - ${endpoint}`));
  }
  
  console.log('\n📝 Next Steps:');
  console.log('   1. Review captured-api-endpoints.json for API details');
  console.log('   2. Update .env with your CONVERSATION_ID');
  console.log('   3. Run: npm run test-api');
  console.log('   4. Run: npm run load-test\n');
  
  await browser.close();
}

// Run the capture
captureNetwork().catch(console.error);
