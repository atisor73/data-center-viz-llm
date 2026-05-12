import test from 'node:test';
import assert from 'node:assert/strict';
import { GoogleGenAI } from '@google/genai';
import { runChatbotTurn } from '../backend/chatbot.js';
import { loadDataCenters } from '../backend/database.js';
import 'dotenv/config';

const MODEL = 'gemini-3.1-flash-lite';
const DATA_PATH = new URL('../public/data_centers.csv', import.meta.url);

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('Missing GOOGLE_API_KEY. Add it to your .env file before running npm run test:chatbot.');
}

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
const dataCenters = loadDataCenters(DATA_PATH);

function rowHasNumber(row, expected) {
  return Object.values(row).some((value) => Number(value) === expected);
}

test('How many data centers are there in Illinois?', async () => {
  const response = await runChatbotTurn({
    ai,
    model: MODEL,
    dataCenters,
    messages: [
      { role: 'user', text: 'How many data centers are there in Illinois?' },
    ],
    resultLimit: 50,
    sqlThinkingLevel: 'medium',
    summaryThinkingLevel: 'low',
  });

  assert.ok(response.reply);
  assert.ok(response.result);
  assert.equal(response.result.rows.length, 1);
  assert.ok(rowHasNumber(response.result.rows[0], 31));
});

test('Show proposed data centers in California on the map.', async () => {
  const response = await runChatbotTurn({
    ai,
    model: MODEL,
    dataCenters,
    messages: [
      { role: 'user', text: 'Show proposed data centers in California on the map.' },
    ],
    resultLimit: 50,
    sqlThinkingLevel: 'medium',
    summaryThinkingLevel: 'low',
  });

  assert.ok(response.reply);
  assert.ok(response.filter);
  assert.equal(response.filter.searchQuery, 'California');
  assert.deepEqual(response.filter.activeStatuses, ['Proposed']);
});

test('Filter the dashboard to California and count how many data centers are there.', async () => {
  const response = await runChatbotTurn({
    ai,
    model: MODEL,
    dataCenters,
    messages: [
      { role: 'user', text: 'Filter the dashboard to California and count how many data centers are there.' },
    ],
    resultLimit: 50,
    sqlThinkingLevel: 'medium',
    summaryThinkingLevel: 'low',
  });

  assert.ok(response.reply);
  assert.ok(response.filter);
  assert.equal(response.filter.searchQuery, 'California');
  assert.ok(response.result);
  assert.equal(response.result.rows.length, 1);
  assert.ok(rowHasNumber(response.result.rows[0], 25));
});

test('Explain the central limit theorem.', async () => {
  const response = await runChatbotTurn({
    ai,
    model: MODEL,
    dataCenters,
    messages: [
      { role: 'user', text: 'Explain the central limit theorem.' },
    ],
    resultLimit: 50,
    sqlThinkingLevel: 'medium',
    summaryThinkingLevel: 'low',
  });

  assert.ok(response.reply);
  assert.equal(response.result, undefined);
  assert.equal(response.filter, undefined);
});

test('Show high water stress areas on the map.', async () => {
  const response = await runChatbotTurn({
    ai,
    model: MODEL,
    dataCenters,
    messages: [
      { role: 'user', text: 'Show high water stress areas on the map.' },
    ],
    resultLimit: 50,
    sqlThinkingLevel: 'medium',
    summaryThinkingLevel: 'low',
  });

  assert.ok(response.reply);
  assert.ok(response.filter);
  assert.ok(response.filter.activeBWSLabels.includes('High (40-80%)'));
  assert.equal(response.result, undefined);
});

test('How many data centers are in high water stress areas?', async () => {
  const response = await runChatbotTurn({
    ai,
    model: MODEL,
    dataCenters,
    messages: [
      { role: 'user', text: 'How many data centers are in high water stress areas?' },
    ],
    resultLimit: 50,
    sqlThinkingLevel: 'medium',
    summaryThinkingLevel: 'low',
  });

  assert.ok(response.reply);
  assert.equal(response.result, undefined);
});
