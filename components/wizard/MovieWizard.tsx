'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Movie, TVShow } from '@/types';
import ControlPanel from './ControlPanel';
import ResultView from './ResultView';
import { VIBES } from './constants';
import { X, Sparkles } from 'lucide-react';

interface MovieWizardProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MovieWizard({ isOpen, onClose }: MovieWizardProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
    const [selectedEra, setSelectedEra] = useState<string | null>(null);
    const [selectedRuntime, setSelectedRuntime] = useState<string | null>(null);
    const [results, setResults] = useState<(Movie | TVShow)[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleSearch = async () => {
        if (!selectedVibe) return;

        setIsSearching(true);
        try {
            const vibe = VIBES.find(v => v.id === selectedVibe);
            if (!vibe) return;

            const params = new URLSearchParams({
                page: '1',
                sort_by: vibe.sort,
                vote_count_min: '100',
                media_type: 'movie', // Default to movie for now, could add switcher
                genres: vibe.genres
            });

            // Era Logic
            const currentYear = new Date().getFullYear();
            if (selectedEra === 'modern') {
                params.append('year_from', '2015');
                params.append('year_to', currentYear.toString());
            } else if (selectedEra === '2000s') {
                params.append('year_from', '2000');
                params.append('year_to', '2014');
            } else if (selectedEra === '90s') {
                params.append('year_from', '1990');
                params.append('year_to', '1999');
            } else if (selectedEra === 'classic') {
                params.append('year_from', '1900');
                params.append('year_to', '1989');
            }

            // Runtime Logic
            if (selectedRuntime && selectedRuntime !== 'any') {
                if (selectedRuntime === 'short') params.append('runtime_max', '90');
                if (selectedRuntime === 'standard') {
                    params.append('runtime_min', '90');
                    params.append('runtime_max', '120');
                }
                if (selectedRuntime === 'epic') params.append('runtime_min', '120');
            }

            const res = await fetch(`/api/discover?${params.toString()}`);
            if (!res.ok) throw new Error('API request failed');

            const data = await res.json();
            // Filter out items without posters
            const validResults = (data.results || []).filter((m: Movie | TVShow) => m.poster_path);

            // Artificial delay for "Processing" effect - Reduced for performance
            setTimeout(() => {
                setResults(validResults);
                setIsSearching(false);
                setShowResults(true);
            }, 600);

        } catch (error) {
            console.error(error);
            setIsSearching(false);
        }
    };

    const handleReset = () => {
        setShowResults(false);
        setResults([]);
        setSelectedVibe(null);
        setSelectedEra(null);
        setSelectedRuntime(null);
    };

    if (!isMounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                    />

                    {/* Main Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        className="relative w-full h-full md:w-[95vw] md:h-[90vh] bg-[#0a0a0a] md:rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row"
                    >
                        {/* Close Button (Mobile) */}
                        <button
                            onClick={onClose}
                            className="md:hidden absolute top-4 right-4 z-50 p-2 bg-white/10 rounded-full text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* LEFT PANEL: Controls */}
                        <div className={`w-full md:w-[400px] lg:w-[450px] bg-[#0f0f0f] border-r border-white/5 flex-shrink-0 z-10 transition-transform duration-500 ease-in-out absolute md:relative inset-0 md:inset-auto ${showResults ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
                            <ControlPanel
                                selectedVibe={selectedVibe}
                                onSelectVibe={setSelectedVibe}
                                selectedEra={selectedEra}
                                onSelectEra={setSelectedEra}
                                selectedRuntime={selectedRuntime}
                                onSelectRuntime={setSelectedRuntime}
                                onSearch={handleSearch}
                                isSearching={isSearching}
                            />
                        </div>

                        {/* RIGHT PANEL: Results or Fancy Placeholder */}
                        <div className="flex-1 relative bg-black/20 overflow-hidden">
                            <AnimatePresence mode="wait">
                                {showResults ? (
                                    <motion.div
                                        key="results"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="absolute inset-0 z-20"
                                    >
                                        <ResultView
                                            results={results}
                                            onClose={onClose}
                                            onReset={handleReset}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="placeholder"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 flex items-center justify-center p-8 text-center"
                                    >
                                        <div className="max-w-md space-y-6 opacity-50">
                                            <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/30 animate-pulse">
                                                <Sparkles className="w-10 h-10 text-primary" />
                                            </div>
                                            <h3 className="text-xl font-medium text-white">System Ready</h3>
                                            <p className="text-gray-500">
                                                Configure parameters on the {window.innerWidth > 768 ? 'left' : 'previous screen'} to initialize the recommendation engine.
                                            </p>
                                        </div>

                                        {/* Background decorative elements */}
                                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                                            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
