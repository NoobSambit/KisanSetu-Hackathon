'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SatelliteClient from '@/components/satellite/SatelliteClient';

export default function SatellitePage() {
  return (
    <ProtectedRoute>
      <SatelliteClient />
    </ProtectedRoute>
  );
}
