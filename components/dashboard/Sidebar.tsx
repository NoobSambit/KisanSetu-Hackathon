'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function DashboardSidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    const navItems = [
        { name: 'Overview', icon: 'dashboard', href: '/dashboard' },
        { name: 'My Crops', icon: 'grass', href: '/my-crops' },
        { name: 'Mandi Prices', icon: 'storefront', href: '/market-prices' },
        { name: 'Soil Health', icon: 'science', href: '/soil-health' },
        { name: 'Weather', icon: 'cloud', href: '/weather' },
        { name: 'Community', icon: 'people', href: '/community', badge: 3 },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                ></div>
            )}

            <aside className={`
                fixed md:static inset-y-0 left-0 z-50 w-64 bg-surface-dark border-r border-primary/10 
                flex-col justify-between py-6 transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0 flex' : '-translate-x-full md:translate-x-0 md:flex'}
            `}>
                <div className="px-4 mb-6 md:hidden flex justify-between items-center">
                    <span className="text-lg font-bold text-white">Menu</span>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <nav className="space-y-2 px-2 flex-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onClose}
                                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors group ${isActive
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-gray-400 hover:bg-surface-darker hover:text-white'
                                    }`}
                            >
                                <span className={`material-icons ${!isActive && 'group-hover:text-primary transition-colors'}`}>
                                    {item.icon}
                                </span>
                                <span className="font-medium">{item.name}</span>
                                {item.badge && (
                                    <span className="ml-auto bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
                <div className="px-4 mt-auto">
                    <div className="bg-surface-darker rounded-xl p-4 border border-gray-800">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-2">My Plan</p>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">Kisan Pro</span>
                            <span className="bg-primary text-background-dark text-[10px] font-bold px-1.5 py-0.5 rounded">
                                ACTIVE
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">Valid until Dec 2024</p>
                        <button className="w-full py-1.5 bg-gray-800 hover:bg-gray-700 text-xs text-white rounded transition-colors">
                            Manage
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
