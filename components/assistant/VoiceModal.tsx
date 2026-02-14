import React from 'react';


interface VoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    isListening: boolean;
    transcript: string;
    onStop: () => void;
}

export default function VoiceModal({ isOpen, onClose, isListening, transcript, onStop }: VoiceModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in">
            <div className="w-full max-w-lg bg-surface-dark border-t border-x border-gray-700 rounded-t-3xl p-8 pb-12 shadow-2xl animate-slide-up relative overflow-hidden">
                <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    onClick={onClose}
                >
                    <span className="material-icons">close</span>
                </button>

                <div className="flex flex-col items-center justify-center space-y-8">
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-white mb-1">
                            {isListening ? "Listening..." : "Processing..."}
                        </h3>
                        <p className="text-sm text-gray-400">Speak now in your language</p>
                    </div>

                    <div className="relative cursor-pointer" onClick={onStop}>
                        <div className="absolute inset-0 bg-alert-red rounded-full animate-ping opacity-20 h-24 w-24"></div>
                        <div className="absolute inset-0 bg-alert-red rounded-full animate-pulse opacity-40 h-24 w-24 delay-75"></div>
                        <button className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.4)] relative z-10 transition-transform active:scale-95">
                            <span className="material-icons text-4xl">mic</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5 h-12">
                        {[...Array(9)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-1.5 bg-red-500 rounded-full ${isListening ? 'animate-wave' : 'h-1.5'}`}
                                style={{ animationDelay: `${i * 0.05}s` }}
                            ></div>
                        ))}
                    </div>

                    <div className="text-center min-h-[3rem]">
                        <p className="text-white text-lg font-medium">{transcript || "..."}</p>
                        <p className="text-gray-500 text-sm mt-2">Tap microphone to stop</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
