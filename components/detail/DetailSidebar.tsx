'use client';

import QuickStats from './QuickStats';
import AddToListButton from './AddToListButton';
import ShareMenu from '@/components/share/ShareMenu';

interface DetailSidebarProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  rating?: number;
  runtime?: number;
  year?: string;
  seasons?: number;
  episodes?: number;
  director?: string;
  creator?: string;
  productionCompany?: string;
  network?: string;
}

export default function DetailSidebar({
  tmdbId,
  mediaType,
  rating,
  runtime,
  year,
  seasons,
  episodes,
  director,
  creator,
  productionCompany,
  network,
}: DetailSidebarProps) {

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start space-y-6">
      {/* Quick Stats */}
      <div className="glass rounded-xl p-6">
        <QuickStats
          rating={rating}
          runtime={runtime}
          year={year}
          mediaType={mediaType}
          seasons={seasons}
          episodes={episodes}
        />
      </div>

      {/* Key Info */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Details
        </h3>
        {director && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Director</p>
            <p className="text-white font-medium">{director}</p>
          </div>
        )}
        {creator && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Creator</p>
            <p className="text-white font-medium">{creator}</p>
          </div>
        )}
        {productionCompany && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {mediaType === 'movie' ? 'Studio' : 'Production'}
            </p>
            <p className="text-white font-medium">{productionCompany}</p>
          </div>
        )}
        {network && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Network</p>
            <p className="text-white font-medium">{network}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Actions
        </h3>
        <AddToListButton tmdbId={tmdbId} mediaType={mediaType} />
        <ShareMenu
          url={typeof window !== 'undefined' ? window.location.href : ''}
          title={document.title}
          mediaType={mediaType}
        />
      </div>
    </aside>
  );
}
