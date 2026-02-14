import Link from 'next/link';

export default function LandingFooter() {
    return (
        <footer className="bg-background-dark border-t border-gray-800 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    <div className="lg:col-span-2">
                        <Link href="#" className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                                <span className="material-icons text-2xl">agriculture</span>
                            </div>
                            <span className="text-2xl font-bold text-white font-display">
                                Kisan<span className="text-primary">Setu</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 mb-8 max-w-sm leading-relaxed text-lg">
                            Bridging the gap between technology and Indian agriculture. Building a smarter future for our Annadatas.
                        </p>
                        <button className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors shadow-lg shadow-primary/20 w-full sm:w-auto transform hover:-translate-y-0.5">
                            Start Farming Smarter Today
                        </button>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6 text-lg">Product</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><Link href="/assistant" className="hover:text-primary transition-colors hover:pl-1 duration-200 block">AI Assistant</Link></li>
                            <li><Link href="#market" className="hover:text-primary transition-colors hover:pl-1 duration-200 block">Mandi Prices</Link></li>
                            <li><Link href="/weather" className="hover:text-primary transition-colors hover:pl-1 duration-200 block">Weather</Link></li>
                            <li><Link href="/soil-testing" className="hover:text-primary transition-colors hover:pl-1 duration-200 block">Soil Testing</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6 text-lg">Resources</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><Link href="/blog" className="hover:text-primary transition-colors hover:pl-1 duration-200 block">Blog</Link></li>
                            <li><Link href="/schemes" className="hover:text-primary transition-colors hover:pl-1 duration-200 block">Govt Schemes</Link></li>
                            <li><Link href="/crop-calendar" className="hover:text-primary transition-colors hover:pl-1 duration-200 block">Crop Calendar</Link></li>
                            <li><Link href="/help" className="hover:text-primary transition-colors hover:pl-1 duration-200 block">Help Center</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6 text-lg">Company</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><Link href="/about" className="hover:text-primary transition-colors hover:pl-1 duration-200 block">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors hover:pl-1 duration-200 block">Contact</Link></li>
                            <li><Link href="/privacy" className="hover:text-primary transition-colors hover:pl-1 duration-200 block">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-primary transition-colors hover:pl-1 duration-200 block">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm font-medium">
                        © 2023 KisanSetu Technologies Pvt Ltd. All rights reserved.
                    </p>
                    <div className="flex space-x-6">
                        <Link href="#" className="text-gray-500 hover:text-white transition-colors transform hover:scale-110">
                            <span className="material-icons text-xl">facebook</span>
                        </Link>
                        <Link href="#" className="text-gray-500 hover:text-white transition-colors transform hover:scale-110">
                            <span className="material-icons text-xl">smart_display</span>
                        </Link>
                        <Link href="#" className="text-gray-500 hover:text-white transition-colors transform hover:scale-110">
                            <span className="material-icons text-xl">alternate_email</span>
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
