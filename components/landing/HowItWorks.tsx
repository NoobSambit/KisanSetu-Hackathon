export default function HowItWorks() {
    const steps = [
        {
            icon: 'person_add',
            title: 'Profile',
            desc: 'Register and add your farm details.',
        },
        {
            icon: 'mic',
            title: 'Ask',
            desc: 'Voice your query or upload crop photos.',
        },
        {
            icon: 'lightbulb',
            title: 'Advice',
            desc: 'Get instant AI-driven solutions.',
        },
        {
            icon: 'check_circle',
            title: 'Action',
            desc: 'Implement and track better yields.',
        },
    ];

    return (
        <section className="py-20 bg-background-dark border-t border-gray-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-surface-dark via-background-dark to-background-dark opacity-50 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4 text-white font-display">How KisanSetu Works</h2>
                    <p className="text-gray-400 text-lg">From setup to success in 4 simple steps.</p>
                </div>

                <div className="relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-800 -translate-y-1/2 z-0"></div>
                    <div className="hidden md:block absolute top-1/2 left-0 w-3/4 h-0.5 bg-gradient-to-r from-primary to-transparent -translate-y-1/2 z-0"></div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
                        {steps.map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center text-center group">
                                <div className="relative mb-6 transform transition-transform duration-300 group-hover:scale-110">
                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className={`w-20 h-20 rounded-full bg-surface-dark border-2 ${idx === 3 ? 'border-gray-600 group-hover:border-primary' : 'border-primary'} flex items-center justify-center relative z-10 shadow-lg shadow-black/20`}>
                                        <span className={`material-icons text-3xl ${idx === 3 ? 'text-gray-400 group-hover:text-primary' : 'text-primary'}`}>{step.icon}</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                                <p className="text-sm text-gray-400 max-w-[200px] leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
