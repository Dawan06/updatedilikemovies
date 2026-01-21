'use client';

import Link from 'next/link';
import { Github, Twitter, Instagram, Heart, Film, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="relative bg-black pt-20 pb-10 overflow-hidden border-t border-white/5">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[128px] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-12 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Film className="w-8 h-8 text-primary group-hover:rotate-12 transition-transform duration-300" />
                            <span className="font-display text-2xl tracking-wide text-white">
                                ILIKE<span className="text-primary">MOVIES</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                            Your premium destination for discovering, tracking, and curating your personal movie and TV show library.
                        </p>
                        <div className="flex items-center gap-4">
                            <SocialLink href="#" icon={<Github className="w-5 h-5" />} label="GitHub" />
                            <SocialLink href="#" icon={<Twitter className="w-5 h-5" />} label="Twitter" />
                            <SocialLink href="#" icon={<Instagram className="w-5 h-5" />} label="Instagram" />
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h3 className="text-white font-semibold mb-6">Discovery</h3>
                        <ul className="space-y-4">
                            <FooterLink href="/browse/movies">Movies</FooterLink>
                            <FooterLink href="/browse/tv">TV Shows</FooterLink>
                            <FooterLink href="/franchise">Franchises</FooterLink>
                            <FooterLink href="/featured">Featured Collections</FooterLink>
                        </ul>
                    </div>

                    {/* Account */}
                    <div>
                        <h3 className="text-white font-semibold mb-6">Account</h3>
                        <ul className="space-y-4">
                            <FooterLink href="/my-list">My Watchlist</FooterLink>
                            <FooterLink href="/history">Viewing History</FooterLink>
                            <FooterLink href="/import">Import Data</FooterLink>
                            <FooterLink href="/settings">Settings</FooterLink>
                        </ul>
                    </div>

                    {/* Newsletter / Updates (Static for now) */}
                    <div>
                        <h3 className="text-white font-semibold mb-6">Stay Updated</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Get the latest updates on new features and collections.
                        </p>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">
                                <ArrowUp className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} ILikeMovies. All rights reserved.
                    </p>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                        <button
                            onClick={scrollToTop}
                            className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors group"
                        >
                            Back to Top
                            <ArrowUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <a
            href={href}
            aria-label={label}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white hover:scale-110 transition-all duration-300 border border-white/5 hover:border-primary"
        >
            {icon}
        </a>
    );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <li>
            <Link
                href={href}
                className="text-gray-400 hover:text-primary hover:translate-x-1 transition-all duration-300 inline-flex items-center gap-2"
            >
                <span className="w-1.5 h-1.5 rounded-full bg-primary/0 transition-all duration-300 group-hover:bg-primary" />
                {children}
            </Link>
        </li>
    );
}
