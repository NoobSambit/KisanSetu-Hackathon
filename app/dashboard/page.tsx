/**
 * Dashboard Page
 *
 * Comprehensive farmer command center.
 * Features:
 * - Real-time market ticker
 * - Voice assistant integration
 * - Crop planning and alerts
 * - Satellite health monitoring
 * - Local weather and community updates
 */

'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardHeader from '@/components/dashboard/Header';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import DashboardMainContent from '@/components/dashboard/MainContent';
import DashboardRightSidebar from '@/components/dashboard/RightSidebar';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-100 antialiased overflow-hidden h-screen flex flex-col">
        <DashboardHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex flex-1 overflow-hidden relative">
          <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <DashboardMainContent />
          <DashboardRightSidebar />
        </div>
      </div>
    </ProtectedRoute>
  );
}
