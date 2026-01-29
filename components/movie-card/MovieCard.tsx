'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Movie, TVShow, MediaItem, MovieDetails, TVShowDetails } from '@/types';
import { Film, Star, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { createProgressiveImageProps } from '@/lib/progressive-image-loader';
import ContentRatingBadge from '@/components/ContentRatingBadge';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/contexts/ToastContext';
import MovieCardContextMenu from './MovieCardContextMenu';

// Genre ID to name mapping (TMDB standard)
const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
  // TV genres
  10759: 'Action', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi', 10766: 'Soap', 10767: 'Talk', 10768: 'Politics'
};

// Flexible item type that accepts partial movie/TV data
interface CardItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  genre_ids?: number[];
  media_type?: 'movie' | 'tv';
  certification?: string;
  content_rating?: string;
}

interface MovieCardProps {
  readonly item: Movie | TVShow | MediaItem | CardItem;
  readonly mediaType?: 'movie' | 'tv';
  readonly priority?: boolean;
  readonly index?: number;
  readonly enableHover?: boolean;
  readonly showCheckbox?: boolean;
  readonly isSelected?: boolean;
  readonly onSelect?: (id: number, type: 'movie' | 'tv') => void;
  readonly showDeleteButton?: boolean;
  readonly onDelete?: (id: number, type: 'movie' | 'tv') => void;
  readonly className?: string;
  readonly style?: React.CSSProperties;
}

