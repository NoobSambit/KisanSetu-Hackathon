/**
 * Home Page / Landing Page (Minimal Mobile-First Revamp)
 *
 * Design: High-impact, clear hierarchy, thumb-friendly actions.
 * Focus: Connect user to Assistant immediately.
 */

'use client';

import Link from 'next/link';
import Container from '@/components/ui/Container';
import { Mic, Satellite, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen pb-24 pt-16 lg:pt-24 font-sans bg-neutral-50 selection:bg-primary-100">

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-primary-50/80 to-transparent -z-10 pointer-events-none" />

      <Container size="sm" className="px-5">

        {/* Header / Greeting */}
        <section className="pt-6 pb-8 text-center">
          <div className="inline-flex items-center justify-center px-3 py-1 mb-4 rounded-full bg-white border border-neutral-200 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
            <span className="text-xs font-semibold text-neutral-600 tracking-wide uppercase">AI Assistant Online</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-[1.1] mb-3">
            Farming Made <span className="text-primary-600">Smart</span>
          </h1>
          <p className="text-lg text-neutral-500 max-w-xs mx-auto leading-relaxed">
            Instant answers, government schemes, and crop advice in your pocket.
          </p>
        </section>

        {/* Primary Action - "The Big Button" */}
        <section className="mb-10">
          <Link href="/assistant" className="group relative block w-full max-w-sm mx-auto">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-600 to-primary-400 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
            <button className="relative w-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-xl py-5 px-8 rounded-2xl shadow-xl shadow-primary-600/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3">
              <span>Ask AI Assistant</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse-slow"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </button>
          </Link>
          <p className="text-center text-xs text-neutral-400 mt-3 font-medium">
            Supports Hindi, English, Marathi & more
          </p>
        </section>

        {/* Quick Access Cards */}
        <section className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-10">
          {/* Schemes Card */}
          <Link href="/schemes" className="block group">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm transition-all hover:border-primary-300 hover:shadow-md h-full flex flex-col items-center text-center active:scale-[0.98]">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg>
              </div>
              <h3 className="font-bold text-neutral-900 mb-1">Find Schemes</h3>
              <p className="text-xs text-neutral-500 leading-snug">Check your eligibility for gov benefits</p>
            </div>
          </Link>

          {/* Profile Card */}
          <Link href="/farm-profile" className="block group">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm transition-all hover:border-amber-300 hover:shadow-md h-full flex flex-col items-center text-center active:scale-[0.98]">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </div>
              <h3 className="font-bold text-neutral-900 mb-1">Farm Profile</h3>
              <p className="text-xs text-neutral-500 leading-snug">Update land details & soil info</p>
            </div>
          </Link>
        </section>

        {/* Feature Highlights (Reduced visual noise) */}
        <section className="max-w-sm mx-auto">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4 px-1">Why KisanSetu?</h3>
          <div className="space-y-3">
            {[
              { icon: <Mic className="w-6 h-6 text-primary-500" />, text: 'Voice-first interaction for easy use' },
              { icon: <Satellite className="w-6 h-6 text-blue-500" />, text: 'Satellite data for accurate advice' },
              { icon: <ShieldCheck className="w-6 h-6 text-green-500" />, text: 'Verified government schemes only' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/60 border border-neutral-100 rounded-xl">
                {item.icon}
                <span className="text-sm font-semibold text-neutral-700">{item.text}</span>
              </div>
            ))}
          </div>
        </section>

      </Container>
    </main>
  );
}
