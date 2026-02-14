#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, getApps } from 'firebase/app';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const DEFAULT_INPUT = path.join(repoRoot, 'data/schemes/agriculture_schemes_catalog.json');
const DEFAULT_COLLECTION = 'agricultureSchemeCatalog';
const DEFAULT_CONCURRENCY = 20;
const FIRESTORE_MAX_DOC_BYTES = 1_000_000;
const SOFT_DOC_LIMIT_BYTES = Math.floor(FIRESTORE_MAX_DOC_BYTES * 0.9);

function parseArgs(argv) {
  const args = {
    inputPath: DEFAULT_INPUT,
    collectionName: DEFAULT_COLLECTION,
    concurrency: DEFAULT_CONCURRENCY,
  };

  argv.forEach((arg) => {
    if (!arg.startsWith('--')) return;

    const [rawKey, rawValue = ''] = arg.slice(2).split('=');
    const key = rawKey.trim();
    const value = rawValue.trim();

    if (key === 'input' && value) {
      args.inputPath = path.resolve(repoRoot, value);
    }

    if (key === 'collection' && value) {
      args.collectionName = value;
    }

    if (key === 'concurrency' && value) {
      args.concurrency = Number(value);
    }
  });

  if (!Number.isInteger(args.concurrency) || args.concurrency <= 0) {
    throw new Error('Invalid --concurrency value. Must be a positive integer.');
  }

  return args;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) continue;

    const key = trimmed.slice(0, equalIndex).trim();
    const rawValue = trimmed.slice(equalIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function stripUndefined(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item));
  }

  if (value && typeof value === 'object') {
    const output = {};
    Object.entries(value).forEach(([key, itemValue]) => {
      if (itemValue !== undefined) {
        output[key] = stripUndefined(itemValue);
      }
    });
    return output;
  }

  return value;
}

function sanitizeForFirestore(record) {
  const basePayload = stripUndefined({ ...record });
  const withRaw = { ...basePayload };

  const withRawBytes = Buffer.byteLength(JSON.stringify(withRaw), 'utf8');

  if (withRawBytes <= SOFT_DOC_LIMIT_BYTES) {
    return {
      payload: withRaw,
      rawTrimmed: false,
      approxBytes: withRawBytes,
    };
  }

  const withoutRaw = { ...basePayload };
  delete withoutRaw.raw;

  const withoutRawBytes = Buffer.byteLength(JSON.stringify(withoutRaw), 'utf8');

  if (withoutRawBytes > SOFT_DOC_LIMIT_BYTES) {
    throw new Error(
      `Record ${record.schemeDocId || record.slug || 'unknown'} exceeds Firestore size limit even after removing raw payload.`
    );
  }

  return {
    payload: {
      ...withoutRaw,
      integrity: {
        ...(withoutRaw.integrity || {}),
        rawTrimmedForFirestore: true,
      },
    },
    rawTrimmed: true,
    approxBytes: withoutRawBytes,
  };
}

async function runWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function workerLoop() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) return;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => workerLoop());
  await Promise.all(workers);

  return results;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  loadEnvFile(path.join(repoRoot, '.env.local'));

  const requiredKeys = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  const missingKeys = requiredKeys.filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    throw new Error(`Missing required env keys: ${missingKeys.join(', ')}`);
  }

  if (!fs.existsSync(args.inputPath)) {
    throw new Error(`Input file not found: ${args.inputPath}`);
  }

  const rawInput = fs.readFileSync(args.inputPath, 'utf8');
  const records = JSON.parse(rawInput);

  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('Input catalog is empty or invalid.');
  }

  const app =
    getApps()[0] ||
    initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    });

  const db = getFirestore(app);
  const runId = `agri_seed_${Date.now()}`;
  const startedAt = Date.now();

  let seededCount = 0;
  let rawTrimmedCount = 0;
  const failures = [];

  await runWithConcurrency(records, args.concurrency, async (record, index) => {
    const schemeDocId = String(record.schemeDocId || record.slug || `scheme-${index + 1}`);

    try {
      const sanitized = sanitizeForFirestore(record);
      if (sanitized.rawTrimmed) {
        rawTrimmedCount += 1;
      }

      await setDoc(
        doc(db, args.collectionName, schemeDocId),
        {
          ...sanitized.payload,
          seedMeta: {
            seedVersion: 'agriculture_schemes_v1',
            seedRunId: runId,
            sourceFile: path.relative(repoRoot, args.inputPath),
            seededAtIso: new Date().toISOString(),
            approxBytes: sanitized.approxBytes,
          },
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );

      seededCount += 1;
      if ((index + 1) % 50 === 0 || index + 1 === records.length) {
        console.log(`Seed progress: ${index + 1}/${records.length}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ schemeDocId, error: message });
      console.error(`Failed to seed ${schemeDocId}: ${message}`);
    }
  });

  const durationMs = Date.now() - startedAt;

  console.log('---');
  console.log(`Collection: ${args.collectionName}`);
  console.log(`Project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
  console.log(`Seeded: ${seededCount}/${records.length}`);
  console.log(`Raw trimmed for size safety: ${rawTrimmedCount}`);
  console.log(`Failures: ${failures.length}`);
  console.log(`Duration: ${durationMs} ms`);

  if (failures.length > 0) {
    const failurePath = path.join(repoRoot, 'data/schemes/agriculture_schemes_seed_failures.json');
    fs.writeFileSync(failurePath, JSON.stringify({ runId, failures }, null, 2), 'utf8');
    console.log(`Failure report written to: ${failurePath}`);
  }

  if (seededCount === 0) {
    throw new Error('No records were seeded.');
  }
}

main().catch((error) => {
  console.error('Agriculture scheme seed failed:', error);
  process.exit(1);
});
