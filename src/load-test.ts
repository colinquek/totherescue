/**
 * SomeGPT Load Testing Script
 * 
 * This script runs parallel load tests against SomeGPT API:
 * - Configurable concurrency (CONCURRENT_SESSIONS)
 * - Enforced 3-minute pause between prompts
 * - Metrics collection (response time, success rate, tokens)
 * - Results saved to results/ directory
 * 
 * Usage: npm run load-test
 */

import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Load tokens from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let AUTH_TOKEN = '';
let API_KEY = '';
let CONVERSATION_ID = '';
let PAUSE_MINUTES = 1; // Default: 1 minute between questions
let CONCURRENT_SESSIONS = 1; // Always 1 for sequential execution
let DURATION_MINUTES = 0;
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf-8');
  const authMatch = envContent.match(/^AUTH_TOKEN=(.+)$/m);
  const apiKeyMatch = envContent.match(/^API_KEY=(.+)$/m);
  const convMatch = envContent.match(/^CONVERSATION_ID=([a-f0-9-]+)$/im);
  const pauseMatch = envContent.match(/^PAUSE_MINUTES=(.+)$/m);
  const concurrentMatch = envContent.match(/^CONCURRENT_SESSIONS=(.+)$/m);
  const durationMatch = envContent.match(/^DURATION_MINUTES=(.+)$/m);
  
  AUTH_TOKEN = authMatch ? authMatch[1].trim() : '';
  API_KEY = apiKeyMatch ? apiKeyMatch[1].trim() : '';
  CONVERSATION_ID = convMatch ? convMatch[1].trim() : '';
  PAUSE_MINUTES = pauseMatch ? parseInt(pauseMatch[1]) : PAUSE_MINUTES;
  CONCURRENT_SESSIONS = 1; // Force sequential execution
  DURATION_MINUTES = durationMatch ? parseInt(durationMatch[1]) : DURATION_MINUTES;
}

// Generate random conversation ID if not provided
if (!CONVERSATION_ID) {
  CONVERSATION_ID = randomUUID();
  console.log(`📝 Generated new Conversation ID: ${CONVERSATION_ID}\n`);
}

// Load API endpoint from environment
const API_ENDPOINT = process.env.API_ENDPOINT || (() => {
  const endpointMatch = envContent.match(/^API_ENDPOINT=(.+)$/m);
  if (!endpointMatch) {
    console.error('❌ API_ENDPOINT not found in .env.local!');
    console.error('   Please add API_ENDPOINT to your .env.local file\n');
    process.exit(1);
  }
  return endpointMatch[1].trim();
})();

interface TestMetrics {
  sessionId: string;
  startTime: number;
  endTime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  totalTokens: number;
  errors: string[];
  responses: string[];
}

interface LoadTestResults {
  startTime: string;
  endTime: string;
  totalSessions: number;
  metrics: TestMetrics[];
  summary: {
    totalRequests: number;
    successRate: number;
    avgResponseTime: number;
    totalTokens: number;
  };
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
    console.error(`❌ Questions index not found: ${QUESTIONS_INDEX}`);
    console.error('   Please create questions/index.json with question definitions\n');
    process.exit(1);
  }
  
  const indexContent = fs.readFileSync(QUESTIONS_INDEX, 'utf-8');
  const index: QuestionsIndex = JSON.parse(indexContent);
  
  const questions: string[] = [];
  
  for (const entry of index.questions) {
    const questionFile = path.join(QUESTIONS_DIR, entry.file);
    
    if (!fs.existsSync(questionFile)) {
      console.warn(`⚠️  Question file not found: ${entry.file}, skipping...`);
      continue;
    }
    
    const questionText = fs.readFileSync(questionFile, 'utf-8').trim();
    questions.push(questionText);
  }
  
  if (questions.length === 0) {
    console.error('❌ No questions loaded from index');
    console.error('   Please check questions/index.json and ensure files exist\n');
    process.exit(1);
  }
  
  console.log(`📚 Loaded ${questions.length} question(s) from questions/\n`);
  return questions;
}

function validateConfig(): void {
  if (!AUTH_TOKEN) {
    throw new Error('❌ AUTH_TOKEN not found. Please run: npm run extract-tokens');
  }
  if (!API_KEY) {
    throw new Error('❌ API_KEY not found. Please run: npm run extract-tokens');
  }
}

