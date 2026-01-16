'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, ChevronDown, User } from 'lucide-react';

interface Review {
  id: string;
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
  updated_at: string;
  url: string;
}

interface ReviewsSectionProps {
  reviews: Review[];
  totalResults: number;
}

export default function ReviewsSection({ reviews, totalResults }: ReviewsSectionProps) {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  if (!reviews || reviews.length === 0) {
    return null;
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, 2);
  const hasMore = reviews.length > 2;

  const toggleReview = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getAvatarUrl = (avatarPath: string | null) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `https://image.tmdb.org/t/p/w45${avatarPath}`;
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">
          Reviews <span className="text-gray-400 text-base font-normal">({totalResults})</span>
        </h2>
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            {showAll ? 'Show Less' : `View All (${totalResults})`}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayedReviews.map((review) => {
          const isExpanded = expandedReviews.has(review.id);
          const shouldTruncate = review.content.length > 300;
          const displayContent = isExpanded || !shouldTruncate
            ? review.content
            : `${review.content.slice(0, 300)}...`;

          return (
            <article
              key={review.id}
              className="glass rounded-lg p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-netflix-gray flex-shrink-0">
                  {getAvatarUrl(review.author_details.avatar_path) ? (
                    <Image
                      src={getAvatarUrl(review.author_details.avatar_path)!}
                      alt={review.author_details.name || review.author}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-white font-medium text-sm">
                      {review.author_details.name || review.author}
                    </h3>
                    {review.author_details.rating && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-xs font-medium">
                          {review.author_details.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs">
                    {formatDate(review.created_at)}
                  </p>
                </div>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                {displayContent}
              </p>

              {shouldTruncate && (
                <button
                  onClick={() => toggleReview(review.id)}
                  className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-xs font-medium mt-2"
                >
                  {isExpanded ? 'Show Less' : 'Read More'}
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
