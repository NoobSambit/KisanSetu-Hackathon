import type { Metadata, Viewport } from 'next';
import './globals.css';
import NavigationWrapper from '@/components/layout/NavigationWrapper';
import { AuthProvider } from '@/lib/context/AuthContext';

export const metadata: Metadata = {
  title: 'KisanSetu - Your AI Farming Companion',
  description: 'Empowering Indian farmers with real-time market prices, weather insights, and AI crop advisory in your local language.',
  keywords: ['farming', 'agriculture', 'AI assistant', 'crop care', 'government schemes', 'farmers', 'mandi prices'],
  authors: [{ name: 'KisanSetu Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#11d452',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className="bg-background-light dark:bg-background-dark text-gray-800 dark:text-white min-h-screen flex flex-col font-display antialiased">
        <AuthProvider>
          <NavigationWrapper>
            {children}
          </NavigationWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
