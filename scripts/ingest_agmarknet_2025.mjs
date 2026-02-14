#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, getApps } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const SOURCE_BASE_URL = 'https://agmarknet.ceda.ashoka.edu.in';
const SOURCE_YEAR = 2025;
const TAXONOMY_VERSION_ID = 'agmarknet_2025_v1';
const MARKET_TAXONOMY_COLLECTION = 'marketTaxonomy';
const MARKET_SERIES_COLLECTION = 'marketSeries';
const MARKET_INGEST_RUNS_COLLECTION = 'marketIngestRuns';

const SIGNALS = ['SIGINT', 'SIGTERM'];
const CHECKPOINT_EVERY = 20;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const raw = trimmed.slice(idx + 1).trim();
    const value = raw.replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function parseBoolean(value, defaultValue) {
  if (value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n'].includes(normalized)) return false;
  return defaultValue;
}

function parseArgs(argv) {
  const parsed = {};
  for (const token of argv.slice(2)) {
    if (!token.startsWith('--')) continue;
    const [key, rawValue] = token.slice(2).split('=');
    if (rawValue === undefined) {
      parsed[key] = true;
    } else {
      parsed[key] = rawValue;
    }
  }

  const year = Number(parsed.year || SOURCE_YEAR);
  const concurrency = Math.max(1, Number(parsed.concurrency || 4));
  const maxCombos =
    parsed['max-combos'] === undefined ? null : Math.max(1, Number(parsed['max-combos']));
  const granularities = String(parsed.granularities || 'd,m,y')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => ['d', 'm', 'y'].includes(value));

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error(`Invalid --year value: ${parsed.year}`);
  }

  if (!Number.isFinite(concurrency) || concurrency < 1 || concurrency > 32) {
    throw new Error(`Invalid --concurrency value: ${parsed.concurrency}`);
  }

  if (maxCombos !== null && (!Number.isFinite(maxCombos) || maxCombos < 1)) {
    throw new Error(`Invalid --max-combos value: ${parsed['max-combos']}`);
  }

  if (granularities.length === 0) {
    throw new Error(`Invalid --granularities value: ${parsed.granularities}`);
  }

  return {
    year,
    resume: Boolean(parsed.resume),
    concurrency,
    maxCombos,
    granularities,
    strictAllCombos: parseBoolean(parsed['strict-all-combos'], true),
    runId: parsed['run-id'] ? String(parsed['run-id']) : null,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
}

async function fetchJson(url, options = {}, config = {}) {
  const retries = config.retries ?? 4;
  const timeoutMs = config.timeoutMs ?? 30000;
  const retryBaseMs = config.retryBaseMs ?? 600;
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await requestWithTimeout(url, options, timeoutMs);
      const text = await response.text();
      let json = null;
      if (text && text.length > 0) {
        try {
          json = JSON.parse(text);
        } catch (error) {
          throw new Error(`Invalid JSON response from ${url}: ${error.message}`);
        }
      }

      if (!response.ok) {
        const errorText =
          json && typeof json === 'object' && json.error
            ? String(json.error)
            : `${response.status} ${response.statusText}`;
        throw new Error(`HTTP ${response.status} from ${url}: ${errorText}`);
      }

      return json;
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      const waitMs = retryBaseMs * Math.pow(2, attempt);
      await sleep(waitMs);
    }
  }

  throw lastError || new Error(`Request failed for ${url}`);
}

function normalizeNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizePriceRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => row && typeof row === 'object')
    .map((row) => ({
      t: String(row.t || ''),
      p_min: normalizeNumber(row.p_min),
      p_max: normalizeNumber(row.p_max),
      p_modal: normalizeNumber(row.p_modal),
    }))
    .filter((row) => row.t.length > 0);
}

function normalizeQuantityRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => row && typeof row === 'object')
    .map((row) => ({
      t: String(row.t || ''),
      qty: normalizeNumber(row.qty),
    }))
    .filter((row) => row.t.length > 0);
}

function levelFor(stateId, districtId) {
  if (stateId === 0 && districtId === 0) return 'all_india';
  if (districtId === 0) return 'state';
  return 'district';
}

function buildSeriesId({ year, granularity, stateId, districtId, commodityId }) {
  return `y${year}_${granularity}_${stateId}_${districtId}_${commodityId}`;
}

