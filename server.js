import http from 'node:http';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const PORT = Number(process.env.PORT || 3001);
const MODEL = 'gemini-3-flash-preview';
const RATE_LIMIT = Number(process.env.CHAT_RPM_LIMIT || 5);
const WINDOW_MS = 60_000;
const MAX_MESSAGES = 10;
const RATE_LIMIT_MESSAGE = 'We ran out of Gemini requests. Please wait one minute and try again.';

const ai = process.env.GOOGLE_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })
  : null;

let requestTimes = [];

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(payload));
}

function isRateLimited() {
  const now = Date.now();
  requestTimes = requestTimes.filter((time) => now - time < WINDOW_MS);

  if (requestTimes.length >= RATE_LIMIT) {
    return true;
  }

  requestTimes.push(now);
  return false;
}

function isGeminiRateLimit(error) {
  const message = String(error?.message || '');
  return error?.status === 429 ||
    error?.statusCode === 429 ||
    message.includes('429') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.toLowerCase().includes('rate limit');
}

function cleanMessages(payload) {
  const rawMessages = Array.isArray(payload.messages)
    ? payload.messages
    : [{ role: 'user', text: payload.message }];

  return rawMessages
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      role: message?.role === 'assistant' ? 'model' : 'user',
      text: typeof message?.text === 'string' ? message.text.trim() : '',
    }))
    .filter((message) => message.text)
    .map((message) => ({
      role: message.role,
      parts: [{ text: message.text }],
    }));
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

async function handleChat(req, res) {
  if (!ai) {
    sendJson(res, 500, {
      error: 'MISSING_API_KEY',
      message: 'Missing GOOGLE_API_KEY. Add it to your .env file and restart the server.',
    });
    return;
  }

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

  const contents = cleanMessages(payload);
  if (!contents.length) {
    sendJson(res, 400, {
      error: 'EMPTY_MESSAGE',
      message: 'Please enter a message before sending.',
    });
    return;
  }

  if (isRateLimited()) {
    sendJson(res, 429, {
      error: 'RATE_LIMIT',
      message: RATE_LIMIT_MESSAGE,
    });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
    });

    sendJson(res, 200, {
      reply: response.text || 'Gemini returned an empty response.',
    });
  } catch (error) {
    if (isGeminiRateLimit(error)) {
      sendJson(res, 429, {
        error: 'RATE_LIMIT',
        message: RATE_LIMIT_MESSAGE,
      });
      return;
    }

    console.error('Gemini request failed:', error);
    sendJson(res, 500, {
      error: 'GEMINI_ERROR',
      message: 'The chat service had trouble getting a response. Please try again.',
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
  console.log(`Chat server listening on http://localhost:${PORT}`);
});
