import { NextResponse } from 'next/server';
import { SCHEME_CATALOG_SEED } from '@/lib/data/schemeCatalogSeed';
import { upsertSchemeCatalog } from '@/lib/firebase/day2';
import { detectSchemeDuplicates } from '@/lib/services/schemeMatcherService';

export async function POST() {
  try {
    const result = await upsertSchemeCatalog(SCHEME_CATALOG_SEED);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to seed scheme catalog',
        },
        { status: 500 }
      );
    }

    const duplicates = detectSchemeDuplicates(SCHEME_CATALOG_SEED);

    return NextResponse.json(
      {
        success: true,
        count: result.count,
        duplicateCandidates: duplicates,
        error: null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Scheme seed route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed scheme catalog',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to seed scheme catalog.',
    },
    { status: 405 }
  );
}
