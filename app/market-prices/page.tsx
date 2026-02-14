'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Building2,
  CalendarRange,
  Loader2,
  MapPin,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { logPageView } from '@/lib/services/analyticsService';
import type {
  MarketCardItem,
  MarketCardsResponse,
  MarketFiltersResponse,
  MarketGranularity,
  MarketMetric,
  MarketSeriesDoc,
  MarketSeriesResponse,
} from '@/types';

interface SeriesChartPoint {
  label: string;
  value: number;
}

interface SeriesTableRow {
  label: string;
  pMin: number | null;
  pMax: number | null;
  pModal: number | null;
  qty: number | null;
}

const GRANULARITY_OPTIONS: { label: string; value: MarketGranularity }[] = [
  { label: 'Daily', value: 'd' },
  { label: 'Monthly', value: 'm' },
  { label: 'Yearly', value: 'y' },
];

function formatCurrency(value: number | null): string {
  if (value === null) return 'N/A';
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value)}`;
}

function formatQuantity(value: number | null): string {
  if (value === null) return 'N/A';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
}

function formatDelta(value: number | null, pct: number | null): string {
  if (value === null) return 'N/A';
  const sign = value > 0 ? '+' : '';
  const absValue = `${sign}${value.toFixed(2)}`;
  if (pct === null) return absValue;
  return `${absValue} (${sign}${pct.toFixed(2)}%)`;
}

function pickCardMetric(card: MarketCardItem, metric: MarketMetric) {
  if (metric === 'price') {
    return {
      value: card.latestModalPrice,
      unitLabel: '/quintal',
      deltaText: formatDelta(card.modalDeltaAbs, card.modalDeltaPct),
      isPositive: (card.modalDeltaAbs || 0) > 0,
      isNegative: (card.modalDeltaAbs || 0) < 0,
    };
  }

  return {
    value: card.latestQuantity,
    unitLabel: ' quintal',
    deltaText: formatDelta(card.quantityDeltaAbs, card.quantityDeltaPct),
    isPositive: (card.quantityDeltaAbs || 0) > 0,
    isNegative: (card.quantityDeltaAbs || 0) < 0,
  };
}

function buildSeriesChartPoints(series: MarketSeriesDoc | null, metric: MarketMetric): SeriesChartPoint[] {
  if (!series) return [];
  if (metric === 'price') {
    return series.pricePoints
      .filter((point) => point.p_modal !== null)
      .map((point) => ({ label: point.t, value: point.p_modal as number }));
  }
  return series.quantityPoints
    .filter((point) => point.qty !== null)
    .map((point) => ({ label: point.t, value: point.qty as number }));
}

function buildSeriesTable(series: MarketSeriesDoc | null): SeriesTableRow[] {
  if (!series) return [];

  const labels: string[] = [];
  const rowMap = new Map<string, SeriesTableRow>();

  for (const point of series.pricePoints) {
    if (!rowMap.has(point.t)) {
      labels.push(point.t);
      rowMap.set(point.t, {
        label: point.t,
        pMin: point.p_min,
        pMax: point.p_max,
        pModal: point.p_modal,
        qty: null,
      });
    } else {
      const existing = rowMap.get(point.t) as SeriesTableRow;
      existing.pMin = point.p_min;
      existing.pMax = point.p_max;
      existing.pModal = point.p_modal;
    }
  }

  for (const point of series.quantityPoints) {
    if (!rowMap.has(point.t)) {
      labels.push(point.t);
      rowMap.set(point.t, {
        label: point.t,
        pMin: null,
        pMax: null,
        pModal: null,
        qty: point.qty,
      });
    } else {
      const existing = rowMap.get(point.t) as SeriesTableRow;
      existing.qty = point.qty;
    }
  }

  return labels.map((label) => rowMap.get(label) as SeriesTableRow);
}

function SeriesLineChart({
  points,
  accentColor,
}: {
  points: SeriesChartPoint[];
  accentColor: string;
}) {
  if (points.length === 0) {
    return (
      <div className="h-64 rounded-2xl border border-emerald-900/40 bg-emerald-950/20 flex items-center justify-center text-emerald-200/60 text-sm">
        No series points available for this metric.
      </div>
    );
  }

  const width = 760;
  const height = 260;
  const paddingX = 42;
  const paddingY = 24;

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;

  const coordinates = points.map((point, index) => {
    const x = paddingX + (index / Math.max(points.length - 1, 1)) * plotWidth;
    const y = paddingY + ((max - point.value) / range) * plotHeight;
    return { x, y };
  });

  const pathData = coordinates
    .map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x} ${coord.y}`)
    .join(' ');

  const areaPath = `${pathData} L ${paddingX + plotWidth} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;

  return (
    <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/25 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-60" role="img" aria-label="Series trend chart">
        <defs>
          <linearGradient id="seriesAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <line
          x1={paddingX}
          y1={height - paddingY}
          x2={paddingX + plotWidth}
          y2={height - paddingY}
          stroke="#0f3f2f"
          strokeWidth="1"
        />
        <line x1={paddingX} y1={paddingY} x2={paddingX} y2={height - paddingY} stroke="#0f3f2f" strokeWidth="1" />

        <path d={areaPath} fill="url(#seriesAreaGradient)" />
        <path d={pathData} stroke={accentColor} strokeWidth="3" fill="none" strokeLinecap="round" />

        {coordinates.map((coord, index) => (
          <circle key={index} cx={coord.x} cy={coord.y} r="3.5" fill={accentColor} />
        ))}

        {coordinates.map((coord, index) => {
          if (
            index !== 0 &&
            index !== coordinates.length - 1 &&
            index !== Math.floor(coordinates.length / 2)
          ) {
            return null;
          }
          return (
            <text
              key={`x-label-${index}`}
              x={coord.x}
              y={height - 8}
              fontSize="11"
              textAnchor="middle"
              fill="#7fdcb9"
            >
              {points[index].label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function MarketPricesPage() {
  const { user } = useAuth();

  const [metric, setMetric] = useState<MarketMetric>('price');
  const [granularity, setGranularity] = useState<MarketGranularity>('m');

  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersError, setFiltersError] = useState<string | null>(null);
  const [filtersData, setFiltersData] = useState<MarketFiltersResponse['data'] | null>(null);

  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [commodityId, setCommodityId] = useState<number | undefined>(undefined);
  const [stateId, setStateId] = useState<number | undefined>(undefined);
  const [districtId, setDistrictId] = useState<number | undefined>(undefined);

  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [cards, setCards] = useState<MarketCardItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 16,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [selectedCard, setSelectedCard] = useState<MarketCardItem | null>(null);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [seriesError, setSeriesError] = useState<string | null>(null);
  const [seriesData, setSeriesData] = useState<MarketSeriesResponse['data'] | null>(null);

  useEffect(() => {
    logPageView('/market-prices', user?.uid);
  }, [user]);

  useEffect(() => {
    const loadFilters = async () => {
      setFiltersLoading(true);
      setFiltersError(null);
      try {
        const response = await fetch('/api/prices?action=filters');
        const data = (await response.json()) as MarketFiltersResponse;
        if (!response.ok || !data.success || !data.data) {
          throw new Error(data.error || 'Failed to load market filters.');
        }
        setFiltersData(data.data);
      } catch (error) {
        setFiltersError(error instanceof Error ? error.message : 'Failed to load filters');
      } finally {
        setFiltersLoading(false);
      }
    };
    void loadFilters();
  }, []);

  const commodityOptions = useMemo(() => {
    if (!filtersData) return [];
    if (categoryId === undefined) return filtersData.commodities;
    return filtersData.commodities.filter((commodity) => commodity.categoryId === categoryId);
  }, [filtersData, categoryId]);

  const districtOptions = useMemo(() => {
    if (!filtersData || stateId === undefined) return [];
    return (
      filtersData.districtsByState.find((entry) => entry.stateId === stateId)?.districts || []
    );
  }, [filtersData, stateId]);

  useEffect(() => {
    if (commodityId === undefined) return;
    const isValid = commodityOptions.some((commodity) => commodity.commodityId === commodityId);
    if (!isValid) {
      setCommodityId(undefined);
    }
  }, [commodityOptions, commodityId]);

  useEffect(() => {
    if (districtId === undefined) return;
    const isValid = districtOptions.some((district) => district.districtId === districtId);
    if (!isValid) {
      setDistrictId(undefined);
    }
  }, [districtOptions, districtId]);

  useEffect(() => {
    setPagination((previous) => ({ ...previous, page: 1 }));
  }, [categoryId, commodityId, stateId, districtId, granularity]);

  useEffect(() => {
    const loadCards = async () => {
      setCardsLoading(true);
      setCardsError(null);
      try {
        const params = new URLSearchParams({
          action: 'cards',
          year: '2025',
          granularity,
          page: String(pagination.page),
          limit: String(pagination.limit),
        });

        if (categoryId !== undefined) params.set('categoryId', String(categoryId));
        if (commodityId !== undefined) params.set('commodityId', String(commodityId));
        if (stateId !== undefined) params.set('stateId', String(stateId));
        if (districtId !== undefined) params.set('districtId', String(districtId));

        const response = await fetch(`/api/prices?${params.toString()}`);
        const data = (await response.json()) as MarketCardsResponse;
        if (!response.ok || !data.success || !data.data) {
          throw new Error(data.error || 'Failed to load market cards.');
        }

        setCards(data.data.cards);
        setPagination((previous) => ({
          ...previous,
          ...data.data!.pagination,
        }));
      } catch (error) {
        setCardsError(error instanceof Error ? error.message : 'Failed to load cards');
        setCards([]);
      } finally {
        setCardsLoading(false);
      }
    };

    if (!filtersData) return;
    void loadCards();
  }, [
    filtersData,
    granularity,
    categoryId,
    commodityId,
    stateId,
    districtId,
    pagination.page,
    pagination.limit,
  ]);

  useEffect(() => {
    const loadSeries = async () => {
      if (!selectedCard) return;
      setSeriesLoading(true);
      setSeriesError(null);
      try {
        const params = new URLSearchParams({
          action: 'series',
          year: '2025',
          granularity,
          commodityId: String(selectedCard.commodityId),
          stateId: String(selectedCard.stateId),
          districtId: String(selectedCard.districtId),
        });

        const response = await fetch(`/api/prices?${params.toString()}`);
        const data = (await response.json()) as MarketSeriesResponse;
        if (!response.ok || !data.success || !data.data) {
          throw new Error(data.error || 'Failed to load series data.');
        }
        setSeriesData(data.data);
      } catch (error) {
        setSeriesError(error instanceof Error ? error.message : 'Failed to load series');
        setSeriesData(null);
      } finally {
        setSeriesLoading(false);
      }
    };

    if (!selectedCard) {
      setSeriesData(null);
      setSeriesError(null);
      return;
    }
    void loadSeries();
  }, [selectedCard, granularity]);

  const chartPoints = useMemo(
    () => buildSeriesChartPoints(seriesData?.series || null, metric),
    [seriesData, metric]
  );
  const tableRows = useMemo(
    () => buildSeriesTable(seriesData?.series || null),
    [seriesData]
  );

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[radial-gradient(circle_at_20%_0%,#0a412e_0%,#02150f_40%,#010806_100%)] text-emerald-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <header className="rounded-3xl border border-emerald-900/50 bg-emerald-950/40 backdrop-blur-md p-5 md:p-7 mb-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-emerald-300 text-xs tracking-[0.22em] uppercase">Agri-Market Intelligence</p>
                <h1 className="text-2xl md:text-4xl font-bold mt-1">Market Prices Dashboard</h1>
                <p className="text-emerald-100/70 text-sm md:text-base mt-2">
                  Exhaustive Agmarknet 2025 data explorer across categories, commodities, states, and districts.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-800/80 bg-emerald-900/40 px-4 py-2 text-sm text-emerald-200">
                <CalendarRange className="h-4 w-4" />
                <span>01 Jan 2025 - 31 Dec 2025</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <select
                value={categoryId === undefined ? '' : String(categoryId)}
                onChange={(event) => {
                  const value = event.target.value;
                  setCategoryId(value === '' ? undefined : Number(value));
                }}
                disabled={filtersLoading || !filtersData}
                className="rounded-xl border border-emerald-800 bg-emerald-950/70 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">All Categories</option>
                {(filtersData?.categories || []).map((category) => (
                  <option key={String(category.categoryId)} value={String(category.categoryId)}>
                    {category.categoryName}
                  </option>
                ))}
              </select>

              <select
                value={commodityId === undefined ? '' : String(commodityId)}
                onChange={(event) => {
                  const value = event.target.value;
                  setCommodityId(value === '' ? undefined : Number(value));
                }}
                disabled={filtersLoading || !filtersData}
                className="rounded-xl border border-emerald-800 bg-emerald-950/70 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">All Commodities</option>
                {commodityOptions.map((commodity) => (
                  <option key={commodity.commodityId} value={commodity.commodityId}>
                    {commodity.commodityName}
                  </option>
                ))}
              </select>

              <select
                value={stateId === undefined ? '' : String(stateId)}
                onChange={(event) => {
                  const value = event.target.value;
                  setStateId(value === '' ? undefined : Number(value));
                  setDistrictId(undefined);
                }}
                disabled={filtersLoading || !filtersData}
                className="rounded-xl border border-emerald-800 bg-emerald-950/70 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">All States</option>
                {(filtersData?.states || []).map((state) => (
                  <option key={state.stateId} value={state.stateId}>
                    {state.stateName}
                  </option>
                ))}
              </select>

              <select
                value={districtId === undefined ? '' : String(districtId)}
                onChange={(event) => {
                  const value = event.target.value;
                  setDistrictId(value === '' ? undefined : Number(value));
                }}
                disabled={filtersLoading || !filtersData || stateId === undefined}
                className="rounded-xl border border-emerald-800 bg-emerald-950/70 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-60"
              >
                <option value="">All Districts</option>
                {districtOptions.map((district) => (
                  <option key={district.districtId} value={district.districtId}>
                    {district.districtName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="inline-flex items-center rounded-full border border-emerald-800 bg-emerald-950/50 p-1 w-max">
                <button
                  type="button"
                  onClick={() => setMetric('price')}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                    metric === 'price'
                      ? 'bg-emerald-400 text-emerald-950'
                      : 'text-emerald-100 hover:bg-emerald-900/60'
                  }`}
                >
                  Price
                </button>
                <button
                  type="button"
                  onClick={() => setMetric('quantity')}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                    metric === 'quantity'
                      ? 'bg-emerald-400 text-emerald-950'
                      : 'text-emerald-100 hover:bg-emerald-900/60'
                  }`}
                >
                  Quantity
                </button>
              </div>

              <div className="inline-flex items-center rounded-full border border-emerald-800 bg-emerald-950/50 p-1 w-max">
                {GRANULARITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGranularity(option.value)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                      granularity === option.value
                        ? 'bg-emerald-400 text-emerald-950'
                        : 'text-emerald-100 hover:bg-emerald-900/60'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {filtersError && (
          <div className="mb-6 rounded-2xl border border-rose-700/60 bg-rose-900/25 px-4 py-3 text-rose-100 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <span>{filtersError}</span>
          </div>
        )}

        {!filtersError && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-emerald-200/80">
                Showing {cards.length} of {pagination.totalItems} results
              </div>
              <div className="text-xs text-emerald-200/60">Source: agmarknet.ceda.ashoka.edu.in</div>
            </div>

            {cardsLoading ? (
              <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 py-16 flex items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-300" />
                <span className="text-emerald-100/80">Loading market cards...</span>
              </div>
            ) : cardsError ? (
              <div className="rounded-2xl border border-rose-700/60 bg-rose-900/20 px-4 py-3 text-rose-100">
                {cardsError}
              </div>
            ) : cards.length === 0 ? (
              <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 py-16 text-center text-emerald-100/70">
                <BarChart3 className="mx-auto h-10 w-10 mb-3 text-emerald-300/60" />
                No market cards found for selected filters.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {cards.map((card) => {
                  const metricInfo = pickCardMetric(card, metric);
                  return (
                    <button
                      key={card.seriesId}
                      type="button"
                      onClick={() => setSelectedCard(card)}
                      className="text-left rounded-2xl border border-emerald-900/50 bg-[linear-gradient(180deg,#06311f_0%,#052519_100%)] p-4 hover:border-emerald-500/60 hover:shadow-[0_14px_28px_rgba(16,185,129,0.22)] transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-emerald-300/80">
                            {card.categoryName}
                          </p>
                          <h3 className="text-lg font-bold mt-1 text-emerald-50">{card.commodityName}</h3>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-emerald-400/15 text-emerald-200 px-2 py-0.5 text-xs">
                          {card.level}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1 text-sm text-emerald-100/80">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-emerald-300/70" />
                          <span>{card.stateName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-emerald-300/70" />
                          <span>{card.districtName}</span>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border border-emerald-900/60 bg-emerald-950/50 px-3 py-2">
                        <p className="text-xs uppercase tracking-wider text-emerald-200/70">
                          {metric === 'price' ? 'Modal Price' : 'Arrival Quantity'}
                        </p>
                        <p className="text-2xl font-bold mt-1">
                          {metric === 'price'
                            ? formatCurrency(metricInfo.value)
                            : formatQuantity(metricInfo.value)}
                          <span className="text-sm font-medium text-emerald-200/70">{metricInfo.unitLabel}</span>
                        </p>
                        <div className="mt-2 text-xs flex items-center gap-1">
                          {metricInfo.isPositive ? (
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
                          ) : metricInfo.isNegative ? (
                            <TrendingDown className="h-3.5 w-3.5 text-rose-300" />
                          ) : null}
                          <span
                            className={
                              metricInfo.isPositive
                                ? 'text-emerald-300'
                                : metricInfo.isNegative
                                  ? 'text-rose-300'
                                  : 'text-emerald-100/60'
                            }
                          >
                            {metricInfo.deltaText}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-emerald-100/60">
                        Latest point: {card.latestPointLabel || 'N/A'}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrevPage || cardsLoading}
                onClick={() =>
                  setPagination((previous) => ({ ...previous, page: Math.max(1, previous.page - 1) }))
                }
                className="rounded-lg border border-emerald-800 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-emerald-100/70">
                Page {pagination.page} / {Math.max(1, pagination.totalPages)}
              </span>
              <button
                type="button"
                disabled={!pagination.hasNextPage || cardsLoading}
                onClick={() =>
                  setPagination((previous) => ({ ...previous, page: previous.page + 1 }))
                }
                className="rounded-lg border border-emerald-800 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </section>
        )}
      </div>

      {selectedCard && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 md:p-7 overflow-y-auto">
          <div className="max-w-6xl mx-auto rounded-3xl border border-emerald-900 bg-[linear-gradient(180deg,#032018_0%,#01100c_100%)] p-4 md:p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedCard.commodityName}</h2>
                <p className="text-emerald-100/70">
                  {selectedCard.stateName} · {selectedCard.districtName} · {selectedCard.categoryName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="rounded-full border border-emerald-800 p-2 hover:bg-emerald-900/60 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid lg:grid-cols-[2.1fr_1fr] gap-5">
              <div className="space-y-4">
                {seriesLoading ? (
                  <div className="h-64 rounded-2xl border border-emerald-900/40 bg-emerald-950/20 flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
                    Loading series...
                  </div>
                ) : seriesError ? (
                  <div className="rounded-2xl border border-rose-700/60 bg-rose-900/20 px-4 py-3 text-rose-100">
                    {seriesError}
                  </div>
                ) : !seriesData || seriesData.empty || !seriesData.series ? (
                  <div className="h-64 rounded-2xl border border-emerald-900/40 bg-emerald-950/20 flex items-center justify-center text-emerald-100/70">
                    No series data available for this selection.
                  </div>
                ) : (
                  <>
                    <SeriesLineChart
                      points={chartPoints}
                      accentColor={metric === 'price' ? '#34d399' : '#60a5fa'}
                    />
                    <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/25 overflow-x-auto">
                      <table className="w-full min-w-[680px] text-sm">
                        <thead className="bg-emerald-900/40 text-emerald-200">
                          <tr>
                            <th className="px-3 py-2 text-left">Time</th>
                            <th className="px-3 py-2 text-left">Min Price</th>
                            <th className="px-3 py-2 text-left">Max Price</th>
                            <th className="px-3 py-2 text-left">Modal Price</th>
                            <th className="px-3 py-2 text-left">Quantity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableRows.map((row) => (
                            <tr key={row.label} className="border-t border-emerald-900/40 text-emerald-100/90">
                              <td className="px-3 py-2">{row.label}</td>
                              <td className="px-3 py-2">{formatCurrency(row.pMin)}</td>
                              <td className="px-3 py-2">{formatCurrency(row.pMax)}</td>
                              <td className="px-3 py-2">{formatCurrency(row.pModal)}</td>
                              <td className="px-3 py-2">{formatQuantity(row.qty)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              <aside className="space-y-3">
                <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/25 p-4">
                  <p className="text-xs uppercase tracking-widest text-emerald-300/80">Selection</p>
                  <p className="mt-2 text-sm text-emerald-100/80">Granularity: {granularity.toUpperCase()}</p>
                  <p className="text-sm text-emerald-100/80">Year: 2025</p>
                  <p className="text-sm text-emerald-100/80">State: {selectedCard.stateName}</p>
                  <p className="text-sm text-emerald-100/80">District: {selectedCard.districtName}</p>
                </div>

                <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/25 p-4">
                  <p className="text-xs uppercase tracking-widest text-emerald-300/80">Snapshot</p>
                  <p className="mt-2 text-sm text-emerald-100/80">
                    Latest Price: {formatCurrency(selectedCard.latestModalPrice)}
                  </p>
                  <p className="text-sm text-emerald-100/80">
                    Latest Quantity: {formatQuantity(selectedCard.latestQuantity)}
                  </p>
                  <p className="text-sm text-emerald-100/80">
                    Price Delta: {formatDelta(selectedCard.modalDeltaAbs, selectedCard.modalDeltaPct)}
                  </p>
                  <p className="text-sm text-emerald-100/80">
                    Quantity Delta: {formatDelta(
                      selectedCard.quantityDeltaAbs,
                      selectedCard.quantityDeltaPct
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/25 p-4">
                  <p className="text-xs uppercase tracking-widest text-emerald-300/80">Freshness</p>
                  <p className="mt-2 text-sm text-emerald-100/80">
                    Updated: {seriesData?.freshness.lastUpdated || selectedCard.lastUpdated}
                  </p>
                  <p className="text-xs text-emerald-200/60 mt-1">
                    Source: {seriesData?.freshness.source || 'agmarknet.ceda.ashoka.edu.in'}
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
