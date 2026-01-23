'use client';

import Link from 'next/link';
import { Film, ArrowUp, Home, Grid3x3, Bookmark, Upload, Info } from 'lucide-react';
import { useState } from 'react';

export default function Footer() {
    const [email, setEmail] = useState('');
    const [emailSubmitted, setEmailSubmitted] = useState(false);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            // In a real app, you'd send this to your backend
            console.log('Email submitted:', email);
            setEmailSubmitted(true);
            setEmail('');
            setTimeout(() => setEmailSubmitted(false), 3000);
        }
    };

    return (
        <footer className="relative bg-black pt-16 pb-8 overflow-hidden border-t border-white/5">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[128px] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-12 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
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
                    </div>

                    {/* Navigation */}
                    <div>
                        <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                            <Grid3x3 className="w-4 h-4 text-primary" />
                            Discovery
                        </h3>
                        <ul className="space-y-3">
                            <FooterLink href="/">
                                <Home className="w-4 h-4" />
                                Home
                            </FooterLink>
                            <FooterLink href="/browse">
                                <Grid3x3 className="w-4 h-4" />
                                Browse All
                            </FooterLink>
                            <FooterLink href="/franchise">
                                <Film className="w-4 h-4" />
                                Franchises
                            </FooterLink>
                        </ul>
                    </div>

                    {/* Account */}
                    <div>
                        <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                            <Bookmark className="w-4 h-4 text-primary" />
                            My Account
                        </h3>
                        <ul className="space-y-3">
                            <FooterLink href="/my-list">
                                <Bookmark className="w-4 h-4" />
                                My Watchlist
                            </FooterLink>
                            <FooterLink href="/import">
                                <Upload className="w-4 h-4" />
                                Import Data
                            </FooterLink>
                        </ul>
                    </div>

                    {/* Legal & Info */}
                    <div>
                        <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                            <Info className="w-4 h-4 text-primary" />
                            Information
                        </h3>
                        <ul className="space-y-3">
                            <FooterLink href="/legal">Legal Information</FooterLink>
                            <FooterLink href="/browse">Browse Content</FooterLink>
                            <li>
                                <button
                                    onClick={scrollToTop}
                                    className="text-gray-400 hover:text-primary hover:translate-x-1 transition-all duration-300 inline-flex items-center gap-2 group"
                                >
                                    <ArrowUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                                    Back to Top
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} ILikeMovies. All rights reserved.
                    </p>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                        <Link href="/legal" className="hover:text-primary transition-colors">
                            Legal
                        </Link>
                        <button
                            onClick={scrollToTop}
                            className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors group"
                        >
                            <ArrowUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                            <span className="hidden sm:inline">Top</span>
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <li>
            <Link
                href={href}
                className="text-gray-400 hover:text-primary hover:translate-x-1 transition-all duration-300 inline-flex items-center gap-2 group"
            >
                {children}
            </Link>
        </li>
    );
}
