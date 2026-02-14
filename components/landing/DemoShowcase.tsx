export default function DemoShowcase() {
    return (
        <section className="py-20 bg-stone-dark overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row gap-12 items-center">
                    {/* Left: Voice AI Demo */}
                    <div className="w-full lg:w-1/2 space-y-8">
                        <div className="inline-flex items-center gap-2 text-primary font-semibold tracking-wide uppercase text-sm">
                            <span className="w-8 h-0.5 bg-primary"></span>
                            Voice-First Technology
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white font-display leading-tight">
                            Just Speak. We Understand.
                        </h2>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            No typing needed. Interact with KisanSetu in your native language just like talking to a friend.
                        </p>

                        {/* Voice Animation & Languages */}
                        <div className="bg-surface-dark p-6 rounded-2xl border border-gray-800 relative shadow-2xl">
                            {/* Chat Bubble */}
                            <div className="flex gap-4 mb-8">
                                <div className="w-12 h-12 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center ring-2 ring-gray-600">
                                    <span className="material-icons text-gray-300">person</span>
                                </div>
                                <div className="bg-surface-darker border border-gray-700 p-4 rounded-2xl rounded-tl-none max-w-sm">
                                    <p className="text-gray-100 text-lg font-medium leading-relaxed font-serif">
                                        "गेहूँ की फसल में पीलापन आ रहा है, उपाय बताएं?"
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2 uppercase tracking-wide font-semibold">
                                        English: Wheat crop is turning yellow, suggest remedies?
                                    </p>
                                </div>
                            </div>

                            {/* Mic Animation */}
                            <div className="flex items-center justify-center py-8">
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    {/* Ripple Effect */}
                                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75"></div>
                                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse delay-75"></div>

                                    {/* Button */}
                                    <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center shadow-lg shadow-primary/30 cursor-pointer hover:scale-110 transition-transform duration-300">
                                        <span className="material-icons text-white text-3xl">mic</span>
                                    </div>
                                </div>
                            </div>

                            {/* Language Grid */}
                            <div className="mt-8 pt-6 border-t border-gray-800">
                                <p className="text-xs text-center text-gray-500 mb-4 uppercase tracking-widest font-bold">Available in 13+ Languages</p>
                                <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400 font-medium">
                                    {['English', 'हिन्दी', 'मराठी', 'ਪੰਜਾਬੀ', 'ગુજરાતી', 'தமிழ்', 'తెలుగు', 'ಕನ್ನಡ', 'മലയാളം'].map((lang, i) => (
                                        <span
                                            key={i}
                                            className={`px-3 py-1.5 bg-gray-800 rounded-md border border-gray-700 hover:border-gray-500 transition-colors cursor-default ${lang === 'हिन्दी' ? 'text-primary border-primary/30 bg-primary/5' : ''}`}
                                        >
                                            {lang}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Satellite Map */}
                    <div className="w-full lg:w-1/2 relative">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>

                        <div className="bg-surface-dark rounded-2xl overflow-hidden border border-gray-800 shadow-2xl relative transform rotate-1 hover:rotate-0 transition-transform duration-500">
                            {/* Map UI Overlay */}
                            <div className="absolute top-4 left-4 z-20 bg-surface-dark/90 backdrop-blur-md border border-gray-700 rounded-lg p-3 shadow-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">NDVI Index</span>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        <span className="text-xs font-medium text-gray-300">Healthy</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <span className="text-xs font-medium text-gray-300">Stressed</span>
                                    </div>
                                </div>
                            </div>

                            <img
                                className="w-full h-96 object-cover opacity-80 grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAukU0M1s169pp2HYaK8RJdogCvTGZmd2xzIdSQBSgqmTbIxQU-L5294lBjSRI3UFiExm7P3APRNfA4jsz3UK4VcgISRHJHPp7ITOCdTrEo9d07mUgly-EarSoBHqeyvhsXhzlmiyCpKNzyVvmriI7wT2JKWhYgfNHgH_4ollLLljXbSi1f7RnIqooNowxv9x2LZjQe_sc3jjzc4QvAj3-9F1YJoFSk7B0nC1WoeSeQ9Vi0UOVNd7IyY_RoWs5Gb32CcOAahFmqCRol"
                                alt="Satellite view of diverse agricultural fields"
                            />

                            {/* Overlay Grid UI */}
                            <div
                                className="absolute inset-0 opacity-30 pointer-events-none"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='rgba(17, 212, 82, 0.3)' stroke-width='1'/%3E%3C/svg%3E")`
                                }}
                            ></div>

                            {/* Selected Plot Highlight */}
                            <div className="absolute top-1/3 left-1/3 w-32 h-24 border-2 border-primary bg-primary/10 shadow-[0_0_15px_rgba(17,212,82,0.3)] flex items-center justify-center animate-pulse-slow">
                                <div className="bg-black/80 backdrop-blur text-white text-[10px] uppercase font-bold px-2 py-1 rounded border border-primary/30">
                                    Plot #42
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
