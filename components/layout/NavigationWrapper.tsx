'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';

export default function NavigationWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isLandingPage = pathname === '/';
    const isDashboardPage = pathname === '/dashboard';

    return (
        <>
            {!isLandingPage && !isDashboardPage && <Navigation />}
            <main className={`flex-grow ${isLandingPage || isDashboardPage ? 'p-0' : ''}`}>
                {children}
            </main>
            {!isLandingPage && !isDashboardPage && <Footer />}
        </>
    );
}
