import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MovieCard from '@/components/movie-card/MovieCard';
import { Skeleton } from '@/components/ui/skeleton';

interface MovieGridProps {
    items: any[];
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    mediaType?: string;
}

export default function MovieGrid({
    items,
    loading,
    loadingMore,
    hasMore,
    onLoadMore,
    mediaType = 'movie',
}: MovieGridProps) {
    const loaderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
                    onLoadMore();
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        );

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loading, loadingMore, onLoadMore]);

    if (loading && items.length === 0) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-pulse">
                {Array.from({ length: 18 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[2/3] rounded-lg bg-netflix-gray/50" />
                ))}
            </div>
        );
    }

    if (!loading && items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No results found</h3>
                <p className="text-gray-400 max-w-md">
                    We couldn't find any movies or TV shows matching your filters. Try adjusting your search criteria.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {items.map((item, index) => (
                    <motion.div
                        key={`${item.media_type || mediaType}-${item.id}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index < 18 ? index * 0.05 : 0 }}
                    >
                        <MovieCard
                            item={item}
                            mediaType={item.media_type || mediaType as any}
                            index={index}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Infinite Scroll Loader / Trigger */}
            {(hasMore || loadingMore) && (
                <div
                    ref={loaderRef}
                    className="flex justify-center py-12 w-full mt-8"
                >
                    {loadingMore && (
                        <div className="flex items-center gap-3 text-primary animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
