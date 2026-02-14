import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '@/types';
import { Play, Pause, ThumbsUp, ThumbsDown, Check } from 'lucide-react';

interface MessageListProps {
    messages: ChatMessage[];
    isPlaying: boolean;
    activeMessageId: string | null;
    onPlayAudio: (message: ChatMessage) => void;
    onStopAudio: () => void;
}

export default function MessageList({
    messages,
    isPlaying,
    activeMessageId,
    onPlayAudio,
    onStopAudio
}: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="w-full flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pt-24 pb-32 max-w-5xl mx-auto">
            {messages.map((message) => {
                const isUser = message.role === 'user';
                const isPlayingThis = isPlaying && activeMessageId === message.id;

                if (isUser) {
                    return (
                        <div key={message.id} className="flex justify-end mb-4 animate-fade-in-up">
                            <div className="max-w-[80%] md:max-w-[60%]">
                                <div className="bg-primary hover:bg-emerald-600 transition-colors text-white rounded-2xl rounded-tr-none p-4 shadow-lg shadow-primary/10">
                                    <p className="text-base whitespace-pre-wrap">{message.content}</p>
                                </div>
                                <div className="flex items-center justify-end mt-1 space-x-2">
                                    <span className="text-[10px] text-gray-400">
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="material-icons text-[12px] text-primary">done_all</span>
                                </div>
                            </div>
                        </div>
                    );
                }

                return (
                    <div key={message.id} className="flex justify-start mb-6 animate-fade-in-up">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-700 flex-shrink-0 flex items-center justify-center mr-3 mt-1 shadow-lg shadow-primary/20">
                            <span className="material-icons text-sm text-white">auto_awesome</span>
                        </div>
                        <div className="max-w-[85%] md:max-w-[65%]">
                            <div className="glass-panel text-gray-100 rounded-2xl rounded-tl-none p-5 shadow-lg relative bg-surface-dark/60 backdrop-blur-md border border-white/10">
                                {message.content === 'Thinking...' ? (
                                    <div className="h-6 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 mb-3 bg-white/5 p-2 rounded-lg border border-white/5">
                                            <button
                                                onClick={() => isPlayingThis ? onStopAudio() : onPlayAudio(message)}
                                                className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-primary shadow-sm hover:scale-105 transition-transform"
                                            >
                                                {isPlayingThis ? <Pause className="w-4 h-4 text-primary fill-current" /> : <Play className="w-4 h-4 text-primary fill-current ml-0.5" />}
                                            </button>
                                            <div className="h-8 flex items-center gap-0.5">
                                                {isPlayingThis ? (
                                                    <>
                                                        <div className="w-1 bg-primary/60 h-3 rounded-full animate-wave"></div>
                                                        <div className="w-1 bg-primary/60 h-5 rounded-full animate-wave delay-75"></div>
                                                        <div className="w-1 bg-primary/60 h-4 rounded-full animate-wave delay-100"></div>
                                                        <div className="w-1 bg-primary/60 h-6 rounded-full animate-wave delay-150"></div>
                                                        <div className="w-1 bg-primary/60 h-3 rounded-full animate-wave delay-200"></div>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Play Audio</span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-400 ml-auto">AI Response</span>
                                        </div>

                                        <div className="prose prose-invert prose-sm max-w-none text-gray-100 leading-relaxed">
                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                        </div>

                                        {/* Example actions wrapper - functionality to be hooked up later if needed */}
                                        <div className="mt-3 flex gap-2 flex-wrap">
                                            <button className="px-3 py-1.5 rounded-full bg-surface-dark border border-gray-700 text-xs text-gray-300 hover:text-white hover:border-gray-500 transition-colors">
                                                Check Details
                                            </button>
                                            <button className="px-3 py-1.5 rounded-full bg-surface-dark border border-gray-700 text-xs text-gray-300 hover:text-white hover:border-gray-500 transition-colors">
                                                Ask More
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {message.content !== 'Thinking...' && (
                                <div className="flex items-center mt-1 space-x-2 pl-1">
                                    <span className="text-[10px] text-gray-500">Powered by Gemini • {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <button className="text-gray-500 hover:text-white"><ThumbsUp className="w-3 h-3" /></button>
                                    <button className="text-gray-500 hover:text-white"><ThumbsDown className="w-3 h-3" /></button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
    );
}
