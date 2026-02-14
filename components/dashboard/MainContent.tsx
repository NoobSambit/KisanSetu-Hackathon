'use client';

import React from 'react';
import Link from 'next/link';

export default function DashboardMainContent() {
    const quickServices = [
        { name: 'Govt Schemes', icon: 'account_balance', href: '/schemes' },
        { name: 'Pest Doctor', icon: 'pest_control', href: '/pest-detection' },
        { name: 'Irrigation Log', icon: 'water_drop', href: '/irrigation' },
        { name: 'Buy Inputs', icon: 'shopping_cart', href: '/market' },
        { name: 'Sell Crops', icon: 'sell', href: '/market-prices' },
        { name: 'Farm Records', icon: 'history_edu', href: '/records' },
    ];

    return (
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 custom-scrollbar relative">
            {/* Hero Section */}
            <div className="mb-8">
                <div className="bg-gradient-to-r from-surface-dark to-surface-darker border border-primary/20 rounded-2xl p-4 md:p-6 shadow-lg relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-primary/5 skew-x-12 transform origin-top-right group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-shrink-0 order-2 md:order-1">
                            <button className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 animate-pulse">
                                <span className="material-icons text-3xl md:text-4xl">mic</span>
                            </button>
                        </div>
                        <div className="flex-1 text-center md:text-left order-1 md:order-2">
                            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                                नमस्ते राम कुमार! <span className="text-sm font-normal text-gray-400 block md:inline">(Namaste Ram Kumar)</span>
                            </h2>
                            <p className="text-sm md:text-base text-gray-400">
                                Ask me anything about your crops, weather, or prices.
                            </p>
                        </div>
                        <div className="w-full md:w-auto order-3">
                            <div className="relative">
                                <input
                                    className="w-full md:w-80 bg-background-dark border border-gray-700 text-white text-sm rounded-xl focus:ring-primary focus:border-primary block p-3 pr-10 shadow-inner placeholder-gray-500"
                                    placeholder="Type or speak in Hindi..."
                                    type="text"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <span className="material-icons text-gray-500">send</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Column 1: Crop Planner */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface-dark rounded-xl border border-gray-800 shadow-sm overflow-hidden h-full">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <span className="material-icons text-primary text-sm">calendar_month</span>
                                Crop Planner
                            </h3>
                            <button className="text-xs text-primary hover:underline">View Calendar</button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="bg-surface-darker rounded-lg p-3 border border-gray-700">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Wheat (Rabi)</h4>
                                        <span className="text-[10px] text-gray-400">Plot A • 2.5 Acres</span>
                                    </div>
                                    <span className="bg-blue-500/20 text-blue-300 text-[10px] px-2 py-0.5 rounded font-medium">
                                        Vegetative Stage
                                    </span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-1.5 mb-3">
                                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                                </div>
                                <div className="flex items-start gap-2 bg-alert-yellow/10 border border-alert-yellow/20 rounded p-2">
                                    <span className="material-icons text-alert-yellow text-sm mt-0.5">warning</span>
                                    <div>
                                        <p className="text-xs text-alert-yellow font-semibold">Fertilizer Due</p>
                                        <p className="text-[10px] text-gray-400">
                                            Urea application due in 3 days. Prepare 50kg bags.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-surface-darker rounded-lg p-3 border border-gray-700">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Mustard</h4>
                                        <span className="text-[10px] text-gray-400">Plot B • 1.2 Acres</span>
                                    </div>
                                    <span className="bg-green-500/20 text-green-300 text-[10px] px-2 py-0.5 rounded font-medium">
                                        Flowering Stage
                                    </span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-1.5 mb-3">
                                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '70%' }}></div>
                                </div>
                                <div className="flex items-start gap-2 bg-gray-800/50 rounded p-2 border border-gray-700/50">
                                    <span className="material-icons text-gray-400 text-sm mt-0.5">water_drop</span>
                                    <div>
                                        <p className="text-xs text-gray-300 font-semibold">Irrigation</p>
                                        <p className="text-[10px] text-gray-500">
                                            Scheduled for next Monday based on weather.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 2: Satellite Health */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface-dark rounded-xl border border-gray-800 shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-surface-darker">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <span className="material-icons text-primary text-sm">satellite_alt</span>
                                Satellite Health
                            </h3>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Updated 2 hrs ago
                            </span>
                        </div>
                        <div className="relative flex-1 bg-black min-h-[300px] overflow-hidden">
                            <img
                                alt="Farm satellite map"
                                className="w-full h-full object-cover opacity-60"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAukU0M1s169pp2HYaK8RJdogCvTGZmd2xzIdSQBSgqmTbIxQU-L5294lBjSRI3UFiExm7P3APRNfA4jsz3UK4VcgISRHJHPp7ITOCdTrEo9d07mUgly-EarSoBHqeyvhsXhzlmiyCpKNzyVvmriI7wT2JKWhYgfNHgH_4ollLLljXbSi1f7RnIqooNowxv9x2LZjQe_sc3jjzc4QvAj3-9F1YJoFSk7B0nC1WoeSeQ9Vi0UOVNd7IyY_RoWs5Gb32CcOAahFmqCRol"
                            />
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(17,212,82,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(17,212,82,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                            <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 border-2 border-alert-red bg-alert-red/20 flex items-center justify-center cursor-pointer hover:bg-alert-red/30 transition-colors group">
                                <div className="bg-black/80 px-2 py-1 rounded text-white text-[10px] font-bold border border-alert-red opacity-0 group-hover:opacity-100 transition-opacity">
                                    Zone A: Water Stress
                                </div>
                            </div>

                            <div className="absolute bottom-1/4 right-1/4 w-1/4 h-1/4 border-2 border-primary bg-primary/20 flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-colors group">
                                <div className="bg-black/80 px-2 py-1 rounded text-white text-[10px] font-bold border border-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    Zone B: Healthy
                                </div>
                            </div>

                            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                                <button className="w-8 h-8 bg-surface-dark border border-gray-700 rounded text-white flex items-center justify-center hover:bg-gray-700 transition-colors">
                                    <span className="material-icons text-sm">add</span>
                                </button>
                                <button className="w-8 h-8 bg-surface-dark border border-gray-700 rounded text-white flex items-center justify-center hover:bg-gray-700 transition-colors">
                                    <span className="material-icons text-sm">remove</span>
                                </button>
                                <button className="w-8 h-8 bg-surface-dark border border-gray-700 rounded text-white flex items-center justify-center hover:bg-gray-700 transition-colors">
                                    <span className="material-icons text-sm">layers</span>
                                </button>
                            </div>
                        </div>
                        <div className="p-3 bg-surface-darker text-xs text-gray-400 border-t border-gray-800 flex justify-between items-center">
                            <span>
                                Analysis: <span className="text-white">NDVI Index</span>
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span> Low
                                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span> Med
                                <span className="w-2 h-2 bg-primary rounded-full"></span> High
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 3: Weather & Community */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Weather Card */}
                    <div className="bg-gradient-to-br from-[#1a3322] to-[#0f2216] rounded-xl border border-primary/20 p-4 text-white shadow-sm hover:border-primary/40 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-gray-400 font-medium">Ludhiana, Punjab</p>
                                <h3 className="text-3xl font-bold mt-1">28°C</h3>
                                <p className="text-sm text-gray-300 mt-1">Sunny, Clear Sky</p>
                            </div>
                            <span className="material-icons text-yellow-400 text-5xl">wb_sunny</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs text-gray-400">
                            <div className="flex flex-col items-center">
                                <span>Humidity</span>
                                <span className="text-white font-semibold">45%</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span>Wind</span>
                                <span className="text-white font-semibold">12 km/h</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span>Rain</span>
                                <span className="text-white font-semibold">0%</span>
                            </div>
                        </div>
                    </div>

                    {/* Community Talk */}
                    <div className="bg-surface-dark rounded-xl border border-gray-800 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <span className="material-icons text-primary text-sm">forum</span>
                                Community Talk
                            </h3>
                            <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                                Trending
                            </span>
                        </div>
                        <div className="p-4">
                            <div className="flex gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-xs text-white">
                                    SK
                                </div>
                                <div>
                                    <p className="text-sm text-white font-medium">New wheat variety DBW-187?</p>
                                    <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                                        Has anyone tried sowing DBW-187 in Punjab region this season? Looking for yield reports.
                                    </p>
                                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <span className="material-icons text-[10px]">thumb_up</span> 12
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-icons text-[10px]">chat_bubble</span> 5 replies
                                        </span>
                                        <span>2h ago</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-900 flex-shrink-0 flex items-center justify-center text-xs text-indigo-200">
                                    VJ
                                </div>
                                <div>
                                    <p className="text-sm text-white font-medium">DAP Shortage in local mandi</p>
                                    <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                                        Unable to find DAP at govt rates. Any alternate suggestions for basal dose?
                                    </p>
                                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <span className="material-icons text-[10px]">thumb_up</span> 28
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-icons text-[10px]">chat_bubble</span> 14 replies
                                        </span>
                                        <span>5h ago</span>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full mt-4 py-2 border border-gray-700 rounded-lg text-xs text-gray-300 hover:bg-gray-800 transition-colors">
                                View All Discussions
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Services */}
            <h3 className="text-lg font-semibold text-white mb-4">Quick Services</h3>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-8">
                {quickServices.map((service) => (
                    <Link
                        key={service.name}
                        href={service.href}
                        className="bg-surface-dark p-3 md:p-4 rounded-xl border border-gray-800 hover:border-primary/50 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group text-center h-28 md:h-32"
                    >
                        <span className="material-icons text-2xl md:text-3xl text-gray-400 group-hover:text-primary transition-colors">
                            {service.icon}
                        </span>
                        <span className="text-[10px] md:text-xs font-medium text-gray-300 group-hover:text-white leading-tight">
                            {service.name}
                        </span>
                    </Link>
                ))}
            </div>

            {/* Mobile/Tablet Only: Right Sidebar Content */}
            <div className="xl:hidden space-y-6 pt-6 border-t border-gray-800">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white text-lg">Notifications</h3>
                        <button className="text-xs text-primary hover:text-primary-600 transition-colors">Mark all read</button>
                    </div>
                    <div className="space-y-4">
                        {/* Storm Alert */}
                        <div className="bg-surface-darker rounded-lg p-3 border-l-4 border-alert-red relative hover:bg-black/20 transition-colors">
                            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-alert-red animate-pulse"></div>
                            <h4 className="text-sm font-bold text-white mb-1">Storm Alert</h4>
                            <p className="text-xs text-gray-400 mb-2">
                                Heavy rainfall predicted in your district for next 48 hours. Secure harvested crops.
                            </p>
                            <span className="text-[10px] text-gray-500">10 mins ago</span>
                        </div>

                        {/* Price Alert */}
                        <div className="bg-surface-darker rounded-lg p-3 border-l-4 border-primary relative hover:bg-black/20 transition-colors">
                            <h4 className="text-sm font-bold text-white mb-1">Price Alert: Wheat</h4>
                            <p className="text-xs text-gray-400 mb-2">
                                Wheat prices in Azadpur Mandi have risen by ₹50/quintal.
                            </p>
                            <span className="text-[10px] text-gray-500">2 hours ago</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-white text-sm mb-4">Farm Summary</h3>
                    <div className="space-y-3 bg-surface-dark p-4 rounded-xl border border-gray-800">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Total Land</span>
                            <span className="text-white font-medium">5.5 Acres</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Cultivated</span>
                            <span className="text-white font-medium">3.7 Acres</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Est. Yield Value</span>
                            <span className="text-primary font-medium">₹2,45,000</span>
                        </div>
                    </div>
                </div>

                {/* Extra padding at bottom for mobile scrolling */}
                <div className="h-16 md:h-0"></div>
            </div>
        </main>
    );
}
