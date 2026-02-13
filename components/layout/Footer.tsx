/**
 * Footer Component (Compact)
 *
 * Minimal footer to save space while fulfilling requirements.
 */

import React from 'react';
import Container from '@/components/ui/Container';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-900 text-neutral-400 mt-auto border-t border-neutral-800">
      <Container className="py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Brand & Copyright - Left Side */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🌾</span>
              <span className="text-lg font-bold text-white tracking-tight">KisanSetu</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500">
              © {currentYear} All rights reserved.
            </p>
          </div>

          {/* Navigation - Right Side (Desktop) / Center (Mobile) */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/assistant" className="hover:text-white transition-colors">Assistant</Link>
            <Link href="/schemes" className="hover:text-white transition-colors">Schemes</Link>
            <Link href="/market-prices" className="hover:text-white transition-colors">Prices</Link>
            <Link href="/privacy" className="hover:text-white transition-colors text-neutral-600">Privacy</Link>
          </div>

        </div>
      </Container>
    </footer>
  );
}
