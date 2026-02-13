/**
 * Navigation Component (Premium UI Revamp)
 *
 * - Mobile: Glassmorphic bottom navigation with refined active states.
 * - Desktop: Sleek, high-performance glass header with smooth transitions.
 * - Aesthetics: "Top-notch" visuals, clean typography, and subtle micro-interactions.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Leaf, Sprout, MessageSquareQuote, ScanLine, UserCircle2, Hexagon, LogIn, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Sprout },
  { href: '/assistant', label: 'Ask AI', icon: MessageSquareQuote },
  { href: '/satellite', label: 'Satellite', icon: ScanLine },
  { href: '/schemes', label: 'Schemes', icon: Leaf },
  { href: '/farm-profile', label: 'Profile', icon: UserCircle2 },
];

export default function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for desktop to toggle glass intensity
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* DESKTOP NAVIGATION (Top Bar) */}
      <nav
        className={`hidden lg:flex fixed top-0 w-full z-50 transition-all duration-300 ease-in-out border-b ${scrolled
            ? 'bg-white/90 backdrop-blur-xl border-neutral-200/60 py-3 shadow-sm'
            : 'bg-transparent border-transparent py-5'
          }`}
      >
        <div className="max-w-7xl mx-auto w-full px-6 flex justify-between items-center">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 group select-none">
            <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl text-white shadow-lg shadow-primary-600/20 group-hover:scale-105 transition-transform duration-300">
              <Hexagon className="w-5 h-5 fill-white/20 stroke-[2.5px]" />
              <span className="absolute text-sm font-extrabold tracking-tighter">K</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight leading-none text-neutral-900 group-hover:text-primary-700 transition-colors">
                KisanSetu
              </span>
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold group-hover:text-primary-600 transition-colors">
                Empowering Farmers
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 bg-white/60 backdrop-blur-md px-1.5 py-1.5 rounded-full border border-neutral-200/50 shadow-sm hover:shadow-md transition-shadow duration-300">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300
                    ${isActive
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20 translate-y-[-1px]'
                      : 'text-neutral-600 hover:text-primary-700 hover:bg-white/80'
                    }
                  `}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <Link
                href="/login"
                className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 overflow-hidden font-bold text-white transition-all duration-300 bg-neutral-900 rounded-full hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 shadow-lg shadow-neutral-900/20 active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 flex items-center justify-center text-primary-700 font-bold text-lg shadow-sm ring-4 ring-transparent hover:ring-primary-50 transition-all cursor-pointer">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE NAVIGATION (Bottom Bar) */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-50 pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <nav className="pointer-events-auto bg-white/95 backdrop-blur-2xl border-t border-neutral-200/60 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex justify-around items-center h-[65px] px-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative group flex flex-col items-center justify-center flex-1 h-full 
                    transition-all duration-300 tap-highlight-transparent
                  `}
                >
                  {/* Active Indicator Line */}
                  {isActive && (
                    <span className="absolute top-0 w-12 h-1 bg-primary-500 rounded-b-lg shadow-[0_2px_8px_rgba(16,185,129,0.4)] animate-in fade-in duration-300" />
                  )}

                  <div className={`
                    p-1.5 rounded-xl transition-all duration-300 transform
                    ${isActive
                      ? 'text-primary-600 -translate-y-1'
                      : 'text-neutral-400 group-active:scale-90'
                    }
                  `}>
                    <item.icon className={`w-6 h-6 ${isActive ? 'fill-primary-100 stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                  </div>

                  <span className={`
                    text-[10px] font-bold tracking-tight transition-all duration-300 leading-none mb-1
                    ${isActive
                      ? 'text-primary-700 opacity-100'
                      : 'text-neutral-400 opacity-0 h-0 hidden'
                    }
                  `}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* MOBILE TOP BAR (Glass Header) */}
      <div className="lg:hidden fixed top-0 w-full z-40 px-4 pt-4 pb-2 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <Link href="/" className="flex items-center gap-2 bg-white/90 backdrop-blur-xl border border-white/40 px-3 py-1.5 rounded-full shadow-lg shadow-black/5 ring-1 ring-black/5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-500 rounded-full flex items-center justify-center text-white font-bold shadow-inner">
              <Hexagon className="w-4 h-4 fill-white/20" />
            </div>
            <span className="text-sm font-bold text-neutral-800 tracking-tight pr-1">
              KisanSetu
            </span>
          </Link>

          {!isAuthenticated ? (
            <Link href="/login" className="flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur-xl border border-white/40 rounded-full shadow-lg shadow-black/5 ring-1 ring-black/5 text-primary-700">
              <LogIn className="w-5 h-5 ml-0.5" />
            </Link>
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-xl border border-white/40 flex items-center justify-center text-primary-700 font-bold shadow-lg shadow-black/5 ring-1 ring-black/5">
              <User className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
