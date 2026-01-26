'use client';

interface ContentRatingBadgeProps {
  rating: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Rating color mapping
const RATING_COLORS: Record<string, string> = {
  // Movie ratings
  'G': 'bg-green-500',
  'PG': 'bg-yellow-500',
  'PG-13': 'bg-orange-500',
  'R': 'bg-red-500',
  'NC-17': 'bg-red-700',
  // TV ratings
  'TV-Y': 'bg-green-500',
  'TV-Y7': 'bg-green-400',
  'TV-G': 'bg-green-500',
  'TV-PG': 'bg-yellow-500',
  'TV-14': 'bg-orange-500',
  'TV-MA': 'bg-red-500',
};

const RATING_SIZES = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export default function ContentRatingBadge({
  rating,
  size = 'md',
  className = '',
}: ContentRatingBadgeProps) {
  if (!rating) return null;

  const bgColor = RATING_COLORS[rating] || 'bg-gray-500';
  const sizeClasses = RATING_SIZES[size];

  return (
    <span
      className={`${bgColor} text-white font-bold rounded ${sizeClasses} ${className}`}
      title={`Content Rating: ${rating}`}
    >
      {rating}
    </span>
  );
}
