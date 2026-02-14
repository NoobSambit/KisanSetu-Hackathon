export default function TrustStrip() {
    return (
        <section className="border-t border-gray-800 bg-surface-darker py-12">
            <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center md:justify-between items-center gap-8 text-center md:text-left">
                <div className="flex items-center gap-4 group">
                    <div className="p-3 bg-gray-800 rounded-full group-hover:bg-primary/20 transition-colors">
                        <span className="material-icons text-gray-500 text-3xl group-hover:text-primary transition-colors">lock</span>
                    </div>
                    <div>
                        <h5 className="text-white font-semibold text-lg">100% Private Data</h5>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Your farm data stays with you.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 group">
                    <div className="p-3 bg-gray-800 rounded-full group-hover:bg-primary/20 transition-colors">
                        <span className="material-icons text-gray-500 text-3xl group-hover:text-primary transition-colors">savings</span>
                    </div>
                    <div>
                        <h5 className="text-white font-semibold text-lg">Free for Farmers</h5>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Core features are always free.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 group">
                    <div className="p-3 bg-gray-800 rounded-full group-hover:bg-primary/20 transition-colors">
                        <span className="material-icons text-gray-500 text-3xl group-hover:text-primary transition-colors">signal_wifi_off</span>
                    </div>
                    <div>
                        <h5 className="text-white font-semibold text-lg">Works Offline</h5>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Access key data without internet.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
