/**
 * Root Layout
 *
 * This is the main layout component that wraps all pages.
 * It includes the navigation, footer, and global styles.
 * Phase 2: Added AuthProvider for global authentication state
 */

import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/lib/context/AuthContext';

export const metadata: Metadata = {
  title: 'KisanSetu - AI-Powered Farming Assistant',
  description: 'Get expert farming advice, understand government schemes, and make informed agricultural decisions with AI-powered assistance.',
  keywords: ['farming', 'agriculture', 'AI assistant', 'crop care', 'government schemes', 'farmers'],
  authors: [{ name: 'KisanSetu Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#22c55e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 min-h-screen flex flex-col">
        <AuthProvider>
          <Navigation />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
