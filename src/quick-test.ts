/**
 * Quick API Test with Discovered Endpoints
 * 
 * Tests the API endpoints we found:
 * - /workflows/session/increment
 * - /rulesengine/rules-engine
 * 
 * Uses the JWT token from your browser session
 */

import fetch from 'node-fetch';
import https from 'https';

// Disable SSL verification for corporate network
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const AUTH_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImFGa21LVkZjLTRXVjZzWENCdk5aa1hJNTA1WSIsImtpZCI6ImFGa21LVkZjLTRXVjZzWENCdk5aa1hJNTA1WSJ9.eyJhdWQiOiJhcGk6Ly8xY2I1ODJlZC05NTQyLTRhYmItODhhNi1lYTU1OWNmZjBlY2YiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jYTkwZDhmNS04OTYzLTRiNmUtYmNhOS05YWM0NjhiY2M3YTgvIiwiaWF0IjoxNzg0ODUzNjc2LCJuYmYiOjE3ODQ4NTM2NzYsImV4cCI6MTc4NDg1ODI3OCwiYWNyIjoiMSIsImFpbyI6IkFYUUFpLzhjQUFBQUdtWWovZ0dwMmN2aXE0WnovRjdPYWc5VWRtQXRmSWxIaE5BQTRkNFFqT3FDNUpVSEV2bGpRYkozT2lJUjdRVnpBSzMzRWRQbC9ZRmtJWFF2cVFybnJpWHZ2eFVXQmdDZ2g1cS9VV1hZVjBoQmpVaWF1cmI1bkRFQktvZjFKMFlHK0lxTDJMVDRaallrd0MxRTRTRTVrdz09IiwiYW1yIjpbInB3ZCIsIm1mYSJdLCJhcHBpZCI6IjcwN2QxZjUyLThjMmItNGY3OC1hM2Y1LWQ4ZDhiMzNlNjMxMiIsImFwcGlkYWNyIjoiMCIsImZhbWlseV9uYW1lIjoiUXVlayIsImdpdmVuX25hbWUiOiJDb2xpbiIsImlwYWRkciI6IjguMjkuMjMwLjE4IiwibmFtZSI6IlF1ZWsgSHNpZW4gTWluZyBDb2xpbiAgKE5DUykiLCJvaWQiOiI1ZGIzZWQxMy03M2I1LTRmOTMtOGNlMS0yZmE3NzAxODg4ZTciLCJvbnByZW1fc2lkIjoiUy0xLTUtMjEtMTI4ODAzMjk1LTMyNjk4MTE0My0zNTc0NTkyOTYtMTY2Mjc4IiwicmgiOiIxLkFWWUE5ZGlReW1PSmJrdThxWnJFYUx6SHFPMkN0UnhDbGJ0S2lLYnFWWnpfRHM4aUFTZFdBQS4iLCJzY3AiOiJHcHQtUmVhZCIsInNpZCI6IjAwNmMxMDJhLTkwOGEtNjA5Ni0zMmZkLTVhYzcwZGQzMWZjMyIsInN1YiI6IkQ3cjVuRm5YaFM2V29xaHFwbFROemwzZEp2NWJfbHB5dmFmZjg1ZHBYY0UiLCJ0aWQiOiJjYTkwZDhmNS04OTYzLTRiNmUtYmNhOS05YWM0NjhiY2M3YTgiLCJ1bmlxdWVfbmFtZSI6ImNvbGlucXVla0BuY3MuY29tLnNnIiwidXBuIjoiY29saW5xdWVrQG5jcy5jb20uc2ciLCJ1dGkiOiJVV3c1el96eTNFRzZuQ3dXekJRQkFBIiwidmVyIjoiMS4wIiwieG1zX2Z0ZCI6InJ0T0JzYmRReV9QZV93U3VGcDNfTUhPSE1YU1dCdTdrNmJUZk5yYWZNQlVCWVhOcFlYTnZkWFJvWldGemRDMWtjMjF6In0.D5P6i2B6FD0ZxaeBFmjjWS9mEuoUW1XWd6MqAMqAV50asVkGfgLS0ux6sHNs51wCq14VvGCD5Om8qFf68TQbK4hS-4rPqTY02Rlsm37A7CApBXHoeZAsH9qqwF2ZZ6fh8Qt5mPc2hWaugW3pvHT4eOYt9vf9qLaZfN2xh1NcYw56-5QC01nfI8qQIJiNrK6NrLdai_7NfjKoi5RDLh5EI6cArDeGypnbNmJFdCEHD9enMpsoKpYNuLfVFfLbfDckSjrBI8Qb0NTBrejy5mvaP3UDhKkpkplfk5mW8nzSKp4aEqv0f7xX2CFY0uyheiNFh09-y0v-OM5LJqE2Zpk1Sg';

const CONVERSATION_ID = 'a6971918-50ca-455b-b822-13c780bdb05b';

const ENDPOINTS = {
  increment: 'https://ncsgptapimiddlewareprod.victoriousglacier-6d23f7bf.southeastasia.azurecontainerapps.io/workflows/session/increment',
  rulesEngine: 'https://ncsgptapimiddlewareprod.victoriousglacier-6d23f7bf.southeastasia.azurecontainerapps.io/rulesengine/rules-engine'
};

async function testEndpoint(name: string, url: string): Promise<void> {
  console.log(`\n🔍 Testing: ${name}`);
  console.log(`   URL: ${url}`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        conversation_id: CONVERSATION_ID,
        timestamp: new Date().toISOString()
      }),
      agent: httpsAgent
    });
    
    const duration = Date.now() - startTime;
    const body = await response.text();
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Duration: ${duration}ms`);
    
    if (response.ok) {
      console.log(`   ✅ Success!`);
      console.log(`   Response: ${body.substring(0, 200)}${body.length > 200 ? '...' : ''}`);
    } else {
      console.log(`   ❌ Failed`);
      console.log(`   Error: ${body.substring(0, 200)}`);
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ Error after ${duration}ms:`, error instanceof Error ? error.message : error);
  }
}

async function main(): Promise<void> {
  console.log('🧪 SomeGPT API Endpoint Test');
  console.log('===========================\n');
  
  console.log('Testing discovered endpoints with your JWT token...\n');
  
  // Test both endpoints
  await testEndpoint('Session Increment', ENDPOINTS.increment);
  await testEndpoint('Rules Engine', ENDPOINTS.rulesEngine);
  
  console.log('\n📝 Next Steps:');
  console.log('   These appear to be telemetry/analytics endpoints.');
  console.log('   We still need to find the CHAT API endpoint.');
  console.log('   \n   In your browser:');
  console.log('   1. Press F12 → Network tab');
  console.log('   2. Clear logs (trash icon)');
  console.log('   3. Send a chat message');
  console.log('   4. Look for NEW API calls (not increment or rules-engine)');
  console.log('   5. Copy that URL and paste it here\n');
}

main();
