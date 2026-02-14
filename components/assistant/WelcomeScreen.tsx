import React from 'react';
import { useAuth } from '@/lib/context/AuthContext';

interface WelcomeScreenProps {
    onSuggestionClick: (query: string) => void;
}

const PRESET_QUERIES = [
    {
        icon: 'wb_sunny',
        color: 'blue',
        title: 'Aaj ka mausam?',
        subtitle: 'Weather forecast today',
        query: 'Aaj ka weather kaisa rahega and irrigation advice?'
    },
    {
        icon: 'storefront',
        color: 'green',
        title: 'Tomato mandi prices?',
        subtitle: 'Market rates nearby',
        query: 'Tomato ka aas paas mandi price kya hai?'
    },
    {
        icon: 'pest_control',
        color: 'yellow',
        title: 'Keeda lag gaya hai?',
        subtitle: 'Identify pest/disease',
        query: 'Fasal mein keeda laga hai, kaise thik karu?'
    },
    {
        icon: 'grass',
        color: 'purple',
        title: 'Urea kab daalna hai?',
        subtitle: 'Fertilizer schedule',
        query: 'Gehu mein urea kab aur kitna daalna chahiye?'
    }
];

export default function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
    const { user } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 animate-fade-in-up w-full pt-10">
            <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-emerald-700 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-4 animate-blob">
                    <span className="material-icons text-5xl text-white">auto_awesome</span>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-surface-darker text-xs font-bold px-2 py-0.5 rounded-full border border-gray-700 text-primary">BETA</div>
            </div>

            <div className="text-center space-y-2 px-4">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    नमस्ते {user?.name ? user.name.split(' ')[0] : 'Ram Kumar'}!
                </h1>
                <p className="text-lg text-gray-400 font-light">Mai aapki kya sahayata kar sakta hoon?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-8 px-4">
                {PRESET_QUERIES.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSuggestionClick(item.query)}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all text-left group"
                    >
                        <div className={`w-10 h-10 rounded-full bg-${item.color}-500/20 flex items-center justify-center text-${item.color}-400 group-hover:scale-110 transition-transform`}>
                            <span className="material-icons">{item.icon}</span>
                        </div>
                        <div>
                            <p className="font-medium text-white">{item.title}</p>
                            <p className="text-xs text-gray-400">{item.subtitle}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
