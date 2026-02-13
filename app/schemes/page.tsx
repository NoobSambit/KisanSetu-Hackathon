/**
 * Schemes Page
 *
 * Day 2 policy matcher UI aligned with current API contracts.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/context/AuthContext';
import { MissingEligibilityInput, SchemeRecommendation } from '@/types';

interface SchemeView extends SchemeRecommendation {
  priorityLabel?: string | null;
  saved: boolean;
  checklist: Record<string, boolean>;
  documentReadinessScore: number;
}

interface RecommendationResponse {
  profileAvailable: boolean;
  profileCompleteness: number;
  missingProfileInputs: MissingEligibilityInput[];
  recommendations: SchemeView[];
  duplicateCandidates: Array<{ schemeAId: string; schemeBId: string; overlapScore: number; reason: string }>;
  totalCatalogSize: number;
  catalogSource: 'firestore' | 'local_seed_fallback';
  catalogWarning: string | null;
}

const DOCUMENT_LABEL_OVERRIDES: Record<string, string> = {
  identity_proof: 'Identity Proof',
  project_proposal_dpr: 'Project Proposal / DPR',
  land_or_lease_proof: 'Land or Lease Proof',
  bank_kyc_documents: 'Bank KYC Documents',
};

function formatChecklistLabel(documentKey: string): string {
  const normalizedKey = documentKey.trim().toLowerCase();
  if (DOCUMENT_LABEL_OVERRIDES[normalizedKey]) {
    return DOCUMENT_LABEL_OVERRIDES[normalizedKey];
  }

  return normalizedKey
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function SchemesPage() {
  return (
    <ProtectedRoute>
      <SchemesReview />
    </ProtectedRoute>
  );
}

function SchemesReview() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<RecommendationResponse | null>(null);
  const [savingStateByScheme, setSavingStateByScheme] = useState<Record<string, boolean>>({});
  const [checklistSavingByScheme, setChecklistSavingByScheme] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadRecommendations() {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/schemes/recommendations?userId=${user.uid}`);
        const data = await response.json();

        if (!response.ok || !data.success || !data.data) {
          throw new Error(data.error || 'Failed to load recommendations');
        }

        setBundle(data.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, [user]);

  const schemes = bundle?.recommendations || [];
  const missingProfileInputs = bundle?.missingProfileInputs || [];

  const topMissingInputs = useMemo(() => missingProfileInputs.slice(0, 3), [missingProfileInputs]);

  const updateSchemeInState = (
    schemeId: string,
    updater: (current: SchemeView) => SchemeView
  ) => {
    setBundle((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        recommendations: prev.recommendations.map((scheme) =>
          scheme.schemeId === schemeId ? updater(scheme) : scheme
        ),
      };
    });
  };

  const toggleSaved = async (scheme: SchemeView) => {
    if (!user) return;

    const nextSaved = !scheme.saved;
    setSavingStateByScheme((prev) => ({ ...prev, [scheme.schemeId]: true }));

    updateSchemeInState(scheme.schemeId, (current) => ({ ...current, saved: nextSaved }));

    try {
      const response = await fetch('/api/schemes/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          schemeId: scheme.schemeId,
          saved: nextSaved,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update saved state');
      }
    } catch (saveError) {
      updateSchemeInState(scheme.schemeId, (current) => ({ ...current, saved: scheme.saved }));
      setError(saveError instanceof Error ? saveError.message : 'Failed to update saved state');
    } finally {
      setSavingStateByScheme((prev) => ({ ...prev, [scheme.schemeId]: false }));
    }
  };

  const toggleChecklistItem = async (scheme: SchemeView, docName: string, checked: boolean) => {
    if (!user) return;

    const nextChecklist = {
      ...scheme.checklist,
      [docName]: checked,
    };

    setChecklistSavingByScheme((prev) => ({ ...prev, [scheme.schemeId]: true }));

    updateSchemeInState(scheme.schemeId, (current) => ({
      ...current,
      checklist: nextChecklist,
      documentReadinessScore: Math.round(
        (Object.values(nextChecklist).filter(Boolean).length /
          Math.max(Object.keys(nextChecklist).length, 1)) *
          100
      ),
    }));

    try {
      const response = await fetch('/api/schemes/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          schemeId: scheme.schemeId,
          checklist: nextChecklist,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update checklist');
      }

      const serverProgress = data?.data?.checklistProgress;
      if (typeof serverProgress === 'number') {
        updateSchemeInState(scheme.schemeId, (current) => ({
          ...current,
          documentReadinessScore: serverProgress,
        }));
      }
    } catch (checklistError) {
      updateSchemeInState(scheme.schemeId, (current) => ({
        ...current,
        checklist: scheme.checklist,
        documentReadinessScore: scheme.documentReadinessScore,
      }));
      setError(checklistError instanceof Error ? checklistError.message : 'Failed to update checklist');
    } finally {
      setChecklistSavingByScheme((prev) => ({ ...prev, [scheme.schemeId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center text-neutral-500">Loading schemes...</div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-16 pb-24">
      <Container size="sm">
        <div className="px-2 mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Schemes</h1>
          <p className="text-neutral-500 text-sm">
            Profile-aware government benefits with checklist progress.
          </p>
        </div>

        {error && (
          <div className="mx-2 mb-4 p-3 text-sm rounded-xl border border-red-100 bg-red-50 text-red-700">
            {error}
          </div>
        )}

        {bundle && (
          <div className="mx-2 mb-4 space-y-2">
            <div className="p-3 rounded-xl bg-white border border-neutral-200 text-sm text-neutral-700">
              Profile completeness: <span className="font-bold">{bundle.profileCompleteness}%</span>
              <span className="text-neutral-500"> | Catalog: {bundle.totalCatalogSize} schemes</span>
            </div>

            {bundle.catalogWarning && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
                {bundle.catalogWarning}
              </div>
            )}

            {topMissingInputs.length > 0 && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xs font-bold text-blue-800 uppercase mb-2">Improve Recommendation Accuracy</p>
                <ul className="space-y-1 text-sm text-blue-900">
                  {topMissingInputs.map((item) => (
                    <li key={item.key}>- {item.prompt}</li>
                  ))}
                </ul>
                <Link href="/farm-profile" className="inline-block mt-3 text-sm font-semibold text-blue-700 underline">
                  Update Farm Profile
                </Link>
              </div>
            )}
          </div>
        )}

        {schemes.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-2xl border border-neutral-200 mx-2">
            <p className="text-neutral-500">No schemes matched yet. Complete your profile.</p>
            <Link href="/farm-profile">
              <Button className="mt-4">Go to Profile</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {schemes.map((scheme) => {
              const isSaving = Boolean(savingStateByScheme[scheme.schemeId]);
              const isChecklistSaving = Boolean(checklistSavingByScheme[scheme.schemeId]);

              return (
                <div
                  key={scheme.schemeId}
                  className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        {scheme.priorityLabel && (
                          <p className="text-[10px] uppercase font-bold tracking-wide text-primary-700 mb-1">
                            {scheme.priorityLabel}
                          </p>
                        )}
                        <h3 className="text-lg font-bold text-neutral-900 leading-tight">
                          {scheme.schemeName}
                        </h3>
                        <p className="text-xs text-neutral-500">{scheme.authorityLabel}</p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            scheme.status === 'eligible'
                              ? 'bg-green-100 text-green-700'
                              : scheme.status === 'partially_eligible'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {scheme.status.replace('_', ' ')}
                        </span>
                        <p className="font-bold text-primary-700 text-lg mt-1">{scheme.score}%</p>
                        <p className="text-[10px] text-neutral-500 uppercase">Match</p>
                      </div>
                    </div>

                    <p className="text-sm text-neutral-700">{scheme.benefits[0] || 'No benefit summary available.'}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-2">
                        <p className="font-semibold text-neutral-700">Deadline</p>
                        <p className="text-neutral-600 mt-1">{scheme.deadlines || 'N/A'}</p>
                      </div>
                      <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-2">
                        <p className="font-semibold text-neutral-700">Doc Readiness</p>
                        <p className="text-neutral-600 mt-1">{scheme.documentReadinessScore}%</p>
                      </div>
                    </div>

                    {scheme.reasons.length > 0 && (
                      <div className="bg-primary-50 border border-primary-100 rounded-lg p-2">
                        <p className="text-xs font-bold uppercase text-primary-700 mb-1">Why This Rank</p>
                        <ul className="space-y-1 text-xs text-primary-900">
                          {scheme.reasons.slice(0, 3).map((reason) => (
                            <li key={reason.code} className="leading-relaxed">
                              • {reason.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Object.keys(scheme.checklist).length > 0 && (
                      <div className="border border-neutral-100 rounded-lg p-2.5">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold uppercase text-neutral-600">
                            Application Checklist
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            {Object.values(scheme.checklist).filter(Boolean).length}/
                            {Object.keys(scheme.checklist).length} ready
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(scheme.checklist).map(([documentName, checked]) => (
                            <label
                              key={`${scheme.schemeId}-${documentName}`}
                              className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors ${
                                checked
                                  ? 'bg-primary-50 border-primary-100'
                                  : 'bg-neutral-50 border-neutral-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={isChecklistSaving}
                                onChange={(e) =>
                                  toggleChecklistItem(scheme, documentName, e.target.checked)
                                }
                                className="peer sr-only"
                              />
                              <span
                                className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                  checked
                                    ? 'border-primary-500 bg-primary-500'
                                    : 'border-neutral-300 bg-white'
                                }`}
                              >
                                <svg
                                  viewBox="0 0 16 16"
                                  className={`h-3 w-3 text-white transition-opacity ${
                                    checked ? 'opacity-100' : 'opacity-0'
                                  }`}
                                >
                                  <path
                                    d="M6.2 11.2 2.9 8l-1 1 4.3 4.2L14.1 5l-1-1z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span className="text-[13px] leading-5 text-neutral-700">
                                {formatChecklistLabel(documentName)}
                              </span>
                            </label>
                          ))}
                        </div>
                        {isChecklistSaving && (
                          <p className="text-[11px] text-neutral-500 mt-2">Updating checklist...</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-neutral-50 px-5 py-3 border-t border-neutral-100 flex gap-2">
                    <a href={scheme.officialLink} target="_blank" rel="noreferrer" className="flex-1">
                      <button className="w-full py-2 bg-white border border-neutral-200 rounded-lg text-sm font-semibold text-neutral-700">
                        Official Link
                      </button>
                    </a>

                    <Button
                      size="sm"
                      variant={scheme.saved ? 'outline' : 'primary'}
                      className="flex-1 rounded-lg"
                      disabled={isSaving}
                      onClick={() => toggleSaved(scheme)}
                    >
                      {isSaving ? 'Saving...' : scheme.saved ? 'Saved' : 'Save'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
