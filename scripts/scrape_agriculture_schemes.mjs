#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const INDIA_SCHEME_SEARCH_ENDPOINT =
  'https://www.india.gov.in/my-government/schemes/search/dataservices/getschemes';
const MYSCHEME_API_BASE = 'https://api.myscheme.gov.in/schemes/v6/public/schemes';
const CATEGORY_ID = '12';
const MYSCHEME_API_KEY = 'tYTy5eEhlu9rFjyxuCr7ra7ACp4dv1RH8gWuHTDc';
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const INDIA_SCHEMES_SEARCH_PAGE_URL =
  'https://www.india.gov.in/my-government/schemes/search?schemeCategory=12&schemeCategoryName=Agriculture%2C+Rural+%26+Environment&pagenumber=1';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const DEFAULTS = {
  startPage: 1,
  endPage: 83,
  pageSize: 10,
  detailConcurrency: 6,
  language: 'en',
  maxSchemes: null,
  outFile: path.join(repoRoot, 'data/schemes/agriculture_schemes_catalog.json'),
  reportFile: path.join(repoRoot, 'data/schemes/agriculture_schemes_scrape_report.json'),
};

function parseArgs(argv) {
  const args = { ...DEFAULTS };

  argv.forEach((arg) => {
    if (!arg.startsWith('--')) return;

    const [rawKey, rawValue = ''] = arg.slice(2).split('=');
    const key = rawKey.trim();
    const value = rawValue.trim();

    if (key === 'start-page') args.startPage = Number(value);
    if (key === 'end-page') args.endPage = Number(value);
    if (key === 'page-size') args.pageSize = Number(value);
    if (key === 'detail-concurrency') args.detailConcurrency = Number(value);
    if (key === 'language' && value) args.language = value;
    if (key === 'max-schemes') args.maxSchemes = Number(value);
    if (key === 'out' && value) args.outFile = path.resolve(repoRoot, value);
    if (key === 'report' && value) args.reportFile = path.resolve(repoRoot, value);
  });

  if (!Number.isInteger(args.startPage) || args.startPage <= 0) {
    throw new Error('Invalid --start-page value. Must be a positive integer.');
  }

  if (!Number.isInteger(args.endPage) || args.endPage < args.startPage) {
    throw new Error('Invalid --end-page value. Must be >= start-page.');
  }

  if (!Number.isInteger(args.pageSize) || args.pageSize <= 0) {
    throw new Error('Invalid --page-size value. Must be a positive integer.');
  }

  if (!Number.isInteger(args.detailConcurrency) || args.detailConcurrency <= 0) {
    throw new Error('Invalid --detail-concurrency value. Must be a positive integer.');
  }

  if (args.maxSchemes !== null && (!Number.isInteger(args.maxSchemes) || args.maxSchemes <= 0)) {
    throw new Error('Invalid --max-schemes value. Must be a positive integer.');
  }

  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}, retries = 3) {
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const response = await fetch(url, options);
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} | ${responseText.slice(0, 180)}`);
      }

      if (!responseText) {
        throw new Error('Received empty response body');
      }

      return JSON.parse(responseText);
    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }

      const backoffMs = 700 * Math.pow(2, attempt);
      await sleep(backoffMs);
      attempt += 1;
    }
  }

  throw new Error('Unexpected fetch retry failure');
}

function cleanString(value) {
  if (typeof value !== 'string') return null;

  const trimmed = value
    .replace(/\u00a0/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/\r/g, '')
    .trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOption(value) {
  if (!value) return null;

  if (typeof value === 'string' || typeof value === 'number') {
    const label = cleanString(String(value));
    return label ? { value: null, label } : null;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value;
    const label = cleanString(typeof obj.label === 'string' ? obj.label : String(obj.label ?? ''));
    const optionValue = obj.value ?? null;

    if (!label && optionValue === null) return null;

    return {
      value: optionValue,
      label: label || (optionValue !== null ? String(optionValue) : ''),
    };
  }

  return null;
}

function normalizeOptionList(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => normalizeOption(entry))
    .filter((entry) => Boolean(entry));
}

function uniqueStrings(values) {
  const output = [];
  const seen = new Set();

  for (const value of values) {
    const normalized = cleanString(String(value || ''));
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    output.push(normalized);
  }

  return output;
}

function extractRichTextText(value) {
  const chunks = [];

  function visit(node) {
    if (!node) return;

    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (typeof node === 'string') {
      const cleaned = cleanString(node);
      if (cleaned) chunks.push(cleaned);
      return;
    }

    if (typeof node !== 'object') return;

    if (typeof node.text === 'string') {
      const cleaned = cleanString(node.text);
      if (cleaned) chunks.push(cleaned);
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(visit);
    }

    if (Array.isArray(node.process)) {
      node.process.forEach(visit);
    }

    if (Array.isArray(node.answer)) {
      node.answer.forEach(visit);
    }
  }

  visit(value);

  return cleanString(chunks.join(' ').replace(/\s+/g, ' '));
}

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

async function fetchListingPage({ pageNumber, pageSize }) {
  const payload = {
    categories: [{ fieldName: 'npiCategoryList.id', fieldValue: CATEGORY_ID }],
    mustFilter: [],
    pageNumber,
    pageSize,
  };

  const response = await fetchJson(INDIA_SCHEME_SEARCH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      Origin: 'https://www.india.gov.in',
      Referer: INDIA_SCHEMES_SEARCH_PAGE_URL,
      'User-Agent': BROWSER_USER_AGENT,
    },
    body: JSON.stringify(payload),
  });

  const schemesResponse = safeObject(response.schemesResponse);
  const results = Array.isArray(schemesResponse.results) ? schemesResponse.results : [];

  return {
    total: Number(schemesResponse.total || 0),
    results,
  };
}

async function fetchSchemeBundle(slug, language) {
  const detailUrl = `${MYSCHEME_API_BASE}?slug=${encodeURIComponent(slug)}&lang=${encodeURIComponent(language)}`;

  const detailResponse = await fetchJson(detailUrl, {
    headers: {
      Accept: 'application/json',
      'User-Agent': BROWSER_USER_AGENT,
      'x-api-key': MYSCHEME_API_KEY,
    },
  });

  const statusCode = Number(detailResponse.statusCode || 0);
  const detailData = detailResponse?.data;

  if (statusCode !== 200 || !detailData || typeof detailData !== 'object') {
    throw new Error(`Detail API returned statusCode=${statusCode}`);
  }

  const schemeDocId = cleanString(String(detailData._id || ''));

  if (!schemeDocId) {
    return {
      detailResponse,
      documentsResponse: null,
      faqsResponse: null,
      applicationChannelsResponse: null,
      errors: ['Missing scheme ID in detail response'],
    };
  }

  const docUrl = `${MYSCHEME_API_BASE}/${schemeDocId}/documents?lang=${encodeURIComponent(language)}`;
  const faqUrl = `${MYSCHEME_API_BASE}/${schemeDocId}/faqs?lang=${encodeURIComponent(language)}`;
  const applicationUrl = `${MYSCHEME_API_BASE}/${schemeDocId}/applicationchannel`;

  const [documentsResult, faqsResult, channelsResult] = await Promise.all([
    fetchJson(docUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': BROWSER_USER_AGENT,
        'x-api-key': MYSCHEME_API_KEY,
      },
    }).catch((error) => ({ __error: error instanceof Error ? error.message : String(error) })),
    fetchJson(faqUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': BROWSER_USER_AGENT,
        'x-api-key': MYSCHEME_API_KEY,
      },
    }).catch((error) => ({ __error: error instanceof Error ? error.message : String(error) })),
    fetchJson(applicationUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': BROWSER_USER_AGENT,
        'x-api-key': MYSCHEME_API_KEY,
      },
    }).catch((error) => ({ __error: error instanceof Error ? error.message : String(error) })),
  ]);

  const errors = [];

  if (documentsResult && documentsResult.__error) {
    errors.push(`documents: ${documentsResult.__error}`);
  }

  if (faqsResult && faqsResult.__error) {
    errors.push(`faqs: ${faqsResult.__error}`);
  }

  if (channelsResult && channelsResult.__error) {
    errors.push(`applicationchannel: ${channelsResult.__error}`);
  }

  return {
    detailResponse,
    documentsResponse: documentsResult && !documentsResult.__error ? documentsResult : null,
    faqsResponse: faqsResult && !faqsResult.__error ? faqsResult : null,
    applicationChannelsResponse: channelsResult && !channelsResult.__error ? channelsResult : null,
    errors,
  };
}

function normalizeFaqs(faqEntries) {
  if (!Array.isArray(faqEntries)) return [];

  return faqEntries
    .map((faq) => {
      const question = cleanString(String(faq?.question || ''));
      const answerMarkdown = cleanString(String(faq?.answer_md || ''));
      const answerText = extractRichTextText(faq?.answer);

      if (!question && !answerMarkdown && !answerText) return null;

      return {
        question,
        answerMarkdown,
        answerText,
        answerRichText: Array.isArray(faq?.answer) ? faq.answer : [],
      };
    })
    .filter(Boolean);
}

function normalizeProcessItems(applicationProcess) {
  if (!Array.isArray(applicationProcess)) return [];

  return applicationProcess
    .map((entry) => {
      const mode = cleanString(String(entry?.mode || '')) || 'Unknown';
      const processMarkdown = cleanString(String(entry?.process_md || ''));
      const processText = extractRichTextText(entry?.process);

      if (!processMarkdown && !processText) return null;

      return {
        mode,
        processMarkdown,
        processText,
        processRichText: Array.isArray(entry?.process) ? entry.process : [],
      };
    })
    .filter(Boolean);
}

function normalizeApplicationChannels(channelsPayload) {
  const channels = channelsPayload?.data?.applicationChannel;
  if (!Array.isArray(channels)) return [];

  return channels
    .map((channel) => {
      if (!channel || typeof channel !== 'object') return null;

      const applicationName = cleanString(String(channel.applicationName || ''));
      const applicationUrl = cleanString(String(channel.applicationUrl || ''));

      const output = {
        applicationName,
        applicationUrl,
      };

      Object.keys(channel).forEach((key) => {
        if (key === 'applicationName' || key === 'applicationUrl') return;
        output[key] = channel[key];
      });

      return output;
    })
    .filter((entry) => entry && (entry.applicationName || entry.applicationUrl));
}

function normalizeReferences(references) {
  if (!Array.isArray(references)) return [];

  return references
    .map((reference) => {
      const title = cleanString(String(reference?.title || ''));
      const url = cleanString(String(reference?.url || ''));

      if (!title && !url) return null;

      return { title, url };
    })
    .filter(Boolean);
}

function updateKeyFrequency(map, key) {
  if (!key) return;
  map[key] = (map[key] || 0) + 1;
}

function updateStructureProfile(profile, bundle, language) {
  const detailData = safeObject(bundle?.detailResponse?.data);

  Object.keys(detailData).forEach((key) => {
    if (key === '_id' || key === 'slug' || key === 'schemeAddedById') return;
    if (typeof detailData[key] === 'object') {
      updateKeyFrequency(profile.languages, key);
    }
  });

  const localized = safeObject(detailData[language] || detailData.en);

  Object.keys(localized).forEach((key) => updateKeyFrequency(profile.localizedKeys, key));

  const basicDetails = safeObject(localized.basicDetails);
  Object.keys(basicDetails).forEach((key) => updateKeyFrequency(profile.basicDetailKeys, key));

  const schemeContent = safeObject(localized.schemeContent);
  Object.keys(schemeContent).forEach((key) => updateKeyFrequency(profile.schemeContentKeys, key));

  const eligibility = safeObject(localized.eligibilityCriteria);
  Object.keys(eligibility).forEach((key) => updateKeyFrequency(profile.eligibilityKeys, key));

  const documentsLocalized = safeObject(bundle?.documentsResponse?.data?.[language] || bundle?.documentsResponse?.data?.en);
  Object.keys(documentsLocalized).forEach((key) => updateKeyFrequency(profile.documentsKeys, key));

  const faqEntries = bundle?.faqsResponse?.data?.[language]?.faqs || bundle?.faqsResponse?.data?.en?.faqs;
  if (Array.isArray(faqEntries) && faqEntries.length > 0) {
    updateKeyFrequency(profile.optionalSectionCoverage, 'faqs');
    faqEntries.forEach((faq) => {
      if (!faq || typeof faq !== 'object') return;
      Object.keys(faq).forEach((key) => updateKeyFrequency(profile.faqEntryKeys, key));
    });
  }

  const channels = bundle?.applicationChannelsResponse?.data?.applicationChannel;
  if (Array.isArray(channels) && channels.length > 0) {
    updateKeyFrequency(profile.optionalSectionCoverage, 'applicationChannel');
    channels.forEach((channel) => {
      if (!channel || typeof channel !== 'object') return;
      Object.keys(channel).forEach((key) => updateKeyFrequency(profile.applicationChannelKeys, key));
    });
  }

  const processItems = localized?.applicationProcess;
  if (Array.isArray(processItems) && processItems.length > 0) {
    updateKeyFrequency(profile.optionalSectionCoverage, 'applicationProcess');
    processItems.forEach((processItem) => {
      const mode = cleanString(String(processItem?.mode || 'Unknown')) || 'Unknown';
      updateKeyFrequency(profile.applicationModes, mode);
    });
  }
}

function normalizeSchemeRecord({
  listingEntry,
  bundle,
  language,
  runId,
  fetchedAt,
  sourcePageUrl,
}) {
  const detailPayload = safeObject(bundle?.detailResponse?.data);

  const availableLanguages = Object.keys(detailPayload).filter((key) => {
    if (['_id', 'slug', 'schemeAddedById'].includes(key)) return false;
    return detailPayload[key] && typeof detailPayload[key] === 'object';
  });

  const localized = safeObject(detailPayload[language] || detailPayload.en);
  const basicDetails = safeObject(localized.basicDetails);
  const schemeContent = safeObject(localized.schemeContent);
  const eligibilityCriteria = safeObject(localized.eligibilityCriteria);

  const documentsLocalized = safeObject(bundle?.documentsResponse?.data?.[language] || bundle?.documentsResponse?.data?.en);
  const faqLocalized = safeObject(bundle?.faqsResponse?.data?.[language] || bundle?.faqsResponse?.data?.en);

  const title =
    cleanString(String(basicDetails.schemeName || '')) ||
    cleanString(String(listingEntry.title || '')) ||
    cleanString(String(detailPayload.slug || '')) ||
    'Untitled Scheme';

  const categoriesFromDetail = normalizeOptionList(basicDetails.schemeCategory).map((entry) => entry.label).filter(Boolean);
  const categoriesFromListing = Array.isArray(listingEntry.schemeCategory)
    ? listingEntry.schemeCategory.map((value) => cleanString(String(value || ''))).filter(Boolean)
    : [];

  const subCategories = normalizeOptionList(basicDetails.schemeSubCategory).map((entry) => entry.label).filter(Boolean);

  const tags = uniqueStrings([
    ...(Array.isArray(basicDetails.tags) ? basicDetails.tags : []),
    ...(Array.isArray(listingEntry.tags) ? listingEntry.tags : []),
  ]);

  const targetBeneficiaries = normalizeOptionList(basicDetails.targetBeneficiaries).map((entry) => entry.label).filter(Boolean);

  const references = normalizeReferences(schemeContent.references);
  const applicationProcess = normalizeProcessItems(localized.applicationProcess);
  const faqs = normalizeFaqs(faqLocalized.faqs);
  const applicationChannels = normalizeApplicationChannels(bundle?.applicationChannelsResponse);

  const detailedDescriptionMarkdown = cleanString(String(schemeContent.detailedDescription_md || ''));
  const detailedDescriptionText =
    extractRichTextText(schemeContent.detailedDescription) || cleanString(String(schemeContent.detailedDescription_md || ''));

  const benefitsMarkdown = cleanString(String(schemeContent.benefits_md || ''));
  const benefitsText =
    extractRichTextText(schemeContent.benefits) || cleanString(String(schemeContent.benefits_md || ''));

  const eligibilityMarkdown = cleanString(String(eligibilityCriteria.eligibilityDescription_md || ''));
  const eligibilityText =
    extractRichTextText(eligibilityCriteria.eligibilityDescription) || cleanString(String(eligibilityCriteria.eligibilityDescription_md || ''));

  const documentsMarkdown = cleanString(String(documentsLocalized.documentsRequired_md || ''));
  const documentsText =
    extractRichTextText(documentsLocalized.documents_required) ||
    cleanString(String(documentsLocalized.documentsRequired_md || ''));

  const briefDescription =
    cleanString(String(schemeContent.briefDescription || '')) ||
    cleanString(String(listingEntry.description || ''));

  const schemeDocId = cleanString(String(detailPayload._id || '')) || `slug:${listingEntry.slug}`;
  const slug = cleanString(String(detailPayload.slug || listingEntry.slug || ''));

  const searchText = uniqueStrings([
    title,
    briefDescription,
    detailedDescriptionText,
    benefitsText,
    eligibilityText,
    documentsText,
    ...tags,
    ...categoriesFromDetail,
    ...categoriesFromListing,
    ...subCategories,
    ...targetBeneficiaries,
  ]).join(' | ');

  return {
    recordVersion: 1,
    schemeDocId,
    slug,
    title,
    shortTitle: cleanString(String(basicDetails.schemeShortTitle || '')),
    ministry: cleanString(String(listingEntry.ministry || '')),
    nodalDepartment: cleanString(String(safeObject(basicDetails.nodalDepartmentName).label || '')),
    level: normalizeOption(basicDetails.level),
    schemeFor: cleanString(String(basicDetails.schemeFor || '')),
    dbtScheme: typeof basicDetails.dbtScheme === 'boolean' ? basicDetails.dbtScheme : null,
    categories: uniqueStrings([...categoriesFromDetail, ...categoriesFromListing]),
    subCategories: uniqueStrings(subCategories),
    tags,
    targetBeneficiaries,
    state: normalizeOption(basicDetails.state),
    openDate: cleanString(String(basicDetails.schemeOpenDate || '')),
    closeDate: cleanString(String(basicDetails.schemeCloseDate || '')),
    listing: {
      title: cleanString(String(listingEntry.title || '')),
      description: cleanString(String(listingEntry.description || '')),
      beneficiaryState: cleanString(String(listingEntry.beneficiaryState || '')),
      schemeCategory: categoriesFromListing,
      tags: uniqueStrings(Array.isArray(listingEntry.tags) ? listingEntry.tags : []),
      pageNumber: listingEntry.pageNumber,
      positionOnPage: listingEntry.positionOnPage,
      searchUrl: sourcePageUrl.replace('pagenumber=1', `pagenumber=${listingEntry.pageNumber}`),
    },
    content: {
      briefDescription,
      detailedDescriptionMarkdown,
      detailedDescriptionText,
      detailedDescriptionRichText: Array.isArray(schemeContent.detailedDescription)
        ? schemeContent.detailedDescription
        : [],
      exclusionsMarkdown: cleanString(String(schemeContent.exclusions_md || '')),
      exclusionsText:
        extractRichTextText(schemeContent.exclusions) ||
        cleanString(String(schemeContent.exclusions_md || '')),
      benefitsMarkdown,
      benefitsText,
      benefitsRichText: Array.isArray(schemeContent.benefits) ? schemeContent.benefits : [],
      benefitType: normalizeOption(schemeContent.benefitTypes),
      references,
      schemeImageUrl: cleanString(String(schemeContent.schemeImageUrl || '')),
    },
    eligibility: {
      markdown: eligibilityMarkdown,
      text: eligibilityText,
      richText: Array.isArray(eligibilityCriteria.eligibilityDescription)
        ? eligibilityCriteria.eligibilityDescription
        : [],
    },
    documents: {
      markdown: documentsMarkdown,
      text: documentsText,
      richText: Array.isArray(documentsLocalized.documents_required)
        ? documentsLocalized.documents_required
        : [],
    },
    applicationProcess,
    faqs,
    applicationChannels,
    availableLanguages,
    searchText,
    source: {
      listingSource: 'https://www.india.gov.in/my-government/schemes/search?schemeCategory=12&schemeCategoryName=Agriculture%2C+Rural+%26+Environment&pagenumber=1',
      mySchemePage: slug ? `https://www.myscheme.gov.in/schemes/${slug}` : null,
      detailApi: slug ? `${MYSCHEME_API_BASE}?slug=${slug}&lang=${language}` : null,
      documentsApi: schemeDocId ? `${MYSCHEME_API_BASE}/${schemeDocId}/documents?lang=${language}` : null,
      faqApi: schemeDocId ? `${MYSCHEME_API_BASE}/${schemeDocId}/faqs?lang=${language}` : null,
      applicationChannelApi: schemeDocId ? `${MYSCHEME_API_BASE}/${schemeDocId}/applicationchannel` : null,
      scrapedAt: fetchedAt,
      scrapeRunId: runId,
    },
    integrity: {
      hasDetail: Boolean(bundle?.detailResponse?.data),
      hasDocuments: Boolean(bundle?.documentsResponse?.data),
      hasFaqs: Boolean(Array.isArray(faqs) && faqs.length > 0),
      hasApplicationChannels: Boolean(Array.isArray(applicationChannels) && applicationChannels.length > 0),
      errors: bundle?.errors || [],
    },
    raw: {
      listing: listingEntry,
      detailResponse: bundle?.detailResponse || null,
      documentsResponse: bundle?.documentsResponse || null,
      faqsResponse: bundle?.faqsResponse || null,
      applicationChannelsResponse: bundle?.applicationChannelsResponse || null,
    },
  };
}

