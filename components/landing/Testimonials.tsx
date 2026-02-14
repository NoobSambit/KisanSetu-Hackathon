const TESTIMONIALS = [
    {
        initials: 'RS',
        color: 'bg-indigo-900 text-indigo-300',
        name: 'Ramesh Singh',
        location: 'Ludhiana, Punjab',
        quote: '"The wheat price prediction helped me hold my stock for 2 weeks. I sold at a 15% higher rate thanks to KisanSetu."',
    },
    {
        initials: 'LM',
        color: 'bg-pink-900 text-pink-300',
        name: 'Lakshmi Menon',
        location: 'Madurai, Tamil Nadu',
        quote: '"Voice search in Tamil is a blessing. I identified a pest in my paddy field just by uploading a photo."',
    },
    {
        initials: 'VP',
        color: 'bg-yellow-900 text-yellow-300',
        name: 'Vijay Patel',
        location: 'Anand, Gujarat',
        quote: '"Getting weather alerts 2 days before the storm saved my harvest. This app is a true companion."',
    },
];

export default function Testimonials() {
    return (
        <section className="py-20 bg-background-dark" id="community">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-center mb-12 text-white font-display">
                    Stories from the Field
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {TESTIMONIALS.map((t, idx) => (
                        <div key={idx} className="bg-surface-dark p-8 rounded-xl border border-gray-800 hover:border-gray-700 transition-all hover:scale-[1.02]">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-12 h-12 ${t.color} rounded-full flex items-center justify-center font-bold text-xl shadow-inner`}>
                                    {t.initials}
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-lg">{t.name}</h4>
                                    <p className="text-sm text-gray-500">{t.location}</p>
                                </div>
                            </div>
                            <p className="text-gray-300 italic leading-relaxed text-lg">
                                {t.quote}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
