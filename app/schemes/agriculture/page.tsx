'use client';
import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { AgricultureSchemeCatalogRecord, AgricultureSchemesApiResponse } from '@/types';

const PAGE_SIZE = 12;

interface ApiBundle {
  items: AgricultureSchemeCatalogRecord[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  facets: {
    states: string[];
    categories: string[];
    ministries: string[];
  };
  source: 'firestore' | 'local_file';
  warning: string | null;
}

export default function AgricultureSchemesPage() {
  return (
    <ProtectedRoute>
      <AgricultureSchemesCatalog />
    </ProtectedRoute>
  );
}

function AgricultureSchemesCatalog() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<ApiBundle | null>(null);

  const [page, setPage] = useState(1);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setQuery(queryInput.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [queryInput]);

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });

        if (query) params.set('query', query);
        if (stateFilter) params.set('state', stateFilter);
        if (categoryFilter) params.set('category', categoryFilter);

        const response = await fetch(`/api/schemes/agriculture?${params.toString()}`);
        const payload = (await response.json()) as AgricultureSchemesApiResponse;

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || 'Failed to fetch agriculture schemes');
        }

        setBundle(payload.data as ApiBundle);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to fetch agriculture schemes');
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, [page, query, stateFilter, categoryFilter]);

  const schemes = bundle?.items || [];
  const pagination = bundle?.pagination;

  const activeFilterSummary = useMemo(() => {
    const parts: string[] = [];

    if (query) parts.push(`Query: "${query}"`);
    if (stateFilter) parts.push(`State: ${stateFilter}`);
    if (categoryFilter) parts.push(`Category: ${categoryFilter}`);

    return parts.join(' | ');
  }, [categoryFilter, query, stateFilter]);

  return (
    <div className="min-h-screen bg-neutral-50 pt-16 pb-24">
      <Container size="lg" className="space-y-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">
                Full Agriculture Catalog
              </p>
              <h1 className="text-2xl font-bold text-neutral-900">India.gov + MyScheme Scheme Library</h1>
              <p className="text-sm text-neutral-600">
                Browse every agriculture-related scheme scraped across all 83 listing pages.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-neutral-500">Total Matching Records</p>
              <p className="text-xl font-bold text-neutral-900">{pagination?.totalItems ?? 0}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-neutral-500">Data Source</p>
              <p className="text-xl font-bold text-neutral-900">{bundle?.source || '-'}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-neutral-500">Page</p>
              <p className="text-xl font-bold text-neutral-900">
                {pagination?.page ?? 0}/{pagination?.totalPages ?? 0}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm">
              <span className="block text-neutral-600 mb-1">Search</span>
              <input
                type="text"
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder="Scheme name, keyword, eligibility, benefit..."
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </label>

            <label className="text-sm">
              <span className="block text-neutral-600 mb-1">State</span>
              <select
                value={stateFilter}
                onChange={(event) => {
                  setPage(1);
                  setStateFilter(event.target.value);
                }}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="">All States</option>
                {(bundle?.facets.states || []).map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="block text-neutral-600 mb-1">Category</span>
              <select
                value={categoryFilter}
                onChange={(event) => {
                  setPage(1);
                  setCategoryFilter(event.target.value);
                }}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="">All Categories</option>
                {(bundle?.facets.categories || []).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {bundle?.warning && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {bundle.warning}
            </div>
          )}

          {activeFilterSummary && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              {activeFilterSummary}
            </div>
          )}
        </div>

        {loading && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-600">
            Loading agriculture schemes...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {!loading && !error && schemes.length === 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-600">
            No schemes found for the selected filters.
          </div>
        )}

        {!loading && !error && schemes.length > 0 && (
          <div className="space-y-4">
            {schemes.map((scheme) => (
              <SchemeCard key={scheme.schemeDocId} scheme={scheme} />
            ))}
          </div>
        )}

        {!loading && !error && pagination && pagination.totalPages > 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>

            <p className="text-sm text-neutral-600">
              Page <span className="font-bold text-neutral-900">{pagination.page}</span> of{' '}
              <span className="font-bold text-neutral-900">{pagination.totalPages}</span>
            </p>

            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}

function SchemeCard({ scheme }: { scheme: AgricultureSchemeCatalogRecord }) {
  const overviewBlocks = [
    { title: 'Brief Description', content: scheme.content.briefDescription },
    { title: 'Detailed Description', content: scheme.content.detailedDescriptionText },
    { title: 'Eligibility', content: scheme.eligibility.text || scheme.eligibility.markdown },
    { title: 'Benefits', content: scheme.content.benefitsText || scheme.content.benefitsMarkdown },
    { title: 'Required Documents', content: scheme.documents.text || scheme.documents.markdown },
  ].filter((entry) => Boolean(entry.content));

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">{scheme.title}</h2>
            <p className="text-sm text-neutral-600">
              {scheme.shortTitle || '-'} | {scheme.level?.label || 'Level not specified'}
            </p>
            <p className="text-sm text-neutral-600">
              {scheme.state?.label || scheme.listing.beneficiaryState || 'State scope not specified'}
            </p>
          </div>

          <div className="text-sm text-right">
            <p className="font-semibold text-neutral-800">{scheme.ministry || 'Ministry not listed'}</p>
            <p className="text-neutral-500">{scheme.nodalDepartment || 'Nodal department not listed'}</p>
          </div>
        </div>

        {scheme.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {scheme.tags.map((tag) => (
              <span
                key={`${scheme.schemeDocId}-${tag}`}
                className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {scheme.content.briefDescription && (
          <p className="text-sm text-neutral-700 leading-relaxed">{scheme.content.briefDescription}</p>
        )}

        <details className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-primary-700">
            View Full Scheme Data
          </summary>

          <div className="mt-3 space-y-4">
            {overviewBlocks.map((entry) => (
              <section key={`${scheme.schemeDocId}-${entry.title}`} className="space-y-1">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">{entry.title}</h3>
                <p className="text-sm text-neutral-800 whitespace-pre-wrap">{entry.content}</p>
              </section>
            ))}

            {scheme.applicationProcess.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">
                  Application Process
                </h3>
                <ul className="space-y-2">
                  {scheme.applicationProcess.map((step, index) => (
                    <li key={`${scheme.schemeDocId}-step-${index}`} className="rounded-lg bg-white border border-neutral-200 p-2.5">
                      <p className="text-xs font-semibold text-neutral-600 uppercase">{step.mode}</p>
                      <p className="text-sm text-neutral-800 whitespace-pre-wrap mt-1">
                        {step.processText || step.processMarkdown || 'Not available'}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {scheme.faqs.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">FAQs</h3>
                <ul className="space-y-2">
                  {scheme.faqs.map((faq, index) => (
                    <li key={`${scheme.schemeDocId}-faq-${index}`} className="rounded-lg bg-white border border-neutral-200 p-2.5">
                      <p className="text-sm font-semibold text-neutral-900">{faq.question || 'Untitled question'}</p>
                      <p className="text-sm text-neutral-700 whitespace-pre-wrap mt-1">
                        {faq.answerText || faq.answerMarkdown || 'Answer not available'}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {scheme.content.references.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">References</h3>
                <ul className="space-y-1">
                  {scheme.content.references.map((reference, index) => (
                    <li key={`${scheme.schemeDocId}-ref-${index}`} className="text-sm">
                      {reference.url ? (
                        <a href={reference.url} target="_blank" rel="noreferrer" className="text-blue-700 underline break-all">
                          {reference.title || reference.url}
                        </a>
                      ) : (
                        <span className="text-neutral-700">{reference.title || 'Reference'}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {scheme.applicationChannels.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">
                  Application Channels
                </h3>
                <ul className="space-y-1">
                  {scheme.applicationChannels.map((channel, index) => {
                    const label = typeof channel.applicationName === 'string' ? channel.applicationName : `Channel ${index + 1}`;
                    const url = typeof channel.applicationUrl === 'string' ? channel.applicationUrl : null;

                    return (
                      <li key={`${scheme.schemeDocId}-channel-${index}`} className="text-sm">
                        {url ? (
                          <a href={url} target="_blank" rel="noreferrer" className="text-blue-700 underline break-all">
                            {label}
                          </a>
                        ) : (
                          <span className="text-neutral-700">{label}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section className="space-y-1">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Source Links</h3>
              <p className="text-sm text-neutral-700 break-all">India Search: {scheme.listing.searchUrl}</p>
              <p className="text-sm text-neutral-700 break-all">MyScheme: {scheme.source.mySchemePage || 'N/A'}</p>
              <p className="text-sm text-neutral-700 break-all">Scraped At: {scheme.source.scrapedAt}</p>
            </section>
          </div>
        </details>
      </div>
    </article>
  );
}
