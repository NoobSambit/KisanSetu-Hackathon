import React from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { ChevronDown, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface AssistantHeaderProps {
    language: string;
    setLanguage: (lang: string) => void;
}

const VOICE_LANGUAGE_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'hi-IN', label: 'Hindi (हिंदी)' },
    { value: 'en-IN', label: 'English' },
    { value: 'mr-IN', label: 'Marathi' },
    { value: 'bn-IN', label: 'Bengali' },
    { value: 'ta-IN', label: 'Tamil' },
    { value: 'te-IN', label: 'Telugu' },
    { value: 'gu-IN', label: 'Gujarati' },
    { value: 'kn-IN', label: 'Kannada' },
    { value: 'ml-IN', label: 'Malayalam' },
    { value: 'pa-IN', label: 'Punjabi' },
];

export default function AssistantHeader({ language, setLanguage }: AssistantHeaderProps) {
    const { user } = useAuth();

    return (
        <header className="fixed top-0 left-0 right-0 bg-surface-dark/80 backdrop-blur-md border-b border-white/5 z-30 flex-none h-[72px]">
            <div className="flex items-center justify-between px-4 h-full max-w-5xl mx-auto w-full">
                <div className="flex items-center space-x-4">
                    <Link className="flex items-center space-x-2" href="/dashboard">
                        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                            <span className="material-icons text-xl">agriculture</span>
                        </div>
                        <span className="self-center text-xl font-bold whitespace-nowrap text-white hidden sm:block">
                            Kisan<span className="text-primary">Setu</span>
                        </span>
                    </Link>
                    <div className="hidden md:flex items-center text-sm text-gray-400 border-l border-gray-700 pl-4 ml-4">
                        <span className="material-icons text-base mr-1">chat</span>
                        <span>AI Assistant</span>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="relative group hidden md:block">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="appearance-none bg-white/5 border border-white/10 hover:bg-white/10 text-white py-1.5 pl-9 pr-8 rounded-full text-sm font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                        >
                            {VOICE_LANGUAGE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>
                            ))}
                        </select>
                        <span className="material-icons text-primary text-sm absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">translate</span>
                        <span className="material-icons text-gray-400 text-sm absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                    </div>

                    <Link href="/farm-profile">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-green-300 flex items-center justify-center text-background-dark font-bold text-sm cursor-pointer border border-white/20 hover:scale-105 transition-transform">
                            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'RS'}
                        </div>
                    </Link>
                </div>
            </div>
        </header>
    );
}
