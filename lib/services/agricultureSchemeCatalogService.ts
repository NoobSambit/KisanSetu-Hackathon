import 'server-only';

import fs from 'node:fs/promises';
import path from 'node:path';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { AgricultureSchemeCatalogRecord } from '@/types';

export const AGRICULTURE_SCHEME_COLLECTION = 'agricultureSchemeCatalog';

const LOCAL_CATALOG_FILE = path.join(process.cwd(), 'data/schemes/agriculture_schemes_catalog.json');
const MAX_FIRESTORE_READ = 1200;
const FIRESTORE_CACHE_TTL_MS = 10 * 60 * 1000;

type CatalogSourcePreference = 'auto' | 'firestore' | 'local';

export type AgricultureCatalogSource = 'firestore' | 'local_file';

let localCatalogCache: {
  loadedAt: number;
  records: AgricultureSchemeCatalogRecord[];
} | null = null;

let firestoreCatalogCache: {
  loadedAt: number;
  records: AgricultureSchemeCatalogRecord[];
} | null = null;

function sortCatalog(records: AgricultureSchemeCatalogRecord[]): AgricultureSchemeCatalogRecord[] {
  return [...records].sort((a, b) => a.title.localeCompare(b.title));
}

async function readCatalogFromLocalFile(): Promise<AgricultureSchemeCatalogRecord[]> {
  if (localCatalogCache) {
    return localCatalogCache.records;
  }

  const raw = await fs.readFile(LOCAL_CATALOG_FILE, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('Local agriculture scheme catalog is malformed. Expected array payload.');
  }

  const records = sortCatalog(parsed as AgricultureSchemeCatalogRecord[]);

  localCatalogCache = {
    loadedAt: Date.now(),
    records,
  };

  return records;
}

async function readCatalogFromFirestore(): Promise<AgricultureSchemeCatalogRecord[]> {
  if (firestoreCatalogCache && Date.now() - firestoreCatalogCache.loadedAt <= FIRESTORE_CACHE_TTL_MS) {
    return firestoreCatalogCache.records;
  }

  if (!db) {
    throw new Error('Firestore is not configured.');
  }

  const snapshot = await getDocs(query(collection(db, AGRICULTURE_SCHEME_COLLECTION), limit(MAX_FIRESTORE_READ)));

  if (snapshot.empty) {
    return [];
  }

  const records = snapshot.docs.map((docItem) => docItem.data() as AgricultureSchemeCatalogRecord);
  const sorted = sortCatalog(records);

  firestoreCatalogCache = {
    loadedAt: Date.now(),
    records: sorted,
  };

  return sorted;
}

export async function getAgricultureSchemeCatalog(
  sourcePreference: CatalogSourcePreference = 'auto'
): Promise<{
  records: AgricultureSchemeCatalogRecord[];
  source: AgricultureCatalogSource;
  warning: string | null;
}> {
  if (sourcePreference === 'local') {
    const records = await readCatalogFromLocalFile();
    return {
      records,
      source: 'local_file',
      warning: null,
    };
  }

  if (sourcePreference === 'firestore') {
    const records = await readCatalogFromFirestore();
    return {
      records,
      source: 'firestore',
      warning: null,
    };
  }

  try {
    const firestoreRecords = await readCatalogFromFirestore();

    if (firestoreRecords.length > 0) {
      return {
        records: firestoreRecords,
        source: 'firestore',
        warning: null,
      };
    }

    const localRecords = await readCatalogFromLocalFile();
    return {
      records: localRecords,
      source: 'local_file',
      warning: 'Firestore catalog is empty. Using local scraped dataset fallback.',
    };
  } catch (error) {
    const localRecords = await readCatalogFromLocalFile();
    return {
      records: localRecords,
      source: 'local_file',
      warning: `Firestore catalog unavailable (${error instanceof Error ? error.message : String(error)}). Using local scraped dataset fallback.`,
    };
  }
}
