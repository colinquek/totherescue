/**
 * Manual API Endpoint Configuration Guide
 * 
 * Since automated browser capture may have issues with corporate networks,
 * follow these manual steps to extract API information:
 * 
 * STEP 1: Open Browser DevTools
 * - Open NCSGPT in your browser: https://ncsgpt.ncs.com.sg/
 * - Login to your account
 * - Navigate to a conversation (e.g., the Fibonacci one)
 * - Press F12 to open DevTools
 * - Go to Network tab
 * 
 * STEP 2: Filter API Calls
 * - In Network tab, filter by "Fetch/XHR"
 * - Clear existing logs (trash icon)
 * - Send a message in the chat
 * - Look for the API call that sends your message
 * 
 * STEP 3: Extract API Endpoint
 * - Click on the API request (likely named "chat", "api", or similar)
 * - Copy the Request URL (this is your API_ENDPOINT)
 * - Example: https://ncsgptapimiddlewareprod...azurecontainerapps.io/api/chat
 * 
 * STEP 4: Extract Request Headers
 * - In the request details, go to Headers tab
 * - Look for these headers:
 *   - Authorization: Bearer xxx (if token-based)
 *   - Cookie: session=xxx; auth=yyy (if cookie-based)
 *   - Content-Type: application/json
 * 
 * STEP 5: Extract Request Body
 * - Go to Payload or Request tab
 * - Copy the JSON structure
 * - Example:
 *   {
 *     "conversation_id": "a6971918-50ca-455b-b822-13c780bdb05b",
 *     "message": "your message here",
 *     "model": "Qwen-3.5-27B",
 *     "stream": false
 *   }
 * 
 * STEP 6: Extract Cookies
 * - Go to Application tab in DevTools
 * - Expand Cookies on the left
 * - Select https://ncsgpt.ncs.com.sg
 * - Copy all cookie values
 * - Format: "name1=value1; name2=value2; ..."
 * 
 * STEP 7: Configure .env
 * - Copy .env.example to .env
 * - Fill in:
 *   AUTH_COOKIE=<paste your cookies here>
 *   API_ENDPOINT=<paste the API URL>
 *   CONVERSATION_ID=<copy from browser URL>
 * 
 * STEP 8: Test
 * - Run: npm run test-api
 * - Check if API calls succeed
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📖 Manual API Configuration Guide');
console.log('==================================\n');
console.log('Due to corporate network restrictions, automated browser capture may not work.');
console.log('Please follow the manual steps in src/manual-capture-guide.ts\n');

console.log('Quick Setup:');
console.log('1. Open SomeGPT in browser and login');
console.log('2. Press F12 → Network tab → Filter: Fetch/XHR');
console.log('3. Send a chat message');
console.log('4. Copy the API URL and cookies');
console.log('5. Edit .env file with your values\n');

// Create a template .env file if it doesn't exist
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  const template = `# SomeGPT API Configuration
# Fill in these values manually (see src/manual-capture-guide.ts)

# Step 1: Copy cookies from DevTools → Application → Cookies
AUTH_COOKIE=

# Step 2: Copy API endpoint from Network tab (the URL of the chat API call)
API_ENDPOINT=

# Step 3: Copy conversation ID from browser URL
CONVERSATION_ID=

# Optional: Adjust these settings
PAUSE_MINUTES=3
CONCURRENT_SESSIONS=1
DURATION_MINUTES=0
`;
  
  fs.writeFileSync(envPath, template, 'utf-8');
  console.log(`✅ Created .env template at: ${envPath}`);
  console.log('   Please edit this file with your actual values.\n');
}

console.log('After configuring .env, run:');
console.log('  npm run test-api    # Test the API connection');
console.log('  npm run load-test   # Run load tests\n');
