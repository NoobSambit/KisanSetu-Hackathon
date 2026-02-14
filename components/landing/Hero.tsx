'use client';

import Link from 'next/link';

export default function LandingHero() {
    return (
        <section className="relative pt-24 pb-16 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-hero-pattern">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-background-dark via-surface-dark to-stone-dark opacity-95 z-0 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background-dark z-0 pointer-events-none"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* Trust Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6 backdrop-blur-sm animate-fade-in-up">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    Trusted by 50,000+ Indian Farmers
                </div>

                {/* Heading */}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-white font-display leading-tight">
                    Your AI <br className="hidden md:block" />
                    <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-primary to-green-400">
                        Farming Companion
                    </span>
                </h1>

                {/* Subheading */}
                <p className="mt-4 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Empowering Indian farmers with real-time market prices, weather insights, and AI crop advisory in your local language.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                    <Link href="/assistant" className="w-full sm:w-auto">
                        <button className="w-full px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 text-lg">
                            <span className="material-icons">smart_toy</span>
                            Try AI Assistant
                        </button>
                    </Link>

                    <Link href="#market" className="w-full sm:w-auto">
                        <button className="w-full px-8 py-4 bg-surface-dark border border-gray-700 hover:border-primary/50 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group text-lg">
                            <span className="material-icons text-primary group-hover:text-white transition-colors">trending_up</span>
                            Check Crop Prices
                        </button>
                    </Link>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm font-medium text-gray-400">
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                        <span className="material-icons text-primary text-lg">language</span>
                        <span>13 Regional Languages</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                        <span className="material-icons text-primary text-lg">wifi_off</span>
                        <span>Works Offline</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                        <span className="material-icons text-primary text-lg">verified_user</span>
                        <span>Government Data Sync</span>
                    </div>
                </div>
            </div>

            {/* Hero Visual / Decoration */}
            <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/20 rounded-full blur-[120px] -translate-x-1/2 z-0 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] translate-x-1/3 z-0 pointer-events-none"></div>
        </section>
    );
}
