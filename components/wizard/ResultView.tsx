'use client';

import { motion } from 'framer-motion';
import { Movie, TVShow } from '@/types';
import { X, Play, Plus, ThumbsUp, ThumbsDown, Star, Calendar } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ResultViewProps {
    results: (Movie | TVShow)[];
    onClose: () => void;
    onReset: () => void;
}

export default function ResultView({ results, onClose, onReset }: ResultViewProps) {
    const router = useRouter();

    const handleWatch = (movie: Movie | TVShow) => {
        const mediaType = 'title' in movie ? 'movie' : 'tv';
        router.push(`/watch/${mediaType}/${movie.id}`);
        onClose();
    };
    return (
        <div className="h-full flex flex-col relative overflow-hidden bg-black/40">
            {/* Header Actions */}
            <div className="absolute top-0 right-0 p-6 z-20 flex gap-4 bg-gradient-to-b from-black/80 to-transparent w-full justify-end pointer-events-none">
                <button
                    onClick={onReset}
                    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors pointer-events-auto"
                >
                    New Search
                </button>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 transition-colors pointer-events-auto"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pt-24 px-6 md:px-12 pb-12">
                <div className="w-full max-w-6xl mx-auto space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <h2 className="text-3xl font-bold text-white mb-2">Analysis Complete</h2>
                        <p className="text-gray-400">The engine has identified {results.length} optimal matches for your parameters.</p>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                        {results.map((movie, index) => (
                            <ResultCard
                                key={movie.id}
                                movie={movie}
                                index={index}
                                onWatch={() => handleWatch(movie)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ResultCard({ movie, index, onWatch }: { movie: Movie | TVShow, index: number, onWatch: () => void }) {
    const isMovie = 'title' in movie;
    // Safely access title/name and release_date/first_air_date
    const title = isMovie ? (movie as Movie).title : (movie as TVShow).name;
    const date = isMovie ? (movie as Movie).release_date : (movie as TVShow).first_air_date;
    const year = date ? new Date(date).getFullYear() : 'N/A';
    const rating = movie.vote_average ? Math.round(movie.vote_average * 10) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-[#1a1a1a] rounded-xl md:rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all hover:scale-[1.02] shadow-lg hover:shadow-primary/10"
        >
            {/* Image */}
            <div className="aspect-[2/3] relative overflow-hidden bg-neutral-900">
                {movie.poster_path ? (
                    <Image
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={title}
                        fill
                        priority={index < 4}
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                        <span className="text-neutral-500">No Image</span>
                    </div>
                )}

                {/* Overlay Gradient on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <button
                        onClick={onWatch}
                        className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl flex items-center justify-center gap-2 mb-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                    >
                        <Play className="w-4 h-4" fill="currentColor" />
                        Watch Now
                    </button>
                    <div className="flex gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                        <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
                            List
                        </button>
                        <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2">
                            More Info
                        </button>
                    </div>
                </div>
            </div>

            {/* Content info visible always */}
            <div className="p-4 relative bg-[#1a1a1a]">
                <h3 className="text-white font-bold truncate mb-1">{title}</h3>
                <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                        <span>{year}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                        <span className="uppercase border border-white/10 px-1 rounded">{isMovie ? 'Movie' : 'TV'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-3 h-3" fill="currentColor" />
                        <span>{rating}%</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