function withUncategorizedCategory(categories, commodities) {
  const hasUncategorizedCommodity = commodities.some((item) => item.categoryId === null);
  const hasUncategorizedCategory = categories.some((item) => item.categoryId === null);
  if (hasUncategorizedCommodity && !hasUncategorizedCategory) {
    return [...categories, { categoryId: null, categoryName: 'Uncategorized' }];
  }
  return categories;
}

function toIsoString(value) {
  if (value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchTaxonomy() {
  const [categoriesResponse, commoditiesResponse, statesResponse] = await Promise.all([
    fetchJson(`${SOURCE_BASE_URL}/api/categories`, { method: 'GET' }),
    fetchJson(`${SOURCE_BASE_URL}/api/commodities`, { method: 'GET' }),
    fetchJson(`${SOURCE_BASE_URL}/api/states`, { method: 'GET' }),
  ]);

  const categories = Array.isArray(categoriesResponse?.data)
    ? categoriesResponse.data
        .filter((row) => row && typeof row === 'object')
        .map((row) => ({
          categoryId: toNumberOrNull(row.category_id),
          categoryName: String(row.category_name || 'Unknown Category'),
        }))
    : [];

  const categoryNameById = new Map(
    categories
      .filter((item) => item.categoryId !== null)
      .map((item) => [item.categoryId, item.categoryName])
  );

  const commodities = Array.isArray(commoditiesResponse?.data)
    ? commoditiesResponse.data
        .filter((row) => row && typeof row === 'object')
        .map((row) => {
          const categoryId = toNumberOrNull(row.category_id);
          return {
            commodityId: Number(row.commodity_id),
            commodityName: String(row.commodity_disp_name || 'Unknown Commodity'),
            categoryId,
            categoryName:
              categoryId === null
                ? 'Uncategorized'
                : categoryNameById.get(categoryId) || 'Uncategorized',
          };
        })
        .filter((row) => Number.isFinite(row.commodityId))
    : [];

  const states = Array.isArray(statesResponse?.data)
    ? statesResponse.data
        .filter((row) => row && typeof row === 'object')
        .map((row) => ({
          stateId: Number(row.census_state_id),
          stateName: String(row.census_state_name || 'Unknown State'),
        }))
        .filter((row) => Number.isFinite(row.stateId))
    : [];

  const districtsByState = [];
  for (const state of states) {
    const districtResponse = await fetchJson(
      `${SOURCE_BASE_URL}/api/districts?state_id=${state.stateId}`,
      { method: 'GET' }
    );
    const districts = Array.isArray(districtResponse?.data)
      ? districtResponse.data
          .filter((row) => row && typeof row === 'object')
          .map((row) => ({
            districtId: Number(row.census_district_id),
            districtName: String(row.census_district_name || 'Unknown District'),
            stateId: state.stateId,
            stateName: state.stateName,
          }))
          .filter((row) => Number.isFinite(row.districtId))
      : [];

    districtsByState.push({
      stateId: state.stateId,
      stateName: state.stateName,
      districts,
    });
  }

  const normalizedCategories = withUncategorizedCategory(categories, commodities).sort((a, b) => {
    if (a.categoryId === null) return 1;
    if (b.categoryId === null) return -1;
    return a.categoryId - b.categoryId;
  });

  commodities.sort((a, b) => a.commodityName.localeCompare(b.commodityName));
  states.sort((a, b) => a.stateName.localeCompare(b.stateName));
  districtsByState.sort((a, b) => a.stateName.localeCompare(b.stateName));
  for (const entry of districtsByState) {
    entry.districts.sort((a, b) => a.districtName.localeCompare(b.districtName));
  }

  const districtCount = districtsByState.reduce((sum, entry) => sum + entry.districts.length, 0);

  return {
    versionId: TAXONOMY_VERSION_ID,
    source: SOURCE_BASE_URL,
    fetchedAt: new Date().toISOString(),
    categories: normalizedCategories,
    commodities,
    states,
    districtsByState,
    counts: {
      categories: normalizedCategories.length,
      commodities: commodities.length,
      states: states.length,
      districts: districtCount,
    },
  };
}

function createCombinationGenerator({ taxonomy, year, granularities, startCursor }) {
  const { commodities, states, districtsByState } = taxonomy;
  let cursor = 0;

  function shouldYield() {
    const result = cursor >= startCursor;
    cursor += 1;
    return result;
  }

  function* iter() {
    for (const commodity of commodities) {
      for (const granularity of granularities) {
        if (shouldYield()) {
          yield {
            cursor: cursor - 1,
            year,
            granularity,
            categoryId: commodity.categoryId,
            categoryName: commodity.categoryName,
            commodityId: commodity.commodityId,
            commodityName: commodity.commodityName,
            stateId: 0,
            stateName: 'All India',
            districtId: 0,
            districtName: 'All Districts',
          };
        }
      }

      for (const state of states) {
        for (const granularity of granularities) {
          if (shouldYield()) {
            yield {
              cursor: cursor - 1,
              year,
              granularity,
              categoryId: commodity.categoryId,
              categoryName: commodity.categoryName,
              commodityId: commodity.commodityId,
              commodityName: commodity.commodityName,
              stateId: state.stateId,
              stateName: state.stateName,
              districtId: 0,
              districtName: 'All Districts',
            };
          }
        }
      }

      for (const stateDistricts of districtsByState) {
        for (const district of stateDistricts.districts) {
          for (const granularity of granularities) {
            if (shouldYield()) {
              yield {
                cursor: cursor - 1,
                year,
                granularity,
                categoryId: commodity.categoryId,
                categoryName: commodity.categoryName,
                commodityId: commodity.commodityId,
                commodityName: commodity.commodityName,
                stateId: stateDistricts.stateId,
                stateName: stateDistricts.stateName,
                districtId: district.districtId,
                districtName: district.districtName,
              };
            }
          }
        }
      }
    }
  }

  return iter();
}

function plannedComboCount(taxonomy, granularities) {
  const commodityCount = taxonomy.commodities.length;
  const stateCount = taxonomy.states.length;
  const districtCount = taxonomy.counts.districts;
  const geoLevelsPerCommodity = 1 + stateCount + districtCount;
  return commodityCount * geoLevelsPerCommodity * granularities.length;
}

function agmarknetPostHeaders() {
  return {
    Origin: SOURCE_BASE_URL,
    Referer: `${SOURCE_BASE_URL}/`,
    'User-Agent': 'Mozilla/5.0',
    'Content-Type': 'application/json',
  };
}

async function fetchMetric(metric, payload) {
  const endpoint = metric === 'price' ? 'prices' : 'quantities';
  const response = await fetchJson(
    `${SOURCE_BASE_URL}/api/${endpoint}`,
    {
      method: 'POST',
      headers: agmarknetPostHeaders(),
      body: JSON.stringify(payload),
    },
    {
      retries: 4,
      timeoutMs: 35000,
      retryBaseMs: 700,
    }
  );

  return Array.isArray(response?.data) ? response.data : [];
}

async function resolveRunForResume(db, options) {
  if (options.runId) {
    const snapshot = await getDoc(doc(db, MARKET_INGEST_RUNS_COLLECTION, options.runId));
    if (!snapshot.exists()) return null;
    return { runId: snapshot.id, data: snapshot.data() };
  }

  const snapshot = await getDocs(query(collection(db, MARKET_INGEST_RUNS_COLLECTION), limit(200)));
  if (snapshot.empty) return null;

  const candidates = snapshot.docs
    .map((item) => ({ runId: item.id, data: item.data() }))
    .filter((item) => {
      const runYear = Number(item.data?.runConfig?.year || 0);
      const status = String(item.data?.status || '');
      return runYear === options.year && ['running', 'interrupted'].includes(status);
    })
    .sort((a, b) => {
      const aDate = new Date(toIsoString(a.data?.startedAt)).getTime();
      const bDate = new Date(toIsoString(b.data?.startedAt)).getTime();
      return bDate - aDate;
    });

  return candidates[0] || null;
}

async function initializeFirestore() {
  loadEnvFile(path.join(repoRoot, '.env.local'));

  const requiredKeys = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];
  const missing = requiredKeys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required Firebase env keys: ${missing.join(', ')}`);
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

  return getFirestore(app);
}

async function main() {
  const options = parseArgs(process.argv);
  const db = await initializeFirestore();

  console.log('Starting Agmarknet ingestion with config:', JSON.stringify(options, null, 2));
  console.log('Fetching taxonomy from source endpoints...');
  const taxonomy = await fetchTaxonomy();
  const plannedCombos = plannedComboCount(taxonomy, options.granularities);
  console.log(
    `Taxonomy fetched. categories=${taxonomy.counts.categories}, commodities=${taxonomy.counts.commodities}, states=${taxonomy.counts.states}, districts=${taxonomy.counts.districts}, planned=${plannedCombos}`
  );

  await setDoc(
    doc(db, MARKET_TAXONOMY_COLLECTION, TAXONOMY_VERSION_ID),
    {
      ...taxonomy,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  const now = new Date().toISOString();
  let runId = `agmarknet_y${options.year}_${Date.now()}`;
  let startCursor = 0;

  const runState = {
    runConfig: {
      year: options.year,
      granularities: options.granularities,
      metrics: ['price', 'quantity'],
      strictAllCombos: options.strictAllCombos,
      concurrency: options.concurrency,
      maxCombos: options.maxCombos,
      taxonomyVersion: TAXONOMY_VERSION_ID,
      sourceBaseUrl: SOURCE_BASE_URL,
    },
    totals: {
      plannedCombos,
      attempted: 0,
      stored: 0,
      empty: 0,
      failed: 0,
    },
    checkpoint: {
      cursor: 0,
      lastCommodityId: null,
      lastStateId: null,
      lastDistrictId: null,
      granularity: null,
      updatedAt: now,
    },
    errors: [],
    startedAt: now,
    endedAt: null,
    status: 'running',
  };

  if (options.resume) {
    const existing = await resolveRunForResume(db, options);
    if (existing) {
      runId = existing.runId;
      const existingData = existing.data || {};
      const checkpoint = existingData.checkpoint || {};
      startCursor = Number(checkpoint.cursor || 0);
      runState.totals = {
        plannedCombos: Number(existingData.totals?.plannedCombos || plannedCombos),
        attempted: Number(existingData.totals?.attempted || 0),
        stored: Number(existingData.totals?.stored || 0),
        empty: Number(existingData.totals?.empty || 0),
        failed: Number(existingData.totals?.failed || 0),
      };
      runState.checkpoint = {
        cursor: startCursor,
        lastCommodityId: checkpoint.lastCommodityId ?? null,
        lastStateId: checkpoint.lastStateId ?? null,
        lastDistrictId: checkpoint.lastDistrictId ?? null,
        granularity: checkpoint.granularity ?? null,
        updatedAt: toIsoString(checkpoint.updatedAt || now),
      };
      runState.errors = Array.isArray(existingData.errors) ? existingData.errors.slice(-30) : [];
      runState.startedAt = toIsoString(existingData.startedAt || now);
      console.log(`Resuming run ${runId} from cursor=${startCursor}`);
    } else {
      console.log('No resumable run found. Starting a new run.');
    }
  }

  const executionLimit = options.maxCombos;
  const generator = createCombinationGenerator({
    taxonomy,
    year: options.year,
    granularities: options.granularities,
    startCursor,
  });

  let issuedCombos = 0;
  let completedSinceCheckpoint = 0;
  let isShuttingDown = false;
  let shutdownReason = null;
  let checkpointWriter = Promise.resolve();

  function pushError(errorEntry) {
    runState.errors.push(errorEntry);
    if (runState.errors.length > 30) {
      runState.errors = runState.errors.slice(-30);
    }
  }

  function nextCombo() {
    if (isShuttingDown) return null;
    if (executionLimit !== null && issuedCombos >= executionLimit) return null;
    const next = generator.next();
    if (next.done) return null;
    issuedCombos += 1;
    return next.value;
  }

  async function persistRun(statusOverride = null) {
    const status = statusOverride || runState.status;
    const payload = {
      runConfig: runState.runConfig,
      totals: runState.totals,
      checkpoint: {
        ...runState.checkpoint,
        updatedAt: new Date().toISOString(),
      },
      errors: runState.errors,
      startedAt: runState.startedAt,
      endedAt: status === 'running' ? null : new Date().toISOString(),
      status,
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, MARKET_INGEST_RUNS_COLLECTION, runId), payload, { merge: true });
  }

  function queuePersist(statusOverride = null) {
    checkpointWriter = checkpointWriter
      .then(() => persistRun(statusOverride))
      .catch((error) => {
        console.error('Checkpoint persist failed:', error);
      });
    return checkpointWriter;
  }

  async function gracefulShutdown(reason) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    shutdownReason = reason;
    runState.status = 'interrupted';
    console.log(`\nReceived ${reason}. Persisting checkpoint and shutting down...`);
    await queuePersist('interrupted');
  }

  for (const signal of SIGNALS) {
    process.on(signal, () => {
      void gracefulShutdown(signal);
    });
  }

  await queuePersist('running');

  async function processCombo(combo) {
    const payload = {
      category_id: combo.categoryId,
      commodity_id: combo.commodityId,
      state_id: combo.stateId,
      district_id: combo.districtId,
      start_date: `${options.year}-01-01`,
      end_date: `${options.year}-12-31`,
      calculation_type: combo.granularity,
    };

    try {
      const [rawPriceRows, rawQuantityRows] = await Promise.all([
        fetchMetric('price', payload),
        fetchMetric('quantity', payload),
      ]);

      const priceRows = normalizePriceRows(rawPriceRows);
      const quantityRows = normalizeQuantityRows(rawQuantityRows);

      const seriesId = buildSeriesId(combo);
      if (priceRows.length > 0 || quantityRows.length > 0) {
        const docData = {
          seriesId,
          year: options.year,
          granularity: combo.granularity,
          level: levelFor(combo.stateId, combo.districtId),
          categoryId: combo.categoryId,
          categoryName: combo.categoryName,
          commodityId: combo.commodityId,
          commodityName: combo.commodityName,
          stateId: combo.stateId,
          stateName: combo.stateName,
          districtId: combo.districtId,
          districtName: combo.districtName,
          pricePoints: priceRows,
          quantityPoints: quantityRows,
          pricePointCount: priceRows.length,
          quantityPointCount: quantityRows.length,
          lastUpdated: new Date().toISOString(),
          sourceMetadata: {
            source: SOURCE_BASE_URL,
            year: options.year,
            granularities: options.granularities,
            endpoints: {
              prices: '/api/prices',
              quantities: '/api/quantities',
            },
            ingestRunId: runId,
          },
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, MARKET_SERIES_COLLECTION, seriesId), docData, { merge: true });
        runState.totals.stored += 1;
      } else {
        runState.totals.empty += 1;
      }
    } catch (error) {
      runState.totals.failed += 1;
      pushError({
        cursor: combo.cursor,
        commodityId: combo.commodityId,
        stateId: combo.stateId,
        districtId: combo.districtId,
        granularity: combo.granularity,
        message: error?.message || String(error),
        at: new Date().toISOString(),
      });
      console.error(
        `Failed combo cursor=${combo.cursor} commodity=${combo.commodityId} state=${combo.stateId} district=${combo.districtId} granularity=${combo.granularity} error=${error?.message || error}`
      );
    } finally {
      runState.totals.attempted += 1;
      runState.checkpoint = {
        cursor: combo.cursor + 1,
        lastCommodityId: combo.commodityId,
        lastStateId: combo.stateId,
        lastDistrictId: combo.districtId,
        granularity: combo.granularity,
        updatedAt: new Date().toISOString(),
      };

      completedSinceCheckpoint += 1;
      if (completedSinceCheckpoint >= CHECKPOINT_EVERY) {
        completedSinceCheckpoint = 0;
        await queuePersist('running');
        console.log(
          `Progress run=${runId} cursor=${runState.checkpoint.cursor} attempted=${runState.totals.attempted} stored=${runState.totals.stored} empty=${runState.totals.empty} failed=${runState.totals.failed}`
        );
      }
    }
  }

  async function worker(workerIndex) {
    while (!isShuttingDown) {
      const combo = nextCombo();
      if (!combo) break;
      await processCombo(combo);
      if (workerIndex === 0 && runState.totals.attempted % 200 === 0 && runState.totals.attempted > 0) {
        console.log(
          `Heartbeat attempted=${runState.totals.attempted} stored=${runState.totals.stored} empty=${runState.totals.empty} failed=${runState.totals.failed}`
        );
      }
    }
  }

  const workers = [];
  for (let i = 0; i < options.concurrency; i += 1) {
    workers.push(worker(i));
  }

  await Promise.all(workers);
  await checkpointWriter;

  if (isShuttingDown) {
    console.log(
      `Run interrupted (${shutdownReason}). Resume with: node scripts/ingest_agmarknet_2025.mjs --year=${options.year} --resume --run-id=${runId}`
    );
    return;
  }

  runState.status = 'completed';
  await queuePersist('completed');

  console.log('Ingestion completed successfully.');
  console.log(
    JSON.stringify(
      {
        runId,
        attempted: runState.totals.attempted,
        stored: runState.totals.stored,
        empty: runState.totals.empty,
        failed: runState.totals.failed,
        checkpoint: runState.checkpoint,
      },
      null,
      2
    )
  );
}

main().catch(async (error) => {
  console.error('Agmarknet ingestion failed:', error);
  process.exit(1);
});
