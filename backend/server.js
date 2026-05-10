import http from 'node:http';
import { GoogleGenAI } from '@google/genai';
import { DERIVED_TO_SOURCE_COLUMN, loadDataCenters } from './database.js';
import { buildSqlPrompt } from './sqlPrompt.js';
import 'dotenv/config';

const PORT = Number(process.env.PORT || 3001);
const MODEL = 'gemini-3-flash-preview';
const RATE_LIMIT = Number(process.env.CHAT_RPM_LIMIT || 5);
const WINDOW_MS = 60_000;
const MAX_MESSAGES = 10;
const RESULT_LIMIT = 50;
const RATE_LIMIT_MESSAGE = 'We ran out of Gemini requests. Please wait one minute and try again.';
const DATA_PATH = new URL('../public/data_centers.csv', import.meta.url);
const SPARSE_MISSING_RATIO = 0.5;

const ai = process.env.GOOGLE_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })
  : null;

let requestTimes = [];

const dataCenters = loadDataCenters(DATA_PATH);
const SQL_SYSTEM_PROMPT = buildSqlPrompt(dataCenters);

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

function getLatestUserMessage(payload) {
  const rawMessages = Array.isArray(payload.messages)
    ? payload.messages
    : [{ role: 'user', text: payload.message }];

  return rawMessages
    .slice(-MAX_MESSAGES)
    .reverse()
    .find((message) => message?.role !== 'assistant' && typeof message?.text === 'string')
    ?.text
    ?.trim() || '';
}

function parseSqlResponse(text) {
  const cleaned = text.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const parsed = JSON.parse(cleaned);
  const sql = typeof parsed.sql === 'string' ? parsed.sql.trim() : null;
  return sql || null;
}

function validateSql(sql) {
  let cleanSql = sql.trim();

  if (cleanSql.endsWith(';')) {
    cleanSql = cleanSql.slice(0, -1).trim();
  }

  if (!/^select\b/i.test(cleanSql)) {
    throw new Error('Only SELECT queries are allowed.');
  }

  if (cleanSql.includes(';')) {
    throw new Error('Only one SQL statement is allowed.');
  }

  if (/--|\/\*/.test(cleanSql)) {
    throw new Error('SQL comments are not allowed.');
  }

  if (/\b(drop|delete|insert|update|create|alter|attach|detach|pragma|vacuum)\b/i.test(cleanSql)) {
    throw new Error('Only read-only SELECT queries are allowed.');
  }

  if (!/\bfrom\s+["`]?\bdata_centers\b["`]?/i.test(cleanSql)) {
    throw new Error('Queries must read from data_centers.');
  }

  if (!/\blimit\b/i.test(cleanSql)) {
    cleanSql = `${cleanSql} LIMIT ${RESULT_LIMIT}`;
  }

  dataCenters.db.prepare(`EXPLAIN QUERY PLAN ${cleanSql}`).all();
  return cleanSql;
}

function markdownCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return text
    .replaceAll('|', '\\|')
    .replace(/\s+/g, ' ')
    .slice(0, 160);
}

function rowsToMarkdown(rows) {
  if (!rows.length) {
    return 'No rows returned.';
  }

  const columns = Object.keys(rows[0]);
  const header = `| ${columns.map(markdownCell).join(' | ')} |`;
  const separator = `| ${columns.map(() => '---').join(' | ')} |`;
  const body = rows
    .map((row) => `| ${columns.map((column) => markdownCell(row[column])).join(' | ')} |`)
    .join('\n');

  return `${header}\n${separator}\n${body}`;
}

function sqlReferencesColumn(sql, column) {
  return new RegExp(`\\b${column}\\b`, 'i').test(sql);
}

function getSparseNotes(sql) {
  const referencedSources = new Set();

  for (const column of dataCenters.columns) {
    if (sqlReferencesColumn(sql, column)) {
      referencedSources.add(column);
    }
  }

  for (const [derivedColumn, sourceColumn] of Object.entries(DERIVED_TO_SOURCE_COLUMN)) {
    if (sqlReferencesColumn(sql, derivedColumn)) {
      referencedSources.add(sourceColumn);
    }
  }

  return [...referencedSources]
    .map((column) => ({ column, stats: dataCenters.missingStats[column] }))
    .filter(({ stats }) => stats && stats.missingRatio > SPARSE_MISSING_RATIO)
    .map(({ column, stats }) => (
      `Note: \`${column}\` is missing for ${stats.missing.toLocaleString()} of ${stats.total.toLocaleString()} rows, so this result only reflects rows where that field is reported.`
    ));
}

function formatSqlReply(sql, rows) {
  const notes = getSparseNotes(sql);
  const footerNotes = [
    ...notes,
    `Results are limited to ${RESULT_LIMIT} rows.`,
  ];
  const noteText = `\n\n${footerNotes.join('\n')}`;
  return `\`\`\`sql\n${sql}\n\`\`\`\n\n${rowsToMarkdown(rows)}${noteText}`;
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

  const message = getLatestUserMessage(payload);
  if (!message) {
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
      contents: message,
      config: {
        systemInstruction: SQL_SYSTEM_PROMPT,
      },
    });

    const sql = parseSqlResponse(response.text || '');
    if (!sql) {
      sendJson(res, 200, {
        reply: 'I can answer questions about the data center dataset. Try asking something like "How many data centers are there in Illinois?"',
      });
      return;
    }

    const validSql = validateSql(sql);
    const rows = dataCenters.db.prepare(validSql).all();

    sendJson(res, 200, {
      reply: formatSqlReply(validSql, rows),
    });
  } catch (error) {
    if (isGeminiRateLimit(error)) {
      sendJson(res, 429, {
        error: 'RATE_LIMIT',
        message: RATE_LIMIT_MESSAGE,
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
