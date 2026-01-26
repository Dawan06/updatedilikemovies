'use client';

import { useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';

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
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-primary rounded-full" />
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold text-white">Overview</h2>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
      </div>
      
      <div className="glass rounded-xl p-6 md:p-8">
        <p className="text-gray-200 leading-relaxed text-base md:text-lg">{displayText}</p>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 mt-4 text-primary hover:text-primary/80 transition-colors text-sm font-semibold group"
          >
            {isExpanded ? 'Show Less' : 'Read More'}
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              } group-hover:translate-y-0.5`}
            />
          </button>
        )}
      </div>
    </section>
  );
}
