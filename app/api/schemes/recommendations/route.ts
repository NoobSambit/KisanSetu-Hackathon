import { NextRequest, NextResponse } from 'next/server';
import { SCHEME_CATALOG_SEED } from '@/lib/data/schemeCatalogSeed';
import {
  getSchemeCatalog,
  getSchemeUserStateMap,
  saveSchemeRecommendationSnapshot,
  upsertSchemeCatalog,
} from '@/lib/firebase/day2';
import { getFarmProfile } from '@/lib/firebase/firestore';
import {
  buildDefaultChecklist,
  generateSchemeRecommendations,
  getChecklistProgress,
} from '@/lib/services/schemeMatcherService';

const PRIORITY_LABELS = ['Top Priority', 'Strong Match', 'Good Option'];

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const limit = Number(request.nextUrl.searchParams.get('limit') || 12);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId query parameter is required',
        },
        { status: 400 }
      );
    }

    let catalog = await getSchemeCatalog();
    let catalogSource: 'firestore' | 'local_seed_fallback' = 'firestore';
    let catalogWarning: string | null = null;

    if (catalog.length === 0) {
      const seedResult = await upsertSchemeCatalog(SCHEME_CATALOG_SEED);

      if (seedResult.success) {
        catalog = await getSchemeCatalog();
      } else {
        catalogWarning = seedResult.error || 'Catalog seed write failed';
      }
    }

    if (catalog.length === 0) {
      catalog = SCHEME_CATALOG_SEED;
      catalogSource = 'local_seed_fallback';
      catalogWarning =
        catalogWarning || 'Using local in-repo seed catalog because Firestore catalog is unavailable.';
    }

    const [profile, stateMap] = await Promise.all([
      getFarmProfile(userId),
      getSchemeUserStateMap(userId),
    ]);

    const recommendationBundle = generateSchemeRecommendations({
      profile,
      catalog,
      limit: Number.isFinite(limit) ? Math.max(5, Math.min(limit, 25)) : 12,
    });

    const recommendations = recommendationBundle.recommendations.map((recommendation, index) => {
      const existingState = stateMap[recommendation.schemeId];
      const checklist = existingState?.checklist || buildDefaultChecklist(recommendation.documentsRequired);

      return {
        ...recommendation,
        priorityLabel: PRIORITY_LABELS[index] || null,
        saved: Boolean(existingState?.saved),
        checklist,
        documentReadinessScore: getChecklistProgress(checklist),
      };
    });

    saveSchemeRecommendationSnapshot(
      userId,
      recommendationBundle.profileCompleteness,
      recommendationBundle.recommendations
    ).catch((snapshotError) => {
      console.error('Failed to persist scheme recommendation snapshot:', snapshotError);
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          profileAvailable: Boolean(profile),
          profileCompleteness: recommendationBundle.profileCompleteness,
          missingProfileInputs: recommendationBundle.missingProfileInputs,
          recommendations,
          duplicateCandidates: recommendationBundle.duplicatePairs.slice(0, 8),
          totalCatalogSize: catalog.length,
          catalogSource,
          catalogWarning,
        },
        error: null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Scheme recommendations route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate recommendations',
      },
      { status: 500 }
    );
  }
}