async function runWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;

      if (current >= items.length) return;

      results[current] = await worker(items[current], current);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker());
  await Promise.all(workers);

  return results;
}

async function ensureDirectoryForFile(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const runStartedAtMs = Date.now();
  const runStartedAtIso = new Date(runStartedAtMs).toISOString();
  const runId = `agriculture_schemes_${runStartedAtMs}`;

  const listingPages = [];
  const listingFailures = [];

  console.log(`Scrape run: ${runId}`);
  console.log(`Fetching listing pages ${args.startPage}..${args.endPage} (page size ${args.pageSize})`);

  for (let page = args.startPage; page <= args.endPage; page += 1) {
    try {
      const pagePayload = await fetchListingPage({ pageNumber: page, pageSize: args.pageSize });
      listingPages.push({ pageNumber: page, ...pagePayload });

      console.log(`Listing page ${page}/${args.endPage} fetched (${pagePayload.results.length} records)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      listingFailures.push({ pageNumber: page, error: message });
      console.error(`Listing page ${page} failed: ${message}`);
    }

    await sleep(80);
  }

  const listingBySlug = new Map();

  listingPages.forEach((page) => {
    page.results.forEach((entry, index) => {
      const slug = cleanString(String(entry?.slug || ''));
      if (!slug) return;

      if (!listingBySlug.has(slug)) {
        listingBySlug.set(slug, {
          ...entry,
          slug,
          pageNumber: page.pageNumber,
          positionOnPage: index + 1,
        });
      }
    });
  });

  let slugs = Array.from(listingBySlug.keys()).sort((a, b) => a.localeCompare(b));

  if (args.maxSchemes !== null) {
    slugs = slugs.slice(0, args.maxSchemes);
    console.log(`Applying max scheme limit: ${args.maxSchemes}`);
  }

  console.log(`Unique scheme slugs discovered: ${slugs.length}`);

  const structureProfile = {
    languages: {},
    localizedKeys: {},
    basicDetailKeys: {},
    schemeContentKeys: {},
    eligibilityKeys: {},
    documentsKeys: {},
    faqEntryKeys: {},
    applicationChannelKeys: {},
    applicationModes: {},
    optionalSectionCoverage: {},
  };

  let detailSuccess = 0;
  let detailFailure = 0;
  const detailFailures = [];

  const records = await runWithConcurrency(slugs, args.detailConcurrency, async (slug, index) => {
    const listingEntry = listingBySlug.get(slug);

    try {
      const bundle = await fetchSchemeBundle(slug, args.language);
      updateStructureProfile(structureProfile, bundle, args.language);

      const record = normalizeSchemeRecord({
        listingEntry,
        bundle,
        language: args.language,
        runId,
        fetchedAt: new Date().toISOString(),
        sourcePageUrl:
          'https://www.india.gov.in/my-government/schemes/search?schemeCategory=12&schemeCategoryName=Agriculture%2C+Rural+%26+Environment&pagenumber=1',
      });

      detailSuccess += 1;
      if ((index + 1) % 25 === 0 || index + 1 === slugs.length) {
        console.log(`Fetched details for ${index + 1}/${slugs.length} schemes`);
      }

      return record;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      detailFailure += 1;
      detailFailures.push({ slug, error: message });
      console.error(`Failed detail fetch for slug=${slug}: ${message}`);

      return {
        recordVersion: 1,
        schemeDocId: `slug:${slug}`,
        slug,
        title: cleanString(String(listingEntry?.title || slug)) || slug,
        shortTitle: null,
        ministry: cleanString(String(listingEntry?.ministry || '')),
        nodalDepartment: null,
        level: null,
        schemeFor: null,
        dbtScheme: null,
        categories: Array.isArray(listingEntry?.schemeCategory)
          ? listingEntry.schemeCategory.map((value) => cleanString(String(value || ''))).filter(Boolean)
          : [],
        subCategories: [],
        tags: uniqueStrings(Array.isArray(listingEntry?.tags) ? listingEntry.tags : []),
        targetBeneficiaries: [],
        state: null,
        openDate: null,
        closeDate: null,
        listing: {
          title: cleanString(String(listingEntry?.title || '')),
          description: cleanString(String(listingEntry?.description || '')),
          beneficiaryState: cleanString(String(listingEntry?.beneficiaryState || '')),
          schemeCategory: Array.isArray(listingEntry?.schemeCategory)
            ? listingEntry.schemeCategory.map((value) => cleanString(String(value || ''))).filter(Boolean)
            : [],
          tags: uniqueStrings(Array.isArray(listingEntry?.tags) ? listingEntry.tags : []),
          pageNumber: listingEntry?.pageNumber || null,
          positionOnPage: listingEntry?.positionOnPage || null,
        searchUrl: `https://www.india.gov.in/my-government/schemes/search?schemeCategory=12&schemeCategoryName=Agriculture%2C+Rural+%26+Environment&pagenumber=${listingEntry?.pageNumber || 1}`,
        },
        content: {
          briefDescription: cleanString(String(listingEntry?.description || '')),
          detailedDescriptionMarkdown: null,
          detailedDescriptionText: null,
          detailedDescriptionRichText: [],
          exclusionsMarkdown: null,
          exclusionsText: null,
          benefitsMarkdown: null,
          benefitsText: null,
          benefitsRichText: [],
          benefitType: null,
          references: [],
          schemeImageUrl: null,
        },
        eligibility: {
          markdown: null,
          text: null,
          richText: [],
        },
        documents: {
          markdown: null,
          text: null,
          richText: [],
        },
        applicationProcess: [],
        faqs: [],
        applicationChannels: [],
        availableLanguages: [],
        searchText: cleanString(String(listingEntry?.title || slug)) || slug,
        source: {
          listingSource:
            'https://www.india.gov.in/my-government/schemes/search?schemeCategory=12&schemeCategoryName=Agriculture%2C+Rural+%26+Environment&pagenumber=1',
          mySchemePage: `https://www.myscheme.gov.in/schemes/${slug}`,
          detailApi: `${MYSCHEME_API_BASE}?slug=${slug}&lang=${args.language}`,
          documentsApi: null,
          faqApi: null,
          applicationChannelApi: null,
          scrapedAt: new Date().toISOString(),
          scrapeRunId: runId,
        },
        integrity: {
          hasDetail: false,
          hasDocuments: false,
          hasFaqs: false,
          hasApplicationChannels: false,
          errors: [message],
        },
        raw: {
          listing: listingEntry,
          detailResponse: null,
          documentsResponse: null,
          faqsResponse: null,
          applicationChannelsResponse: null,
        },
      };
    }
  });

  const sortedRecords = records.sort((a, b) => a.title.localeCompare(b.title));

  await ensureDirectoryForFile(args.outFile);
  await ensureDirectoryForFile(args.reportFile);

  const runFinishedAtMs = Date.now();
  const runFinishedAtIso = new Date(runFinishedAtMs).toISOString();

  const report = {
    runId,
    startedAt: runStartedAtIso,
    finishedAt: runFinishedAtIso,
    durationMs: runFinishedAtMs - runStartedAtMs,
    params: {
      startPage: args.startPage,
      endPage: args.endPage,
      pageSize: args.pageSize,
      detailConcurrency: args.detailConcurrency,
      language: args.language,
      maxSchemes: args.maxSchemes,
    },
    counts: {
      listingPagesAttempted: args.endPage - args.startPage + 1,
      listingPagesSucceeded: listingPages.length,
      listingPagesFailed: listingFailures.length,
      listingRecordsCollected: listingPages.reduce((sum, page) => sum + page.results.length, 0),
      uniqueSlugs: Array.from(listingBySlug.keys()).length,
      schemesProcessed: sortedRecords.length,
      detailSuccess,
      detailFailure,
      recordsWithFaqs: sortedRecords.filter((record) => record.faqs.length > 0).length,
      recordsWithDocuments: sortedRecords.filter((record) => Boolean(record.documents.text || record.documents.markdown)).length,
      recordsWithApplicationChannels: sortedRecords.filter((record) => record.applicationChannels.length > 0).length,
      recordsWithEligibility: sortedRecords.filter((record) => Boolean(record.eligibility.text || record.eligibility.markdown)).length,
      recordsWithApplicationProcess: sortedRecords.filter((record) => record.applicationProcess.length > 0).length,
    },
    listingFailures,
    detailFailures,
    structureProfile,
  };

  await fs.writeFile(args.outFile, JSON.stringify(sortedRecords, null, 2), 'utf8');
  await fs.writeFile(args.reportFile, JSON.stringify(report, null, 2), 'utf8');

  console.log('---');
  console.log(`Catalog written to: ${args.outFile}`);
  console.log(`Report written to: ${args.reportFile}`);
  console.log(`Processed ${sortedRecords.length} schemes (${detailFailure} with detail fetch failures).`);
}

main().catch((error) => {
  console.error('Agriculture scheme scrape failed:', error);
  process.exit(1);
});
