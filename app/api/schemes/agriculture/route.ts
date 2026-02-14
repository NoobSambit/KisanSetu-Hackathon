import { NextRequest, NextResponse } from 'next/server';
import { AgricultureSchemeCatalogRecord, AgricultureSchemesApiResponse } from '@/types';
import { getAgricultureSchemeCatalog } from '@/lib/services/agricultureSchemeCatalogService';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 15;
const MAX_PAGE_SIZE = 50;

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid numeric query value: ${value}`);
  }

  return parsed;
}

function normalizeFilter(value: string | null): string {
  return (value || '').trim();
}

function includesValue(haystack: string | null | undefined, needleLower: string): boolean {
  if (!haystack) return false;
  return haystack.toLowerCase().includes(needleLower);
}

function matchesSchemeQuery(record: AgricultureSchemeCatalogRecord, queryLower: string): boolean {
  if (!queryLower) return true;

  return (
    includesValue(record.title, queryLower) ||
    includesValue(record.shortTitle, queryLower) ||
    includesValue(record.searchText, queryLower) ||
    includesValue(record.ministry, queryLower) ||
    includesValue(record.nodalDepartment, queryLower)
  );
}

function stripRaw(record: AgricultureSchemeCatalogRecord): AgricultureSchemeCatalogRecord {
  if (!record.raw) return record;

  const { raw: _raw, ...rest } = record;
  return rest;
}

function normalizeSourcePreference(value: string | null): 'auto' | 'firestore' | 'local' {
  if (!value) return 'local';

  if (value === 'auto' || value === 'firestore' || value === 'local') {
    return value;
  }

  throw new Error("Invalid 'source' query value. Use 'auto', 'firestore', or 'local'.");
}

function normalizeIncludeRaw(value: string | null): boolean {
  if (!value) return false;
  return value === '1' || value.toLowerCase() === 'true';
}

function collectFacets(records: AgricultureSchemeCatalogRecord[]) {
  const states = Array.from(
    new Set(
      records
        .map((record) => record.state?.label || record.listing.beneficiaryState)
        .filter((value): value is string => Boolean(value && value.trim()))
        .map((value) => value.trim())
    )
  ).sort((a, b) => a.localeCompare(b));

  const categories = Array.from(
    new Set(records.flatMap((record) => record.categories.filter((value) => Boolean(value && value.trim()))))
  ).sort((a, b) => a.localeCompare(b));

  const ministries = Array.from(
    new Set(records.map((record) => record.ministry).filter((value): value is string => Boolean(value && value.trim())))
  ).sort((a, b) => a.localeCompare(b));

  return {
    states,
    categories,
    ministries,
  };
}

export async function GET(request: NextRequest) {
  try {
    const page = parsePositiveInt(request.nextUrl.searchParams.get('page'), DEFAULT_PAGE);
    const pageSize = Math.min(
      parsePositiveInt(request.nextUrl.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE
    );

    const query = normalizeFilter(request.nextUrl.searchParams.get('query'));
    const state = normalizeFilter(request.nextUrl.searchParams.get('state'));
    const category = normalizeFilter(request.nextUrl.searchParams.get('category'));
    const ministry = normalizeFilter(request.nextUrl.searchParams.get('ministry'));
    const includeRaw = normalizeIncludeRaw(request.nextUrl.searchParams.get('includeRaw'));
    const sourcePreference = normalizeSourcePreference(request.nextUrl.searchParams.get('source'));

    const catalog = await getAgricultureSchemeCatalog(sourcePreference);

    const queryLower = query.toLowerCase();
    const stateLower = state.toLowerCase();
    const categoryLower = category.toLowerCase();
    const ministryLower = ministry.toLowerCase();

    const filteredRecords = catalog.records.filter((record) => {
      if (!matchesSchemeQuery(record, queryLower)) return false;

      if (stateLower) {
        const stateValue = (record.state?.label || record.listing.beneficiaryState || '').toLowerCase();
        if (!stateValue.includes(stateLower)) return false;
      }

      if (categoryLower) {
        const categoryMatch = record.categories.some((recordCategory) =>
          recordCategory.toLowerCase().includes(categoryLower)
        );
        if (!categoryMatch) return false;
      }

      if (ministryLower) {
        const ministryValue = (record.ministry || '').toLowerCase();
        if (!ministryValue.includes(ministryLower)) return false;
      }

      return true;
    });

    const totalItems = filteredRecords.length;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);

    if (totalPages > 0 && page > totalPages) {
      return NextResponse.json<AgricultureSchemesApiResponse>(
        {
          success: false,
          error: `Requested page ${page} exceeds available pages ${totalPages}.`,
        },
        { status: 400 }
      );
    }

    const pageStart = (page - 1) * pageSize;
    const pageItems = filteredRecords
      .slice(pageStart, pageStart + pageSize)
      .map((record) => (includeRaw ? record : stripRaw(record)));

    return NextResponse.json<AgricultureSchemesApiResponse>(
      {
        success: true,
        data: {
          items: pageItems,
          pagination: {
            page,
            pageSize,
            totalItems,
            totalPages,
            hasNextPage: totalPages > 0 && page < totalPages,
            hasPreviousPage: totalPages > 0 && page > 1,
          },
          facets: collectFacets(catalog.records),
          filtersApplied: {
            query,
            state,
            category,
            ministry,
            includeRaw,
            sourcePreference,
          },
          source: catalog.source,
          warning: catalog.warning,
        },
        error: null,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch agriculture scheme catalog';

    const isValidationError =
      message.startsWith('Invalid') ||
      message.includes("Requested page") ||
      message.includes("Invalid 'source'");

    return NextResponse.json<AgricultureSchemesApiResponse>(
      {
        success: false,
        error: message,
      },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
