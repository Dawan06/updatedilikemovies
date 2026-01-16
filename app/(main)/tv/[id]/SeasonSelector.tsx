'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Clock, Star, ChevronDown, Film, ChevronUp } from 'lucide-react';
import { SeasonDetails, Episode } from '@/types';

interface SeasonSelectorProps {
  tvId: number;
  showName: string;
  seasons: SeasonDetails[];
}

const INITIAL_EPISODES_SHOWN = 8;

export default function SeasonSelector({ tvId, showName, seasons }: SeasonSelectorProps) {
  const [selectedSeason, setSelectedSeason] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);

  if (!seasons.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No episodes available</p>
      </div>
    );
  }

  const currentSeason = seasons[selectedSeason];
  const totalEpisodes = currentSeason.episodes.length;
  const hasMoreEpisodes = totalEpisodes > INITIAL_EPISODES_SHOWN;
  const displayedEpisodes = showAllEpisodes 
    ? currentSeason.episodes 
    : currentSeason.episodes.slice(0, INITIAL_EPISODES_SHOWN);

  const handleSeasonChange = (index: number) => {
    setSelectedSeason(index);
    setShowAllEpisodes(false); // Reset when changing seasons
    setIsDropdownOpen(false);
  };

  return (
    <div className="animate-fade-in-up">
      {/* Season Dropdown */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-semibold text-white flex items-center gap-2">
          <Film className="w-5 h-5 text-primary" />
          Episodes
          <span className="text-sm font-normal text-gray-400 ml-2">
            ({totalEpisodes} episodes)
          </span>
        </h2>
        
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 glass hover:bg-white/10 text-white px-4 py-2.5 rounded-lg transition-all duration-200"
          >
            <span className="font-medium">{currentSeason.name}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsDropdownOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-56 glass rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-down max-h-80 overflow-y-auto scrollbar-hide">
                {seasons.map((season, index) => (
                  <button
                    key={season.id}
                    onClick={() => handleSeasonChange(index)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-white/10 transition-colors ${
                      selectedSeason === index ? 'bg-primary/20 text-primary border-l-2 border-primary' : 'text-white'
                    }`}
                  >
                    <span className="font-medium">{season.name}</span>
                    <span className="text-xs text-gray-400">{season.episodes.length} eps</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Episodes List - Scrollable when expanded */}
      <div className={`${showAllEpisodes && totalEpisodes > 12 ? 'max-h-[800px] overflow-y-auto scrollbar-hide pr-2' : ''}`}>
        <div className="grid gap-3">
          {displayedEpisodes.map((episode, index) => (
            <EpisodeCard 
              key={episode.id} 
              episode={episode} 
              tvId={tvId}
              showName={showName}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Show More/Less Button */}
      {hasMoreEpisodes && (
        <button
          onClick={() => setShowAllEpisodes(!showAllEpisodes)}
          className="w-full mt-4 py-3 px-4 glass hover:bg-white/10 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all duration-200"
        >
          {showAllEpisodes ? (
            <>
              <ChevronUp className="w-5 h-5" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5" />
              Show All {totalEpisodes} Episodes
            </>
          )}
        </button>
      )}
    </div>
  );
}

function EpisodeCard({ 
  episode, 
  tvId, 
  showName,
  index 
}: { 
  episode: Episode; 
  tvId: number; 
  showName: string;
  index: number;
}) {
  return (
    <Link
      href={`/watch/tv/${tvId}?season=${episode.season_number}&episode=${episode.episode_number}`}
      className="group flex gap-4 bg-netflix-dark/50 hover:bg-netflix-dark rounded-xl overflow-hidden transition-all duration-300 hover:ring-1 hover:ring-primary/50 hover:shadow-lg"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Thumbnail */}
      <div className="relative w-40 md:w-52 flex-shrink-0 aspect-video bg-netflix-gray overflow-hidden">
        {episode.still_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
            alt={episode.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <Play className="w-8 h-8" />
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 text-black fill-black ml-0.5" />
          </div>
        </div>
        
        {/* Episode number badge */}
        <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded">
          E{episode.episode_number}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 py-3 pr-4 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-white group-hover:text-primary transition-colors truncate">
            {episode.name}
          </h3>
          {episode.vote_average > 0 && (
            <span className="flex items-center gap-1 text-yellow-400 text-xs flex-shrink-0">
              <Star className="w-3 h-3 fill-current" /> {episode.vote_average.toFixed(1)}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
          {episode.runtime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {episode.runtime}m
            </span>
          )}
          {episode.air_date && (
            <span>{new Date(episode.air_date).toLocaleDateString()}</span>
          )}
        </div>

        {episode.overview && (
          <p className="text-sm text-gray-400 line-clamp-2">{episode.overview}</p>
        )}
      </div>
    </Link>
  );
}
