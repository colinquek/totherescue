/**
 * SomeGPT Chat API Client
 * 
 * Working API client for the actual chat endpoint
 * Endpoint: /orchestrator/sk-chat/stream
 * 
 * Usage: npm run test-chat
 * Tokens are loaded from .env.local (auto-extracted by extract-tokens.ts)
 */

import fetch from 'node-fetch';
import https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Load tokens from .env.local
const envPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found!');
  console.error('   Run: npm run extract-tokens   to get fresh tokens\n');
  process.exit(1);
}

import { randomUUID } from 'crypto';

const envContent = fs.readFileSync(envPath, 'utf-8');
const authMatch = envContent.match(/AUTH_TOKEN=(.+)/);
const apiKeyMatch = envContent.match(/API_KEY=(.+)/);
const convMatch = envContent.match(/CONVERSATION_ID=(.+)/);

if (!authMatch || !apiKeyMatch) {
  console.error('❌ Tokens not found in .env.local!');
  console.error('   Run: npm run extract-tokens   to get fresh tokens\n');
  process.exit(1);
}

  const AUTH_TOKEN = authMatch[1].trim();
const API_KEY = apiKeyMatch[1].trim();
let CONVERSATION_ID = convMatch ? convMatch[1].trim() : '';
const GRAPH_TOKEN = envContent.match(/^GRAPH_TOKEN=(.+)$/m)?.[1].trim() || '';
// Hardcoded API endpoint
const API_ENDPOINT = 'https://ncsgptapimiddlewareprod.victoriousglacier-6d23f7bf.southeastasia.azurecontainerapps.io/msagents/api/v1/email-intelligence';

if (!CONVERSATION_ID) {
  CONVERSATION_ID = randomUUID();
  console.log(`📝 Generated new Conversation ID: ${CONVERSATION_ID}`);
}

interface TextItem {
  type: 'text';
  text: string;
}

interface MessageItem {
  ai_model_id: string | null;
  metadata: Record<string, any>;
  content_type: 'text' | 'message';
  role?: 'user' | 'assistant';
  name?: string;
  items?: TextItem[] | MessageItem[];
  text?: string;
  encoding?: string | null;
  finish_reason?: string | null;
  status?: string | null;
}

interface ChatConfig {
  web_search?: {
    userIntent: {
      explicitWebSearchRequested: boolean;
      selectedWebSearch: string;
    };
  };
  image_generation?: {
    model: string;
    size: string;
    logo: {
      is_add_logo: boolean;
      location: string;
    };
  };
  expert_routing?: {
    expertNames: string[];
    forceRoute: boolean;
    fileProcess: boolean;
  };
  experts_with_rbac?: {
    names: string[];
    hashTime: string;
    hash: string;
  };
  memory?: {
    user_id: string;
    session_id: string;
  };
  graph_token: string;
  reference_id?: string;
}

interface ChatRequest {
  message: TextItem[][];
  history: MessageItem[];
  config: ChatConfig;
  graph_token: string;
  query: string;
}

async function sendChatMessage(message: string): Promise<void> {
  console.log('📤 Sending message to SomeGPT API...\n');
  console.log(`Endpoint: ${API_ENDPOINT}`);
  console.log(`Message: "${message}"\n`);
  
  const headers: Record<string, string> = {
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'authorization': `Bearer ${AUTH_TOKEN}`,
    'x-api-key': `Bearer ${API_KEY}`,
    'content-type': 'application/json',
    'origin': 'https://ncsgpt.ncs.com.sg',
    'referer': 'https://ncsgpt.ncs.com.sg/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0'
  };
  
  // Simplified request with minimal history for testing
  const requestBody: ChatRequest = {
    message: [[{
      type: 'text',
      text: message
    }]],
    history: [], // Empty history for simple test
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
        session_id: CONVERSATION_ID
      },
      graph_token: GRAPH_TOKEN || 'default-graph-token'
    },
    graph_token: GRAPH_TOKEN || 'default-graph-token',
    query: message
  };
  
  console.log('Request body:', JSON.stringify(requestBody, null, 2));
  console.log('\n📡 Sending request...\n');
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      agent: httpsAgent
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    console.log(`Duration: ${duration}ms\n`);
    
    const responseBody = await response.text();
    
    if (response.ok) {
      console.log('✅ SUCCESS!\n');
      console.log('Response:');
      console.log('─'.repeat(80));
      
      // Try to parse as JSON
      try {
        const json = JSON.parse(responseBody);
        console.log(JSON.stringify(json, null, 2));
        
        // Extract message content if it's in OpenAI format
        if (json.choices && json.choices[0]?.message?.content) {
          console.log('\n📝 Assistant Response:');
          console.log('─'.repeat(80));
          console.log(json.choices[0].message.content);
          console.log('─'.repeat(80));
        }
        
        // Show token usage if available
        if (json.usage) {
          console.log('\n📊 Token Usage:');
          console.log(`   Prompt: ${json.usage.prompt_tokens || 'N/A'}`);
          console.log(`   Completion: ${json.usage.completion_tokens || 'N/A'}`);
          console.log(`   Total: ${json.usage.total_tokens || 'N/A'}`);
        }
      } catch (e) {
        // Non-JSON response (might be streaming)
        console.log(responseBody);
      }
      
      console.log('─'.repeat(80));
    } else {
      console.log('❌ FAILED\n');
      console.log(`Status: ${response.status}`);
      console.log(`Response: ${responseBody.substring(0, 500)}`);
      
      if (response.status === 401) {
        console.log('\n⚠️  Token expired! Get fresh tokens:');
        console.log('   Run: npm run extract-tokens\n');
      }
    }
    
  } catch (error) {
    console.log('❌ ERROR\n');
    console.log(error instanceof Error ? error.message : error);
  }
}

async function main(): Promise<void> {
  console.log('💬 SomeGPT Chat API Client');
  console.log('=========================\n');
  
  console.log('📋 Configuration loaded from .env.local:');
  console.log(`   AUTH_TOKEN: ${AUTH_TOKEN.substring(0, 50)}...`);
  console.log(`   API_KEY: ${API_KEY.substring(0, 50)}...`);
  console.log(`   Conversation ID: ${CONVERSATION_ID}\n`);
  
  // Test with a simple message
  await sendChatMessage('Hello! This is a test message from the API client.');
  
  console.log('\n\n📝 Next Steps:');
  console.log('   - If successful, you can now use this for load testing');
  console.log('   - Update the COMPLEXITY_1_QUESTION and COMPLEXITY_5_QUESTION in api-client.ts');
  console.log('   - Run: npm run load-test\n');
}

main();
