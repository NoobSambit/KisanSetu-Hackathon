export default function StatsBanner() {
    return (
        <div className="w-full bg-primary relative overflow-hidden text-white">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
            <div className="max-w-7xl mx-auto px-4 py-8 relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4">
                <div className="flex-1 text-center md:text-left min-w-[200px]">
                    <h3 className="text-3xl md:text-4xl font-bold mb-1">50,000+</h3>
                    <p className="text-primary-900 font-bold uppercase tracking-wide text-sm">Farmers Empowered</p>
                </div>

                {/* Divider for desktop */}
                <div className="hidden md:block w-px h-16 bg-white/20"></div>

                <div className="flex-1 text-center md:text-left min-w-[200px]">
                    <h3 className="text-3xl md:text-4xl font-bold mb-1">₹200Cr+</h3>
                    <p className="text-primary-900 font-bold uppercase tracking-wide text-sm">Crop Value Managed</p>
                </div>

                {/* Divider for desktop */}
                <div className="hidden md:block w-px h-16 bg-white/20"></div>

                <div className="flex-1 text-center md:text-left min-w-[200px]">
                    <h3 className="text-3xl md:text-4xl font-bold mb-1">120+</h3>
                    <p className="text-primary-900 font-bold uppercase tracking-wide text-sm">Districts Covered</p>
                </div>
            </div>
        </div>
    );
}
