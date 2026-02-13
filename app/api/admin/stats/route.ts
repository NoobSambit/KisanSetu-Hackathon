/**
 * Admin Stats API Route (Phase 4)
 *
 * Protected endpoint for admin statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminStats, isUserAdmin } from '@/lib/services/adminService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }

    // Get stats
    const stats = await getAdminStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error in admin stats API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
