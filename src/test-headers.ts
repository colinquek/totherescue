/**
 * API Test with Exact Browser Headers
 * 
 * Replicates the exact request format from the browser
 */

import fetch from 'node-fetch';
import https from 'https';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// This token expires after ~1 hour - you may need to refresh it
const AUTH_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImFGa21LVkZjLTRXVjZzWENCdk5aa1hJNTA1WSIsImtpZCI6ImFGa21LVkZjLTRXVjZzWENCdk5aa1hJNTA1WSJ9.eyJhdWQiOiJhcGk6Ly8xY2I1ODJlZC05NTQyLTRhYmItODhhNi1lYTU1OWNmZjBlY2YiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jYTkwZDhmNS04OTYzLTRiNmUtYmNhOS05YWM0NjhiY2M3YTgvIiwiaWF0IjoxNzg0ODUzNjc2LCJuYmYiOjE3ODQ4NTM2NzYsImV4cCI6MTc4NDg1ODI3OCwiYWNyIjoiMSIsImFpbyI6IkFYUUFpLzhjQUFBQUdtWWovZ0dwMmN2aXE0WnovRjdPYWc5VWRtQXRmSWxIaE5BQTRkNFFqT3FDNUpVSEV2bGpRYkozT2lJUjdRVnpBSzMzRWRQbC9ZRmtJWFF2cVFybnJpWHZ2eFVXQmdDZ2g1cS9VV1hZVjBoQmpVaWF1cmI1bkRFQktvZjFKMFlHK0lxTDJMVDRaallrd0MxRTRTRTVrdz09IiwiYW1yIjpbInB3ZCIsIm1mYSJdLCJhcHBpZCI6IjcwN2QxZjUyLThjMmItNGY3OC1hM2Y1LWQ4ZDhiMzNlNjMxMiIsImFwcGlkYWNyIjoiMCIsImZhbWlseV9uYW1lIjoiUXVlayIsImdpdmVuX25hbWUiOiJDb2xpbiIsImlwYWRkciI6IjguMjkuMjMwLjE4IiwibmFtZSI6IlF1ZWsgSHNpZW4gTWluZyBDb2xpbiAgKE5DUykiLCJvaWQiOiI1ZGIzZWQxMy03M2I1LTRmOTMtOGNlMS0yZmE3NzAxODg4ZTciLCJvbnByZW1fc2lkIjoiUy0xLTUtMjEtMTI4ODAzMjk1LTMyNjk4MTE0My0zNTc0NTkyOTYtMTY2Mjc4IiwicmgiOiIxLkFWWUE5ZGlReW1PSmJrdThxWnJFYUx6SHFPMkN0UnhDbGJ0S2lLYnFWWnpfRHM4aUFTZFdBQS4iLCJzY3AiOiJHcHQtUmVhZCIsInNpZCI6IjAwNmMxMDJhLTkwOGEtNjA5Ni0zMmZkLTVhYzcwZGQzMWZjMyIsInN1YiI6IkQ3cjVuRm5YaFM2V29xaHFwbFROemwzZEp2NWJfbHB5dmFmZjg1ZHBYY0UiLCJ0aWQiOiJjYTkwZDhmNS04OTYzLTRiNmUtYmNhOS05YWM0NjhiY2M3YTgiLCJ1bmlxdWVfbmFtZSI6ImNvbGlucXVla0BuY3MuY29tLnNnIiwidXBuIjoiY29saW5xdWVrQG5jcy5jb20uc2ciLCJ1dGkiOiJVV3c1el96eTNFRzZuQ3dXekJRQkFBIiwidmVyIjoiMS4wIiwieG1zX2Z0ZCI6InJ0T0JzYmRReV9QZV93U3VGcDNfTUhPSE1YU1dCdTdrNmJUZk5yYWZNQlVCWVhOcFlYTnZkWFJvWldGemRDMWtjMjF6In0.D5P6i2B6FD0ZxaeBFmjjWS9mEuoUW1XWd6MqAMqAV50asVkGfgLS0ux6sHNs51wCq14VvGCD5Om8qFf68TQbK4hS-4rPqTY02Rlsm37A7CApBXHoeZAsH9qqwF2ZZ6fh8Qt5mPc2hWaugW3pvHT4eOYt9vf9qLaZfN2xh1NcYw56-5QC01nfI8qQIJiNrK6NrLdai_7NfjKoi5RDLh5EI6cArDeGypnbNmJFdCEHD9enMpsoKpYNuLfVFfLbfDckSjrBI8Qb0NTBrejy5mvaP3UDhKkpkplfk5mW8nzSKp4aEqv0f7xX2CFY0uyheiNFh09-y0v-OM5LJqE2Zpk1Sg';

const CONVERSATION_ID = 'a6971918-50ca-455b-b822-13c780bdb05b';

async function testIncrementEndpoint(): Promise<void> {
  console.log('🔍 Testing /workflows/session/increment endpoint\n');
  
  const url = 'https://ncsgptapimiddlewareprod.victoriousglacier-6d23f7bf.southeastasia.azurecontainerapps.io/workflows/session/increment';
  
  const headers = {
    'authority': 'ncsgptapimiddlewareprod.victoriousglacier-6d23f7bf.southeastasia.azurecontainerapps.io',
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'authorization': `Bearer ${AUTH_TOKEN}`,
    'content-type': 'application/json',
    'origin': 'https://ncsgpt.ncs.com.sg',
    'referer': 'https://ncsgpt.ncs.com.sg/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0'
  };
  
  // Try different body formats
  const testBodies = [
    { conversation_id: CONVERSATION_ID },
    { session_id: CONVERSATION_ID },
    { id: CONVERSATION_ID },
    {}
  ];
  
  for (const [index, body] of testBodies.entries()) {
    console.log(`Test ${index + 1}: Body = ${JSON.stringify(body)}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        agent: httpsAgent
      });
      
      const responseBody = await response.text();
      
      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log(`  ✅ SUCCESS!`);
        console.log(`  Response: ${responseBody}\n`);
        return;
      } else {
        console.log(`  ❌ Failed: ${responseBody.substring(0, 100)}\n`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error instanceof Error ? error.message : error}\n`);
    }
  }
}

async function main(): Promise<void> {
  console.log('🧪 SomeGPT API Test - Exact Browser Headers');
  console.log('==========================================\n');
  
  console.log('⚠️  Note: JWT tokens expire after ~1 hour');
  console.log('   If you see 401 errors, get a fresh token from your browser\n');
  
  await testIncrementEndpoint();
  
  console.log('\n📝 IMPORTANT:');
  console.log('   These endpoints appear to be for telemetry/session tracking.');
  console.log('   We still need to find the actual CHAT API endpoint.\n');
  console.log('   Please do this in your browser:');
  console.log('   1. F12 → Network tab → Clear all');
  console.log('   2. Type a message in the chat (e.g., "test")');
  console.log('   3. Press Enter');
  console.log('   4. Look for NEW network requests');
  console.log('   5. Find the one that sends your message (not increment/rules-engine)');
  console.log('   6. Copy that URL and paste it here\n');
  console.log('   The URL might look like:');
  console.log('   - .../api/chat');
  console.log('   - .../api/conversation');
  console.log('   - .../api/message');
  console.log('   - .../workflows/chat');
  console.log('   - .../api/completions');
}

main();
