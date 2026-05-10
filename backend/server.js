import http from 'node:http';
import { GoogleGenAI } from '@google/genai';
import { runChatbotTurn, ChatbotError, isGeminiRateLimit } from './chatbot.js';
import { loadDataCenters } from './database.js';
import 'dotenv/config';

const PORT = Number(process.env.PORT || 3001);
const MODEL = 'gemini-3.1-flash-lite';
const SQL_THINKING_LEVEL = 'medium';
const SUMMARY_THINKING_LEVEL = 'low';
const RATE_LIMIT = Number(process.env.CHAT_RPM_LIMIT || 5);
const RESULT_LIMIT = 50;
const DATA_PATH = new URL('../public/data_centers.csv', import.meta.url);

const ai = process.env.GOOGLE_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })
  : null;
const dataCenters = loadDataCenters(DATA_PATH);

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 100_000) {
        req.destroy();
        reject(new Error('Request body is too large.'));
      }
    });

    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function getMessages(payload) {
  return Array.isArray(payload.messages)
    ? payload.messages
    : [{ role: 'user', text: payload.message }];
}

async function handleChat(req, res) {
  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, 400, {
      error: 'BAD_REQUEST',
      message: 'Send JSON with a message field.',
    });
    return;
  }

  try {
    const result = await runChatbotTurn({
      ai,
      model: MODEL,
      dataCenters,
      messages: getMessages(payload),
      rateLimit: RATE_LIMIT,
      resultLimit: RESULT_LIMIT,
      sqlThinkingLevel: SQL_THINKING_LEVEL,
      summaryThinkingLevel: SUMMARY_THINKING_LEVEL,
    });

    sendJson(res, 200, result);
  } catch (error) {
    if (error instanceof ChatbotError) {
      sendJson(res, error.status, {
        error: error.code,
        message: error.message,
      });
      return;
    }

    if (isGeminiRateLimit(error)) {
      sendJson(res, 429, {
        error: 'RATE_LIMIT',
        message: 'We ran out of Gemini requests. Please wait one minute and try again.',
      });
      return;
    }

    console.error('Chat request failed:', error);
    sendJson(res, 500, {
      error: 'GEMINI_ERROR',
      message: 'The chat service had trouble building a safe SQL query. Please try again.',
    });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat') {
    await handleChat(req, res);
    return;
  }

  sendJson(res, 404, {
    error: 'NOT_FOUND',
    message: 'Not found.',
  });
});

server.listen(PORT, () => {
  if (!process.env.GOOGLE_API_KEY) {
    console.warn('GOOGLE_API_KEY is not set. Chat requests will fail until it is added to .env.');
  }
  console.log(`Loaded ${dataCenters.rows.length} data center records into SQLite.`);
  console.log(`Chat server listening on http://localhost:${PORT}`);
});
