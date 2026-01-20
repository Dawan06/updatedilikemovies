'use client';

import { VIBES, RUNTIME_OPTIONS, ERAS } from './constants';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

interface ControlPanelProps {
    selectedVibe: string | null;
    onSelectVibe: (id: string) => void;
    selectedEra: string | null;
    onSelectEra: (id: string) => void;
    selectedRuntime: string | null;
    onSelectRuntime: (id: string) => void;
    onSearch: () => void;
    isSearching: boolean;
}

export default function ControlPanel({
    selectedVibe,
    onSelectVibe,
    selectedEra,
    onSelectEra,
    selectedRuntime,
    onSelectRuntime,
    onSearch,
    isSearching
}: ControlPanelProps) {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col h-full overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar"
        >
            <motion.div variants={item} className="space-y-2">
                <div className="flex items-center gap-2 text-primary mb-2">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span className="font-display font-bold tracking-wider text-sm">AI COMMAND CENTER</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    Initialize<br />Search Parameters
                </h2>
                <p className="text-gray-400">Configure the heuristic engine to generate personalized recommendations.</p>
            </motion.div>

            {/* Vibes Grid */}
            <motion.div variants={item} className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Target Vibe</h3>
                <div className="grid grid-cols-2 gap-3">
                    {VIBES.map((vibe) => {
                        const Icon = vibe.icon;
                        const isSelected = selectedVibe === vibe.id;
                        return (
                            <button
                                key={vibe.id}
                                onClick={() => onSelectVibe(vibe.id)}
                                className={`relative group overflow-hidden p-4 rounded-xl border transition-all duration-300 text-left flex flex-col gap-3
                                    ${isSelected
                                        ? `bg-white/10 ${vibe.border} ring-1 ring-white/20`
                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                    }`}
                            >
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${vibe.bg}`} />
                                <Icon className={`w-6 h-6 ${isSelected ? vibe.color : 'text-gray-400 group-hover:text-white'} transition-colors`} />
                                <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'} transition-colors`}>
                                    {vibe.label}
                                </span>
                                {isSelected && (
                                    <div
                                        className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-${vibe.color.split('-')[1]}-400 to-transparent w-full`}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Era Selection */}
            <motion.div variants={item} className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Temporal Era</h3>
                <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
                    {ERAS.map((era) => {
                        const isSelected = selectedEra === era.id;
                        return (
                            <button
                                key={era.id}
                                onClick={() => onSelectEra(era.id)}
                                className={`flex-1 min-w-[100px] py-3 px-4 rounded-lg text-sm font-medium transition-all relative ${isSelected ? 'text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                {isSelected && (
                                    <div
                                        className="absolute inset-0 bg-white/10 rounded-lg"
                                    />
                                )}
                                <span className="relative z-10 block">{era.label}</span>
                                <span className="relative z-10 text-xs opacity-50 block">{era.sub}</span>
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Runtime Selection */}
            <motion.div variants={item} className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Duration</h3>
                <div className="grid grid-cols-4 gap-2">
                    {RUNTIME_OPTIONS.map((option) => {
                        const isSelected = selectedRuntime === option.id;
                        return (
                            <button
                                key={option.id}
                                onClick={() => onSelectRuntime(option.id)}
                                className={`py-3 px-2 rounded-xl text-center border transition-all ${isSelected
                                    ? 'bg-primary/20 border-primary/50 text-white'
                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <span className="block font-medium text-sm">{option.label}</span>
                                <span className="block text-[10px] opacity-60">{option.sub}</span>
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            <motion.div variants={item} className="pt-4">
                <button
                    onClick={onSearch}
                    disabled={!selectedVibe || isSearching}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${!selectedVibe || isSearching
                        ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary-dark text-white hover:scale-[1.02] shadow-xl shadow-primary/20'
                        }`}
                >
                    {isSearching ? (
                        <>
                            <Sparkles className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <span>Run Analysis</span>
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </motion.div>
        </motion.div>
    );
}
