/**
 * Simple API Test - Exact Browser Format
 * Uses the exact request structure from browser
 */

import fetch from 'node-fetch';
import https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load tokens from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const authMatch = envContent.match(/AUTH_TOKEN=(.+)/);
const apiKeyMatch = envContent.match(/API_KEY=(.+)/);

if (!authMatch || !apiKeyMatch) {
  console.error('❌ Tokens not found. Run: npm run extract-tokens');
  process.exit(1);
}

const AUTH_TOKEN = authMatch[1].trim();
const API_KEY = apiKeyMatch[1].trim();

// Hardcoded API endpoint
const API_ENDPOINT = 'https://ncsgptapimiddlewareprod.victoriousglacier-6d23f7bf.southeastasia.azurecontainerapps.io/msagents/api/v1/email-intelligence';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function testAPI(): Promise<void> {
  console.log('🧪 Testing SomeGPT API with exact browser format\n');
  
  // Exact format from browser
  const requestBody = {
    message: [[{
      type: 'text',
      text: 'Hello from API test!'
    }]],
    history: [],
    config: {
      expert_routing: {
        expertNames: ['GPT 5.4'],
        forceRoute: true,
        fileProcess: true
      },
      experts_with_rbac: {
        names: [],
        hashTime: new Date().toISOString(),
        hash: 'test'
      },
      memory: {
        user_id: '5db3ed13-73b5-4f93-8ce1-2fa7701888e7',
        session_id: 'a6971918-50ca-455b-b822-13c780bdb05b'
      },
      graph_token: 'default-graph-token'
    },
    graph_token: 'default-graph-token',
    query: 'Hello from API test!'
  };
  
  const headers = {
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'authorization': `Bearer ${AUTH_TOKEN}`,
    'x-api-key': `Bearer ${API_KEY}`,
    'content-type': 'application/json',
    'origin': 'https://ncsgpt.ncs.com.sg',
    'referer': 'https://ncsgpt.ncs.com.sg/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0'
  };
  
  console.log('Sending request...');
  console.log(`URL: ${API_ENDPOINT}`);
  console.log(`Headers: Authorization (Bearer ${AUTH_TOKEN.substring(0, 30)}...)`);
  console.log(`         X-API-Key (Bearer ${API_KEY.substring(0, 30)}...)\n`);
  
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      agent: httpsAgent
    });
    
    console.log(`Status: ${response.status} ${response.statusText}\n`);
    
    const text = await response.text();
    
    if (response.ok) {
      console.log('✅ SUCCESS!');
      console.log('Response:');
      console.log(text.substring(0, 2000));
    } else {
      console.log('❌ Failed');
      console.log('Response:', text);
    }
    
  } catch (error) {
    console.log('❌ Error:', error instanceof Error ? error.message : error);
  }
}

testAPI();
