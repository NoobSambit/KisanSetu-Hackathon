export default function DetailedFeatures() {
    return (
        <section className="py-20 bg-stone-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* Price Prediction Card */}
                    <div className="bg-surface-dark rounded-xl p-6 border border-gray-800 hover:border-primary/30 transition-all group hover:shadow-lg hover:shadow-primary/5 h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                                    Price Forecast
                                </p>
                                <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">Wheat (गेहूँ)</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Mandi: Azadpur, Delhi</p>
                            </div>
                            <div className="bg-surface-darker p-2.5 rounded-lg border border-gray-700 group-hover:border-primary/30 transition-colors">
                                <span className="material-icons text-yellow-500">grass</span>
                            </div>
                        </div>

                        <div className="flex items-end gap-3 mb-6">
                            <span className="text-4xl font-bold text-white tracking-tight">₹2,450</span>
                            <div className="flex items-center text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-md text-sm mb-1 border border-primary/20">
                                <span className="material-icons text-sm mr-1">trending_up</span>
                                +11%
                            </div>
                        </div>

                        <div className="h-24 w-full bg-surface-darker rounded-lg relative overflow-hidden mb-4 border border-gray-800">
                            {/* Trend Line SVG */}
                            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 300 100">
                                <defs>
                                    <linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: '#11d452', stopOpacity: 0.2 }} />
                                        <stop offset="100%" style={{ stopColor: '#11d452', stopOpacity: 0 }} />
                                    </linearGradient>
                                </defs>
                                <path
                                    d="M0,80 Q30,70 60,60 T120,50 T180,30 T240,20 T300,10 V100 H0 Z"
                                    fill="url(#chartGradient)"
                                />
                                <path
                                    d="M0,80 Q30,70 60,60 T120,50 T180,30 T240,20 T300,10"
                                    fill="none"
                                    stroke="#11d452"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Forecast: Price expected to rise over next 30 days due to high demand.
                        </p>
                    </div>

                    {/* WhatsApp Integration */}
                    <div className="bg-surface-dark rounded-xl p-6 border border-gray-800 hover:border-primary/30 transition-all flex flex-col items-center group hover:shadow-lg hover:shadow-primary/5 h-full justify-between">
                        <div className="w-full flex justify-between items-center mb-6">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                                Easy Access
                            </p>
                            <span className="material-icons text-green-500 text-2xl group-hover:scale-110 transition-transform">chat</span>
                        </div>

                        <div className="w-full max-w-[280px] bg-black rounded-[2rem] border-4 border-gray-800 p-2 relative shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-300">
                            <div className="bg-[#0b141a] h-64 w-full rounded-2xl overflow-hidden flex flex-col">
                                {/* Chat Header */}
                                <div className="bg-[#202c33] p-3 flex items-center gap-3 border-b border-gray-800">
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/10">KS</div>
                                    <div className="text-white text-xs font-medium">KisanSetu AI</div>
                                </div>

                                {/* Chat Body */}
                                <div className="flex-1 p-3 space-y-4 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-5 bg-repeat pointer-events-none"></div>

                                    <div className="bg-[#202c33] p-2.5 rounded-xl rounded-tl-none self-start max-w-[85%] text-[11px] text-white relative z-10 shadow-sm leading-relaxed">
                                        Namaste! How can I help your farm today?
                                    </div>
                                    <div className="bg-[#005c4b] p-2.5 rounded-xl rounded-tr-none self-end ml-auto max-w-[85%] text-[11px] text-white relative z-10 shadow-sm leading-relaxed">
                                        Mandi price for Onion?
                                    </div>
                                    <div className="bg-[#202c33] p-2.5 rounded-xl rounded-tl-none self-start max-w-[85%] text-[11px] text-white relative z-10 shadow-sm leading-relaxed">
                                        Today's Onion price in Nashik: ₹1800/quintal. 🟢 Stable.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-white font-bold text-lg mb-1">Available on WhatsApp</p>
                            <div className="inline-flex items-center gap-1 text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                                <span className="material-icons text-green-500 text-sm">call</span>
                                Save +91 98765 43210
                            </div>
                        </div>
                    </div>

                    {/* Document Assistant */}
                    <div className="bg-surface-dark rounded-xl p-6 border border-gray-800 hover:border-primary/30 transition-all group hover:shadow-lg hover:shadow-primary/5 h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                                    Document Assistant
                                </p>
                                <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">Paper to Digital</h3>
                            </div>
                            <div className="bg-surface-darker p-2.5 rounded-lg border border-gray-700 group-hover:border-primary/30 transition-colors">
                                <span className="material-icons text-blue-400">description</span>
                            </div>
                        </div>

                        <div className="relative h-56 w-full bg-surface-darker rounded-xl border border-gray-700 p-4 overflow-hidden flex items-center justify-center cursor-pointer group/doc">
                            {/* Before: Paper */}
                            <div className="absolute left-6 top-8 w-28 h-36 bg-gray-100 rounded-sm rotate-[-6deg] shadow-lg flex flex-col p-3 items-center justify-start transform transition-transform duration-500 group-hover/doc:rotate-[-12deg] group-hover/doc:translate-x-[-15px] border border-gray-300">
                                <div className="w-full h-1.5 bg-gray-300 mb-2 rounded-full"></div>
                                <div className="w-full h-1.5 bg-gray-300 mb-2 rounded-full"></div>
                                <div className="w-2/3 h-1.5 bg-gray-300 mb-2 rounded-full self-start"></div>
                                <div className="mt-auto w-8 h-8 rounded-full bg-gray-300 self-center"></div>
                                <p className="text-[7px] text-gray-600 mt-2 font-bold text-center tracking-tight">PM-KISAN FORM</p>
                            </div>

                            {/* Arrow */}
                            <div className="absolute z-10 bg-primary rounded-full p-2.5 shadow-xl ring-4 ring-surface-darker transform transition-all duration-300 group-hover/doc:scale-110">
                                <span className="material-icons text-white">arrow_forward</span>
                            </div>

                            {/* After: Digital */}
                            <div className="absolute right-6 top-8 w-28 h-36 bg-[#1e293b] rounded-md rotate-[6deg] shadow-2xl border border-primary/40 flex flex-col p-3 transform transition-transform duration-500 group-hover/doc:rotate-[12deg] group-hover/doc:translate-x-[15px]">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-icons text-primary text-[10px]">check_circle</span>
                                    <div className="h-1.5 w-12 bg-gray-600 rounded-full"></div>
                                </div>
                                <div className="h-1.5 w-full bg-gray-700 rounded-full mb-2"></div>
                                <div className="h-1.5 w-full bg-gray-700 rounded-full mb-2"></div>
                                <div className="mt-auto w-full py-1.5 bg-primary text-[8px] text-center text-white font-bold rounded shadow-lg shadow-primary/20">
                                    DIGITIZED
                                </div>
                            </div>
                        </div>
                        <p className="mt-6 text-sm text-gray-400 leading-relaxed">
                            Scan and digitize PM-KISAN, Soil Health Cards, and Land Records instantly.
                        </p>
                    </div>

                </div>
            </div>
        </section>
    );
}
