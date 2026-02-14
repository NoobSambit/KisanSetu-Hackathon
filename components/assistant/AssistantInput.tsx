import React, { useRef, useEffect } from 'react';


interface AssistantInputProps {
    inputValue: string;
    setInputValue: (val: string) => void;
    onSend: () => void;
    onMicClick: () => void;
    isLoading: boolean;
}

export default function AssistantInput({ inputValue, setInputValue, onSend, onMicClick, isLoading }: AssistantInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [inputValue]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <div className="absolute bottom-6 w-full px-4 max-w-4xl z-20 left-1/2 -translate-x-1/2">
            <div className="glass-input bg-surface-darker/80 backdrop-blur-md rounded-full p-2 flex items-center shadow-2xl shadow-black/50 border border-white/10 ring-1 ring-white/5 relative">
                <button
                    onClick={onMicClick}
                    className="w-12 h-12 bg-alert-red hover:bg-red-600 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/20 transition-all transform hover:scale-105 active:scale-95 group relative overflow-hidden"
                >
                    <span className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-0 group-hover:opacity-100"></span>
                    <span className="material-icons text-2xl">mic</span>
                </button>

                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className="bg-transparent border-0 focus:ring-0 text-white placeholder-gray-400 w-full resize-none py-3 px-4 max-h-32 text-base custom-scrollbar disabled:opacity-50"
                    placeholder="Ask in Hindi, Punjabi, Marathi..."
                    rows={1}
                />

                <div className="flex items-center gap-2 pr-2">
                    <button className="p-2 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-white/5">
                        <span className="material-icons">image</span>
                    </button>
                    <button
                        onClick={onSend}
                        disabled={!inputValue.trim() || isLoading}
                        className="w-10 h-10 bg-primary hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20 transition-all transform hover:scale-105"
                    >
                        {isLoading ? <span className="material-icons animate-spin">refresh</span> : <span className="material-icons text-xl">send</span>}
                    </button>
                </div>
            </div>
            <p className="text-center text-[10px] text-gray-500 mt-2">AI can make mistakes. Please verify critical farming decisions.</p>
        </div>
    );
}
