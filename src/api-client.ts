/**
 * SomeGPT API Client
 * 
 * This script tests direct API calls to SomeGPT using:
 * - Captured API endpoints from capture-network.ts
 * - Authentication cookies from .env
 * - Direct HTTP requests (no browser)
 * 
 * Usage: npm run test-api
 */

import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

interface ApiConfig {
  endpoint: string;
  cookie: string;
  conversationId: string;
}

interface ChatRequest {
  conversation_id: string;
  message: string;
  model?: string;
  stream?: boolean;
}

interface ChatResponse {
  id?: string;
  choices?: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
}

// Load questions from questions/index.json
interface QuestionEntry {
  id: string;
  file: string;
  name: string;
  complexity: number;
  description: string;
}

interface QuestionsIndex {
  questions: QuestionEntry[];
}

const QUESTIONS_DIR = path.join(__dirname, '..', 'questions');
const QUESTIONS_INDEX = path.join(QUESTIONS_DIR, 'index.json');

function loadQuestions(): string[] {
  if (!fs.existsSync(QUESTIONS_INDEX)) {
    console.warn(`⚠️  Questions index not found: ${QUESTIONS_INDEX}`);
    console.warn('   Using default test question\n');
    return ['Test message'];
  }
  
  const indexContent = fs.readFileSync(QUESTIONS_INDEX, 'utf-8');
  const index: QuestionsIndex = JSON.parse(indexContent);
  
  const questions: string[] = [];
  
  for (const entry of index.questions) {
    const questionFile = path.join(QUESTIONS_DIR, entry.file);
    
    if (!fs.existsSync(questionFile)) {
      console.warn(`⚠️  Question file not found: ${entry.file}`);
      continue;
    }
    
    const questionText = fs.readFileSync(questionFile, 'utf-8').trim();
    questions.push(questionText);
  }
  
  if (questions.length === 0) {
    console.warn('⚠️  No questions loaded, using default');
    return ['Test message'];
  }
  
  return questions;
}

function loadConfig(): ApiConfig {
  const capturedDataPath = path.join(__dirname, '..', 'captured-api-endpoints.json');
  
  // Load captured endpoints if available
  let apiEndpoint = process.env.API_ENDPOINT || '';
  
  if (fs.existsSync(capturedDataPath)) {
    const capturedData = JSON.parse(fs.readFileSync(capturedDataPath, 'utf-8'));
    if (capturedData.apiEndpoints && capturedData.apiEndpoints.length > 0) {
      apiEndpoint = capturedData.apiEndpoints[0];
      console.log(`📡 Using captured API endpoint: ${apiEndpoint}`);
    }
  }
  
  if (!apiEndpoint) {
    console.warn('⚠️  No API endpoint found. Please run: npm run capture');
    console.warn('   Or set API_ENDPOINT in .env file\n');
  }
  
  const cookie = process.env.AUTH_COOKIE || '';
  let conversationId = process.env.CONVERSATION_ID || '';
  
  if (!conversationId) {
    conversationId = randomUUID();
    console.log(`📝 Generated new Conversation ID: ${conversationId}`);
  }
  
  if (!cookie) {
    throw new Error('❌ AUTH_COOKIE not found in .env file. Please run: npm run capture');
  }
  
  return {
    endpoint: apiEndpoint,
    cookie,
    conversationId
  };
}

async function testApiCall(config: ApiConfig, message: string, testNumber: number): Promise<void> {
  console.log(`\n🧪 Test ${testNumber}: Sending API request...`);
  console.log(`   Endpoint: ${config.endpoint}`);
  console.log(`   Conversation: ${config.conversationId}`);
  console.log(`   Message length: ${message.length} chars`);
  
  const startTime = Date.now();
  
  try {
    const requestBody: ChatRequest = {
      conversation_id: config.conversationId,
      message: message,
      model: 'Qwen-3.5-27B',
      stream: false
    };
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': config.cookie,
        'Origin': 'https://ncsgpt.ncs.com.sg',
        'Referer': `https://ncsgpt.ncs.com.sg/?conversation_id=${config.conversationId}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(requestBody)
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Duration: ${duration}ms`);
    
    const responseHeaders = Object.fromEntries(response.headers.entries());
    console.log(`   Response headers:`, JSON.stringify(responseHeaders, null, 2));
    
    const responseBody = await response.text();
    
    if (response.ok) {
      console.log(`   ✅ Success!`);
      console.log(`   Response size: ${responseBody.length} bytes`);
      
      // Try to parse as JSON
      try {
        const jsonResponse: ChatResponse = JSON.parse(responseBody);
        console.log(`   Response structure:`, Object.keys(jsonResponse));
        
        if (jsonResponse.choices && jsonResponse.choices.length > 0) {
          const content = jsonResponse.choices[0].message.content;
          console.log(`   Response preview: ${content.substring(0, 200)}...`);
        }
        
        if (jsonResponse.usage) {
          console.log(`   Token usage:`, jsonResponse.usage);
        }
      } catch (e) {
        console.log(`   Response (non-JSON): ${responseBody.substring(0, 200)}...`);
      }
    } else {
      console.log(`   ❌ Failed: ${responseBody.substring(0, 500)}`);
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ Error after ${duration}ms:`, error);
  }
}

async function main(): Promise<void> {
  console.log('🔬 SomeGPT API Client');
  console.log('====================\n');
  
  try {
    const config = loadConfig();
    
    console.log('📋 Configuration:');
    console.log(`   API Endpoint: ${config.endpoint || 'Not set'}`);
    console.log(`   Cookie length: ${config.cookie.length} chars`);
    console.log(`   Conversation ID: ${config.conversationId}`);
    console.log();
    
    if (!config.endpoint) {
      console.log('❌ No API endpoint configured. Please run: npm run capture');
      return;
    }
    
    const questions = loadQuestions();
    console.log(`📚 Loaded ${questions.length} question(s) from questions.txt\n`);
    
    // Run tests with loaded questions
    for (let i = 0; i < Math.min(questions.length, 2); i++) {
      if (i > 0) {
        console.log('\n⏳ Waiting 3 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      await testApiCall(config, questions[i], i + 1);
    }
    
    console.log('\n✅ API tests complete!');
    console.log('\n📝 Next Steps:');
    console.log('   - If tests succeeded, you can run: npm run load-test');
    console.log('   - Update .env with actual CONVERSATION_ID for real testing');
    console.log('   - Adjust PAUSE_MINUTES and CONCURRENT_SESSIONS as needed\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
