'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';

export default function LandingNavbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isAuthenticated } = useAuth();

    return (
        <nav className="fixed w-full z-50 top-0 start-0 border-b border-primary/10 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md transition-colors duration-300">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between p-4">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                        <span className="material-icons text-2xl">agriculture</span>
                    </div>
                    <span className="self-center text-2xl font-bold whitespace-nowrap text-gray-900 dark:text-white font-display">
                        Kisan<span className="text-primary">Setu</span>
                    </span>
                </Link>

                {/* Right Side Actions */}
                <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/20 hover:border-primary/50 cursor-pointer transition-colors bg-white/5 dark:bg-black/5">
                        <span className="material-icons text-primary text-sm">translate</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Hindi (हिंदी)</span>
                        <span className="material-icons text-gray-400 text-sm">expand_more</span>
                    </div>

                    <Link href={isAuthenticated ? "/assistant" : "/login"}>
                        <button
                            type="button"
                            className="text-white bg-primary hover:bg-primary-dark focus:ring-4 focus:outline-none focus:ring-primary/30 font-medium rounded-lg text-sm px-4 py-2 text-center transition-all shadow-lg shadow-primary/20"
                        >
                            {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                        </button>
                    </Link>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        type="button"
                        className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200"
                        aria-controls="navbar-sticky"
                        aria-expanded={isMenuOpen}
                    >
                        <span className="sr-only">Open main menu</span>
                        <svg
                            className="w-5 h-5"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 17 14"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M1 1h15M1 7h15M1 13h15"
                            />
                        </svg>
                    </button>
                </div>

                {/* Navigation Links */}
                <div
                    className={`${isMenuOpen ? 'block' : 'hidden'
                        } items-center justify-between w-full md:flex md:w-auto md:order-1 transition-all duration-300 ease-in-out`}
                    id="navbar-sticky"
                >
                    <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-transparent dark:bg-gray-800 md:dark:bg-transparent dark:border-gray-700">
                        <li>
                            <Link
                                href="#"
                                className="block py-2 px-3 text-white bg-primary rounded md:bg-transparent md:text-primary md:p-0"
                                aria-current="page"
                            >
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="#features"
                                className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-primary md:p-0 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 dark:border-gray-700 md:dark:hover:bg-transparent transition-colors"
                            >
                                Features
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="#market"
                                className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-primary md:p-0 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 dark:border-gray-700 md:dark:hover:bg-transparent transition-colors"
                            >
                                Mandi Prices
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="#community"
                                className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-primary md:p-0 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 dark:border-gray-700 md:dark:hover:bg-transparent transition-colors"
                            >
                                Community
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}
