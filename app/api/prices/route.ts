import { NextRequest, NextResponse } from 'next/server';
import {
  getMarketSeriesById,
  getMarketTaxonomy,
  listMarketCards,
  MARKET_TAXONOMY_VERSION_ID,
} from '@/lib/firebase/market';
import type {
  MarketCardsResponse,
  MarketFiltersResponse,
  MarketGranularity,
  MarketSeriesResponse,
} from '@/types';

const SUPPORTED_GRANULARITIES: MarketGranularity[] = ['d', 'm', 'y'];

function parseOptionalInt(value: string | null): number | undefined {
  if (value === null || value.trim().length === 0) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

function parseGranularity(value: string | null, fallback: MarketGranularity = 'm'): MarketGranularity | null {
  if (!value) return fallback;
  if (value === 'd' || value === 'm' || value === 'y') return value;
  return null;
}

function parseYear(value: string | null): number | null {
  if (!value) return 2025;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  if (parsed !== 2025) return null;
  return parsed;
}

function buildEmptySeriesResponse(
  year: number,
  granularity: MarketGranularity
): MarketSeriesResponse['data'] {
  return {
    year,
    granularity,
    empty: true,
    series: null,
    summary: {
      latestPointLabel: null,
      latestModalPrice: null,
      latestQuantity: null,
      pricePointCount: 0,
      quantityPointCount: 0,
      level: null,
    },
    freshness: {
      lastUpdated: null,
      source: 'https://agmarknet.ceda.ashoka.edu.in',
      taxonomyVersion: MARKET_TAXONOMY_VERSION_ID,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing action query parameter. Supported actions: filters, cards, series',
        },
        { status: 400 }
      );
    }

    if (action === 'filters') {
      const taxonomy = await getMarketTaxonomy(MARKET_TAXONOMY_VERSION_ID);
      if (!taxonomy) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Market taxonomy is not available. Run ingestion first: node scripts/ingest_agmarknet_2025.mjs --year=2025',
          } satisfies MarketFiltersResponse,
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          year: 2025,
          taxonomyVersion: taxonomy.versionId,
          source: taxonomy.source,
          fetchedAt: taxonomy.fetchedAt,
          categories: taxonomy.categories,
          commodities: taxonomy.commodities,
          states: taxonomy.states,
          districtsByState: taxonomy.districtsByState,
          counts: taxonomy.counts,
        },
        error: null,
      } satisfies MarketFiltersResponse);
    }

    if (action === 'cards') {
      const year = parseYear(searchParams.get('year'));
      if (year === null) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid year. Only 2025 is supported in this ingestion.',
          } satisfies MarketCardsResponse,
          { status: 400 }
        );
      }

      const granularity = parseGranularity(searchParams.get('granularity'), 'm');
      if (!granularity) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid granularity. Use one of: ${SUPPORTED_GRANULARITIES.join(', ')}`,
          } satisfies MarketCardsResponse,
          { status: 400 }
        );
      }

      const page = Math.max(1, Number(searchParams.get('page') || 1));
      const pageLimit = Number(searchParams.get('limit') || 24);
      const limit = Math.max(1, Math.min(60, Number.isFinite(pageLimit) ? pageLimit : 24));

      const categoryId = parseOptionalInt(searchParams.get('categoryId'));
      const commodityId = parseOptionalInt(searchParams.get('commodityId'));
      const stateId = parseOptionalInt(searchParams.get('stateId'));
      const districtId = parseOptionalInt(searchParams.get('districtId'));

      const cardsResult = await listMarketCards({
        year,
        granularity,
        categoryId,
        commodityId,
        stateId,
        districtId,
        page,
        limit,
      });

      return NextResponse.json({
        success: true,
        data: {
          year,
          granularity,
          cards: cardsResult.cards,
          pagination: cardsResult.pagination,
          filtersApplied: {
            ...(categoryId !== undefined ? { categoryId } : {}),
            ...(commodityId !== undefined ? { commodityId } : {}),
            ...(stateId !== undefined ? { stateId } : {}),
            ...(districtId !== undefined ? { districtId } : {}),
          },
          generatedAt: new Date().toISOString(),
        },
        error: null,
      } satisfies MarketCardsResponse);
    }

    if (action === 'series') {
      const year = parseYear(searchParams.get('year'));
      if (year === null) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid year. Only 2025 is supported in this ingestion.',
          } satisfies MarketSeriesResponse,
          { status: 400 }
        );
      }

      const granularity = parseGranularity(searchParams.get('granularity'), 'm');
      if (!granularity) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid granularity. Use one of: ${SUPPORTED_GRANULARITIES.join(', ')}`,
          } satisfies MarketSeriesResponse,
          { status: 400 }
        );
      }

      const commodityId = parseOptionalInt(searchParams.get('commodityId'));
      const stateId = parseOptionalInt(searchParams.get('stateId'));
      const districtId = parseOptionalInt(searchParams.get('districtId'));

      if (
        commodityId === undefined ||
        stateId === undefined ||
        districtId === undefined
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required ids. Provide commodityId, stateId, and districtId for action=series.',
          } satisfies MarketSeriesResponse,
          { status: 400 }
        );
      }

      const seriesId = `y${year}_${granularity}_${stateId}_${districtId}_${commodityId}`;
      const series = await getMarketSeriesById(seriesId);

      if (!series) {
        return NextResponse.json({
          success: true,
          data: buildEmptySeriesResponse(year, granularity),
          error: null,
        } satisfies MarketSeriesResponse);
      }

      const latestPrice = series.pricePoints[series.pricePoints.length - 1] || null;
      const latestQty = series.quantityPoints[series.quantityPoints.length - 1] || null;

      return NextResponse.json({
        success: true,
        data: {
          year,
          granularity,
          empty: false,
          series,
          summary: {
            latestPointLabel: latestPrice?.t || latestQty?.t || null,
            latestModalPrice: latestPrice?.p_modal ?? null,
            latestQuantity: latestQty?.qty ?? null,
            pricePointCount: series.pricePointCount,
            quantityPointCount: series.quantityPointCount,
            level: series.level,
          },
          freshness: {
            lastUpdated: series.lastUpdated,
            source: series.sourceMetadata.source,
            taxonomyVersion: MARKET_TAXONOMY_VERSION_ID,
          },
        },
        error: null,
      } satisfies MarketSeriesResponse);
    }

    return NextResponse.json(
      {
        success: false,
        error: `Unsupported action: ${action}. Supported actions: filters, cards, series`,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Prices API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to serve market prices data.',
      },
      { status: 500 }
    );
  }
}
