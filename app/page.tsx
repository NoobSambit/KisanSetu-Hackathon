'use client';

import LandingNavbar from '@/components/landing/Navbar';
import LandingHero from '@/components/landing/Hero';
import StatsBanner from '@/components/landing/StatsBanner';
import FeaturesGrid from '@/components/landing/FeaturesGrid';
import DemoShowcase from '@/components/landing/DemoShowcase';
import HowItWorks from '@/components/landing/HowItWorks';
import DetailedFeatures from '@/components/landing/DetailedFeatures';
import Testimonials from '@/components/landing/Testimonials';
import TrustStrip from '@/components/landing/TrustStrip';
import LandingFooter from '@/components/landing/LandingFooter';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background-dark font-display text-gray-100 antialiased overflow-x-hidden">
      <LandingNavbar />
      <main>
        <LandingHero />
        <StatsBanner />
        <FeaturesGrid />
        <DemoShowcase />
        <HowItWorks />
        <DetailedFeatures />
        <Testimonials />
        <TrustStrip />
      </main>
      <LandingFooter />
    </div>
  );
}
