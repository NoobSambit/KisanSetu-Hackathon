/**
 * Admin Dashboard (Phase 4)
 *
 * Protected admin-only dashboard for system management
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchStats();
    }
  }, [user, isAuthenticated, authLoading, router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/stats?userId=${user?.uid}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Access denied');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading admin dashboard..." />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-8">
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:underline"
          >
            Go to Dashboard
          </button>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-green-900 mb-2">🛡️ Admin Dashboard</h1>
        <p className="text-lg text-gray-600">System management and analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Users</h3>
          <p className="text-4xl font-bold text-green-600">{stats?.totalUsers || 0}</p>
          <p className="text-xs text-gray-500 mt-2">
            {stats?.activeUsers || 0} active
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Posts</h3>
          <p className="text-4xl font-bold text-blue-600">{stats?.totalPosts || 0}</p>
          <p className="text-xs text-gray-500 mt-2">Community engagement</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">AI Queries</h3>
          <p className="text-4xl font-bold text-purple-600">{stats?.totalAIQueries || 0}</p>
          <p className="text-xs text-gray-500 mt-2">Assistant usage</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Flagged Content</h3>
          <p className="text-4xl font-bold text-red-600">{stats?.flaggedContent || 0}</p>
          <p className="text-xs text-gray-500 mt-2">Requires moderation</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">System Health</h3>
          <p className={`text-4xl font-bold ${
            stats?.systemHealth === 'good' ? 'text-green-600' :
            stats?.systemHealth === 'warning' ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {stats?.systemHealth === 'good' ? '✓' :
             stats?.systemHealth === 'warning' ? '⚠' :
             '✗'}
          </p>
          <p className="text-xs text-gray-500 mt-2 capitalize">
            {stats?.systemHealth || 'Unknown'}
          </p>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/community')}
            className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <span className="text-2xl mb-2 block">👥</span>
            <h3 className="font-semibold">View Community</h3>
            <p className="text-sm text-gray-600">Monitor community posts</p>
          </button>

          <button
            onClick={() => window.location.reload()}
            className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <span className="text-2xl mb-2 block">🔄</span>
            <h3 className="font-semibold">Refresh Stats</h3>
            <p className="text-sm text-gray-600">Update dashboard data</p>
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <span className="text-2xl mb-2 block">📊</span>
            <h3 className="font-semibold">Analytics</h3>
            <p className="text-sm text-gray-600">View detailed analytics</p>
          </button>

          <button
            onClick={() => alert('Feature coming soon!')}
            className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <span className="text-2xl mb-2 block">⚙️</span>
            <h3 className="font-semibold">Settings</h3>
            <p className="text-sm text-gray-600">System configuration</p>
          </button>
        </div>
      </Card>

      {/* Note */}
      <Card className="p-4 mt-6 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is an admin-only area. All actions are logged for security purposes.
        </p>
      </Card>
    </Container>
  );
}