// System prompt to prepend to each question
const SYSTEM_PROMPT = `IMPORTANT INSTRUCTIONS:

1. Carefully analyze and consider this question before responding
2. Work through the problem step-by-step in your reasoning
3. Internally verify your answer for accuracy
4. DO NOT verbalize your thought process or reasoning steps
5. Respond ONLY with your final answer, clearly formatted
6. Show essential calculations but keep the response concise
7. Ensure your answer is complete and directly addresses the question

Remember: Think deeply, verify thoroughly, but present only your final answer.`;

async function sendChatRequest(
  message: string,
  sessionId: string
): Promise<{ success: boolean; responseTime: number; tokens?: number; error?: string; response?: string }> {
  const startTime = Date.now();
  
  try {
    const requestBody = {
      message: [[
        {
          type: 'text',
          text: SYSTEM_PROMPT
        },
        {
          type: 'text',
          text: message
        }
      ]],
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
          hash: 'load-test'
        },
        memory: {
          user_id: '5db3ed13-73b5-4f93-8ce1-2fa7701888e7',
          session_id: `${CONVERSATION_ID}-${sessionId}`
        }
      }
    };
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'authorization': `Bearer ${AUTH_TOKEN}`,
        'x-api-key': `Bearer ${API_KEY}`,
        'content-type': 'application/json',
        'origin': 'https://ncsgpt.ncs.com.sg',
        'referer': `https://ncsgpt.ncs.com.sg/?conversation_id=${CONVERSATION_ID}`,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0'
      },
      body: JSON.stringify(requestBody),
      agent: httpsAgent
    });
    
    const responseTime = Date.now() - startTime;
    const responseBody = await response.text();
    
    if (!response.ok) {
      return {
        success: false,
        responseTime,
        error: `HTTP ${response.status}: ${responseBody.substring(0, 200)}`
      };
    }
    
    // Check if response contains error
    if (responseBody.includes('[error]')) {
      return {
        success: false,
        responseTime,
        error: responseBody.substring(0, 200)
      };
    }
    
    // Count tokens roughly from response length (streaming format)
    const tokens = Math.floor(responseBody.length / 4); // Approximate
    
    return {
      success: true,
      responseTime,
      tokens,
      response: responseBody
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function runSession(
  sessionId: string,
  stopSignal: { stopped: boolean }
): Promise<TestMetrics> {
  const metrics: TestMetrics = {
    sessionId,
    startTime: Date.now(),
    endTime: 0,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0,
    totalTokens: 0,
    errors: [],
    responses: []
  };
  
  const responseTimes: number[] = [];
  
  // Load questions first
  const questions = loadQuestions();
  
  console.log(`\n🚀 Sequential Test Session Started`);
  console.log(`   Total questions: ${questions.length}`);
  console.log(`   Pause between questions: ${PAUSE_MINUTES} minutes\n`);
  
  let iteration = 0;
  
  // Run through all questions sequentially
  const totalQuestions = questions.length;
  
  while (iteration < totalQuestions && !stopSignal.stopped) {
    const questionIndex = iteration % questions.length;
    const question = questions[questionIndex];
    iteration++;
    
    console.log(`\n📤 Question ${iteration}/${totalQuestions} (Complexity ${questionIndex + 1}):`);
    console.log(`   ${questions[questionIndex]}`);
    console.log(`\n   Sending request...`);
    
    const result = await sendChatRequest(question, sessionId);
    
    metrics.totalRequests++;
    
    if (result.success) {
      metrics.successfulRequests++;
      if (result.tokens) {
        metrics.totalTokens += result.tokens;
      }
      if (result.response) {
        metrics.responses.push(result.response);
      }
    } else {
      metrics.failedRequests++;
      metrics.errors.push(result.error || 'Unknown error');
    }
    
    responseTimes.push(result.responseTime);
    metrics.avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    console.log(`   ${result.success ? '✅' : '❌'} ${result.responseTime}ms${result.tokens ? ` | ${result.tokens} tokens` : ''}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    } else if (result.response) {
      // Display full response
      console.log(`\n   📝 Response:`);
      const responseLines = result.response.split('\n').slice(0, 50); // Show first 50 lines
      responseLines.forEach(line => {
        console.log(`      ${line}`);
      });
      if (result.response.split('\n').length > 50) {
        console.log(`      ... (response truncated, ${result.response.split('\n').length - 50} more lines)`);
      }
      console.log('');
    }
    
    // Check if we've completed all questions
    if (iteration >= totalQuestions) {
      console.log(`\n✅ Completed all ${totalQuestions} questions!\n`);
      break;
    }
    
    // Wait before next question (minimum 3 minutes)
    if (!stopSignal.stopped) {
      const pauseMs = PAUSE_MINUTES * 60000;
      console.log(`\n⏳ Pausing for ${PAUSE_MINUTES} minutes before next question...`);
      console.log(`   Next question at: ${new Date(Date.now() + pauseMs).toLocaleTimeString()}\n`);
      
      // Wait with ability to stop
      await new Promise<void>(resolve => {
        const interval = setInterval(() => {
          if (stopSignal.stopped) {
            clearInterval(interval);
            resolve();
          }
        }, 1000);
        
        setTimeout(() => {
          clearInterval(interval);
          resolve();
        }, pauseMs);
      });
    }
  }
  
  metrics.endTime = Date.now();
    const durationMinutes = ((metrics.endTime - metrics.startTime) / 60000).toFixed(2);
    console.log(`\n🏁 Sequential test completed: ${metrics.successfulRequests}/${metrics.totalRequests} successful`);
    console.log(`   Total duration: ${durationMinutes} minutes\n`);
  return metrics;
}

async function main(): Promise<void> {
  console.log('⚡ SomeGPT Load Test');
  console.log('===================\n');
  
  try {
    validateConfig();
    
    console.log('📋 Configuration:');
    console.log(`   API Endpoint: ${API_ENDPOINT}`);
    console.log(`   Conversation ID: ${CONVERSATION_ID}`);
    console.log(`   Pause between questions: ${PAUSE_MINUTES} minute(s)`);
    console.log(`   Execution mode: Sequential (one question at a time)`);
    console.log(`   Duration: ${DURATION_MINUTES === 0 ? 'All 10 questions' : `${DURATION_MINUTES} minutes`}`);
    console.log(`   Token expires: ~1 hour from extraction\n`);
    
    // Create results directory
    const resultsDir = path.join(__dirname, '..', 'results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const startTime = new Date();
    console.log(`🕐 Start time: ${startTime.toISOString()}\n`);
    
    const stopSignal = { stopped: false };
    const sessionId = 'sequential-session';
    
    // Run single sequential session
    console.log('🔄 Running questions sequentially with 3-minute pauses...\n');
    const metrics = await runSession(sessionId, stopSignal);
    
    const endTime = new Date();
    console.log(`🕐 End time: ${endTime.toISOString()}\n`);
    
    // Calculate summary (single session)
    const totalRequests = metrics.totalRequests;
    const totalSuccessful = metrics.successfulRequests;
    const totalTokens = metrics.totalTokens;
    const avgResponseTime = metrics.avgResponseTime;
    
    const results: LoadTestResults = {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalSessions: 1,
      metrics: [metrics],
      summary: {
        totalRequests,
        successRate: (totalSuccessful / totalRequests) * 100,
        avgResponseTime,
        totalTokens
      }
    };
    
    // Save results
    const timestamp = startTime.toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(resultsDir, `load-test-${timestamp}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2), 'utf-8');
    
    // Print summary
    console.log('\n📊 Sequential Test Summary');
    console.log('=========================');
    console.log(`Questions Completed: ${totalRequests}/10`);
    console.log(`Successful: ${totalSuccessful} (${results.summary.successRate.toFixed(2)}%)`);
    console.log(`Failed: ${totalRequests - totalSuccessful}`);
    console.log(`Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Total Tokens Generated: ${totalTokens}`);
    console.log(`Total Duration: ${((endTime.getTime() - startTime.getTime()) / 60000).toFixed(2)} minutes`);
    console.log(`Avg Time per Question: ${((endTime.getTime() - startTime.getTime()) / totalRequests / 1000).toFixed(2)} seconds`);
    console.log(`\n📁 Results saved to: ${resultsFile}\n`);
    
    // Check for errors
    const allErrors = metrics.flatMap(m => m.errors);
    if (allErrors.length > 0) {
      console.log('⚠️  Errors encountered:');
      allErrors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
      console.log();
    }
    
    console.log('✅ Load test complete!\n');
    console.log('📝 To run again with fresh tokens:');
    console.log('   npm run extract-tokens  # Get fresh tokens');
    console.log('   npm run load-test       # Run load test\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
