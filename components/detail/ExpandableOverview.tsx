'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ExpandableOverviewProps {
  overview: string;
  maxLength?: number;
}

export default function ExpandableOverview({
  overview,
  maxLength = 300,
}: ExpandableOverviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = overview.length > maxLength;
  const displayText = isExpanded || !shouldTruncate
    ? overview
    : `${overview.slice(0, maxLength)}...`;

  if (!overview) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold text-white">Overview</h2>
      <p className="text-gray-300 leading-relaxed">{displayText}</p>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
        >
          {isExpanded ? 'Show Less' : 'Read More'}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}
    </div>
  );
}
