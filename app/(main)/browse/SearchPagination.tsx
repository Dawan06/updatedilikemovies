'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
  query: string;
  filters?: {
    media_type?: string;
    genres?: string;
    year_from?: string;
    year_to?: string;
    rating_min?: string;
    language?: string;
    sort_by?: string;
  };
}

export default function SearchPagination({ currentPage, totalPages, query, filters }: SearchPaginationProps) {
  const router = useRouter();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set('search', query);
    params.set('page', newPage.toString());
    
    // Preserve filter params
    if (filters) {
      if (filters.media_type && filters.media_type !== 'all') {
        params.set('media_type', filters.media_type);
      }
      if (filters.genres) {
        params.set('genres', filters.genres);
      }
      if (filters.year_from) {
        params.set('year_from', filters.year_from);
      }
      if (filters.year_to) {
        params.set('year_to', filters.year_to);
      }
      if (filters.rating_min) {
        params.set('rating_min', filters.rating_min);
      }
      if (filters.language) {
        params.set('language', filters.language);
      }
      if (filters.sort_by && filters.sort_by !== 'popularity.desc') {
        params.set('sort_by', filters.sort_by);
      }
    }
    
    router.push(`/browse?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
          currentPage > 1
            ? 'bg-white/10 text-white hover:bg-white/20'
            : 'bg-white/5 text-white/30 cursor-not-allowed'
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
        Previous
      </button>

      <div className="flex items-center gap-2">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }

          return (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`w-10 h-10 rounded-md font-medium transition-colors ${
                pageNum === currentPage
                  ? 'bg-primary text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      <span className="text-gray-400 text-sm">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
          currentPage < totalPages
            ? 'bg-white/10 text-white hover:bg-white/20'
            : 'bg-white/5 text-white/30 cursor-not-allowed'
        }`}
      >
        Next
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