export default function MovieCard({
  item,
  mediaType,
  priority,
  enableHover = true,
  showCheckbox = false,
  isSelected = false,
  onSelect,
  showDeleteButton = false,
  onDelete,
  className = '',
  style,
}: MovieCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fullQualityReady, setFullQualityReady] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  
  const { isSignedIn } = useUser();
  const router = useRouter();
  const { isInWatchlist, addItem, removeItem } = useWatchlist();
  const toast = useToast();
  
  const type = mediaType || (item as MediaItem).media_type || 'movie';
  const isBookmarked = isInWatchlist(item.id, type);

  const title = (item as Movie).title || (item as TVShow).name || '';
  const posterPath = item.poster_path;
  const year = ((item as Movie).release_date || (item as TVShow).first_air_date || '').slice(0, 4);
  const rating = item.vote_average || 0;
  const genreIds = (item as Movie | TVShow).genre_ids || [];
  const genres = genreIds.slice(0, 2).map(id => GENRE_MAP[id]).filter(Boolean);
  const contentRating = (item as CardItem).certification || (item as CardItem).content_rating || (item as MovieDetails).certification || (item as TVShowDetails).content_rating;

  const progressiveProps = createProgressiveImageProps(posterPath, 'w300');
  
  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    
    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await removeItem(item.id, type);
        toast.showSuccess(`${title} removed from watchlist`);
      } else {
        await addItem(item.id, type);
        toast.showSuccess(`${title} added to watchlist`);
      }
    } catch (error) {
      console.error('Watchlist operation error:', error);
      toast.showError(`Failed to ${isBookmarked ? 'remove from' : 'add to'} watchlist`);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(item.id, type);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(item.id, type);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!showCheckbox && !showDeleteButton) {
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  };

  return (
    <>
      <Link
        href={`/${type}/${item.id}`}
        style={style}
        className={`block group relative ${enableHover ? 'hover:z-20' : ''} transition-all duration-200 ease-out ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onContextMenu={handleContextMenu}
      >
      {/* Checkbox for selection */}
      {showCheckbox && (
        <button
          onClick={handleCheckboxClick}
          className={`absolute top-2 left-2 z-20 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${isSelected
              ? 'bg-primary border-primary'
              : 'bg-black/50 border-white/50 hover:border-white'
            }`}
        >
          {isSelected && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      )}

      {/* Delete button for edit mode */}
      {showDeleteButton && (
        <button
          onClick={handleDeleteClick}
          className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Card Container - Fixed aspect ratio to prevent CLS */}
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-netflix-dark shadow-card transition-shadow duration-300" style={{ minHeight: '270px' }}>
        {/* Watchlist - Top right, fixed position so layout never shifts */}
        {enableHover && (
          <button
            onClick={handleBookmarkClick}
            disabled={bookmarkLoading}
            className={`absolute top-2 right-2 z-30 w-8 h-8 flex items-center justify-center rounded-md transition-[opacity] duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
            } ${isBookmarked ? 'bg-primary text-white' : 'bg-black/70 text-white'}`}
            title={isBookmarked ? 'Remove from watchlist' : 'Add to watchlist'}
            aria-label={isBookmarked ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            {bookmarkLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
            ) : isBookmarked ? (
              <BookmarkCheck className="w-4 h-4 fill-current" strokeWidth={2} />
            ) : (
              <Bookmark className="w-4 h-4" strokeWidth={2} />
            )}
          </button>
        )}

        {/* Content Rating Badge - Top right, left of watchlist so both visible and no shift */}
        {contentRating && (
          <div className="absolute top-2 right-11 z-10">
            <ContentRatingBadge rating={contentRating} size="sm" />
          </div>
        )}

        {/* Poster Image - Progressive Loading */}
        {posterPath ? (
          <Image
            src={fullQualityReady && imageLoaded ? progressiveProps.fullSrc : progressiveProps.placeholderSrc}
            alt={title}
            fill
            className={`object-cover transition-opacity duration-500 ${fullQualityReady && imageLoaded ? 'opacity-100' : 'opacity-90'
              }`}
            sizes="(max-width: 768px) 180px, 220px"
            loading={priority ? 'eager' : 'lazy'}
            priority={priority}
            onLoad={() => {
              setImageLoaded(true);
              // Preload full quality in background
              if (!fullQualityReady && progressiveProps.fullSrc) {
                const preloadImg = document.createElement('img');
                preloadImg.onload = () => setFullQualityReady(true);
                preloadImg.src = progressiveProps.fullSrc;
              }
            }}
            style={{ objectFit: 'cover' }}
            decoding={priority ? 'sync' : 'async'}
            quality={fullQualityReady && imageLoaded ? progressiveProps.fullQuality : progressiveProps.placeholderQuality}
          />
        ) : (
          <div className="absolute inset-0 bg-netflix-gray flex items-center justify-center" style={{ aspectRatio: '2/3' }}>
            <Film className="w-12 h-12 text-gray-600" />
          </div>
        )}

        {/* Quick Info Hover Overlay */}
        {enableHover && (
          <div className="absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-300">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

            {/* Content */}
            <div className="relative z-10 p-3">
              {/* Title */}
              <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2">
                {title}
              </h3>

              {/* Rating & Year Row */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-white text-xs font-semibold">{rating.toFixed(1)}</span>
                  </div>
                )}
                {contentRating && (
                  <>
                    {rating > 0 && <span className="w-1 h-1 bg-gray-500 rounded-full" />}
                    <ContentRatingBadge rating={contentRating} size="sm" />
                  </>
                )}
                {year && (
                  <>
                    {(rating > 0 || contentRating) && <span className="w-1 h-1 bg-gray-500 rounded-full" />}
                    <span className="text-gray-300 text-xs">{year}</span>
                  </>
                )}
                <span className="w-1 h-1 bg-gray-500 rounded-full" />
                <span className="text-primary text-xs font-medium uppercase">
                  {type === 'tv' ? 'TV' : 'Movie'}
                </span>
              </div>

              {/* Genre Tags */}
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {genres.map((genre, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-gray-300"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
    
    {contextMenu && (
      <MovieCardContextMenu
        item={{
          id: item.id,
          title: (item as Movie).title,
          name: (item as TVShow).name,
          media_type: type,
        }}
        position={contextMenu}
        onClose={() => setContextMenu(null)}
      />
    )}
    </>
  );
}
