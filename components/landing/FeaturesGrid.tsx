
const FEATURES = [
    {
        icon: 'psychology',
        title: 'AI Assistant',
        desc: 'Instant answers to farming queries in your local language.',
    },
    {
        icon: 'satellite_alt',
        title: 'Satellite Health',
        desc: 'Monitor crop health and stress from space imagery.',
    },
    {
        icon: 'storefront',
        title: 'Market Intelligence',
        desc: 'Real-time mandi prices and demand forecasting.',
    },
    {
        icon: 'cloud',
        title: 'Weather Alerts',
        desc: 'Hyper-local forecasts to plan sowing and harvesting.',
    },
    {
        icon: 'science',
        title: 'Soil Testing',
        desc: 'Digital analysis and fertilizer recommendations.',
    },
    {
        icon: 'pest_control',
        title: 'Pest Detection',
        desc: 'Click a photo to identify pests and get remedies.',
    },
    {
        icon: 'account_balance',
        title: 'Govt Schemes',
        desc: 'Eligibility checks and application assistance.',
    },
    {
        icon: 'forum',
        title: 'Community',
        desc: 'Connect with experts and other farmers nearby.',
    },
];

export default function FeaturesGrid() {
    return (
        <section className="py-20 bg-background-dark relative" id="features">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white font-display">
                        Everything a Farmer Needs
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Advanced technology simplified for the field.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {FEATURES.map((feature, idx) => (
                        <div
                            key={idx}
                            className="group p-6 bg-surface-dark rounded-xl border border-gray-800 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 transform hover:-translate-y-1"
                        >
                            <div className="w-12 h-12 rounded-lg bg-surface-darker border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors text-primary shadow-sm">
                                <span className="material-icons">{feature.icon}</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-white">
                                {feature.title}
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
