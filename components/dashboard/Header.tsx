'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { logOut } from '@/lib/firebase/auth';

interface HeaderProps {
    onMenuToggle?: () => void;
}

export default function DashboardHeader({ onMenuToggle }: HeaderProps) {
    const { user } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        await logOut();
        router.push('/');
    };

    return (
        <header className="bg-surface-dark border-b border-primary/10 z-30 flex-none sticky top-0">
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onMenuToggle}
                        className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-surface-darker transition-colors"
                    >
                        <span className="material-icons">menu</span>
                    </button>
                    <Link className="flex items-center space-x-2" href="/dashboard">
                        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                            <span className="material-icons text-xl">agriculture</span>
                        </div>
                        <span className="self-center text-xl font-bold whitespace-nowrap text-white hidden sm:block">
                            Kisan<span className="text-primary">Setu</span>
                        </span>
                    </Link>
                    <div className="hidden md:flex items-center text-sm text-gray-400 border-l border-gray-700 pl-4 ml-4">
                        <span className="material-icons text-base mr-1">home</span>
                        <span>Dashboard</span>
                        <span className="mx-2">/</span>
                        <span className="text-white font-medium">{user?.name || 'Ram Kumar Singh'}</span>
                    </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-4">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-darker border border-primary/20 hover:border-primary/50 cursor-pointer transition-colors">
                        <span className="material-icons text-primary text-sm">translate</span>
                        <span className="text-sm font-medium text-white">Hindi</span>
                        <span className="material-icons text-gray-400 text-sm">expand_more</span>
                    </div>
                    <div className="relative">
                        <button className="p-2 rounded-lg hover:bg-surface-darker text-gray-400 hover:text-white transition-colors relative">
                            <span className="material-icons">notifications</span>
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-alert-red rounded-full"></span>
                        </button>
                    </div>
                    <div className="relative">
                        <div
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-green-300 flex items-center justify-center text-background-dark font-bold text-sm cursor-pointer border border-primary/20 hover:ring-2 hover:ring-primary/50 transition-all select-none"
                        >
                            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'RS'}
                        </div>

                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-surface-dark border border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden animate-slide-up origin-top-right">
                                <div className="px-4 py-3 border-b border-gray-800 bg-surface-darker/50">
                                    <p className="text-sm text-white font-bold truncate">{user?.name || 'Ram Kumar'}</p>
                                    <p className="text-xs text-gray-400 truncate">{user?.email || 'farmer@kisan.com'}</p>
                                </div>
                                <div className="py-1">
                                    <Link
                                        href="/farm-profile"
                                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-surface-darker hover:text-white transition-colors"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="material-icons text-sm">agriculture</span>
                                            Farm Profile
                                        </div>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left block px-4 py-2 text-sm text-alert-red hover:bg-surface-darker hover:text-red-400 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="material-icons text-sm">logout</span>
                                            Logout
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="border-t border-gray-800 relative z-20">
                <div className="ticker-wrap block">
                    <div className="ticker text-xs md:text-sm">
                        <div className="ticker__item">
                            <span className="text-primary">▲</span> Wheat: ₹2,450 (+25)
                        </div>
                        <div className="ticker__item">
                            <span className="text-alert-red">▼</span> Onion: ₹1,800 (-15)
                        </div>
                        <div className="ticker__item">
                            <span className="text-primary">▲</span> Soybean: ₹4,200 (+40)
                        </div>
                        <div className="ticker__item">
                            <span className="text-primary">▲</span> Mustard: ₹5,600 (+12)
                        </div>
                        <div className="ticker__item">
                            <span className="text-alert-red">▼</span> Tomato: ₹1,200 (-50)
                        </div>
                        <div className="ticker__item">
                            <span className="text-primary">▲</span> Cotton: ₹6,100 (+100)
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
