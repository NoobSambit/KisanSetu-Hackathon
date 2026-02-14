import React from 'react';

export default function DashboardRightSidebar() {
    return (
        <aside className="hidden xl:block w-80 bg-surface-dark border-l border-primary/10 flex-none overflow-y-auto custom-scrollbar p-4">
            <div className="flex items-center justify-between mb-6">
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

                {/* Soil Test */}
                <div className="bg-surface-darker rounded-lg p-3 border-l-4 border-yellow-500 relative hover:bg-black/20 transition-colors">
                    <h4 className="text-sm font-bold text-white mb-1">Soil Test Ready</h4>
                    <p className="text-xs text-gray-400 mb-2">
                        Your soil sample #4492 report is ready. View recommendations.
                    </p>
                    <button className="mt-2 text-xs bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors">
                        View Report
                    </button>
                    <div className="mt-2 text-[10px] text-gray-500">Yesterday</div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-800">
                <h3 className="font-bold text-white text-sm mb-4">Farm Summary</h3>
                <div className="space-y-3">
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
        </aside>
    );
}
