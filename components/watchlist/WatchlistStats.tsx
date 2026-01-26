'use client';

import { useMemo } from 'react';
import { Film, Tv, Clock, CheckCircle2, PlayCircle, TrendingUp } from 'lucide-react';

interface WatchlistItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  status: 'watching' | 'completed' | 'plan_to_watch';
  details?: {
    runtime?: number;
    episode_run_time?: number[];
    number_of_seasons?: number;
    number_of_episodes?: number;
  };
}

interface WatchlistStatsProps {
  items: WatchlistItem[];
}

export default function WatchlistStats({ items }: WatchlistStatsProps) {
  const stats = useMemo(() => {
    const movieCount = items.filter(i => i.media_type === 'movie').length;
    const tvCount = items.filter(i => i.media_type === 'tv').length;
    const watchingCount = items.filter(i => i.status === 'watching').length;
    const completedCount = items.filter(i => i.status === 'completed').length;
    const planToWatchCount = items.filter(i => i.status === 'plan_to_watch').length;

    // Calculate estimated watch time
    let estimatedMinutes = 0;
    items.forEach(item => {
      if (item.media_type === 'movie' && item.details?.runtime) {
        estimatedMinutes += item.details.runtime;
      } else if (item.media_type === 'tv' && item.details) {
        const avgEpisodeTime = item.details.episode_run_time?.[0] || 45;
        const totalEpisodes = item.details.number_of_episodes || 10;
        estimatedMinutes += avgEpisodeTime * totalEpisodes;
      }
    });

    const estimatedHours = Math.floor(estimatedMinutes / 60);
    const estimatedDays = Math.floor(estimatedHours / 24);

    const completionPercentage = items.length > 0
      ? Math.round((completedCount / items.length) * 100)
      : 0;

    return {
      total: items.length,
      movieCount,
      tvCount,
      watchingCount,
      completedCount,
      planToWatchCount,
      estimatedHours,
      estimatedDays,
      estimatedMinutes,
      completionPercentage,
    };
  }, [items]);

  if (items.length === 0) return null;

  const statCards = [
    {
      icon: Film,
      label: 'Movies',
      value: stats.movieCount,
      color: 'text-blue-400',
    },
    {
      icon: Tv,
      label: 'TV Shows',
      value: stats.tvCount,
      color: 'text-purple-400',
    },
    {
      icon: PlayCircle,
      label: 'Watching',
      value: stats.watchingCount,
      color: 'text-green-400',
    },
    {
      icon: CheckCircle2,
      label: 'Completed',
      value: stats.completedCount,
      color: 'text-yellow-400',
    },
    {
      icon: Clock,
      label: 'Plan to Watch',
      value: stats.planToWatchCount,
      color: 'text-gray-400',
    },
  ];

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-white">Statistics</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-gray-400 font-medium">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Watch Time Estimate */}
      {stats.estimatedHours > 0 && (
        <div className="pt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400 mb-1">Estimated Watch Time</div>
              <div className="text-2xl font-bold text-white">
                {stats.estimatedDays > 0 && `${stats.estimatedDays}d `}
                {stats.estimatedHours % 24}h
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Completion</div>
              <div className="text-2xl font-bold text-primary">{stats.completionPercentage}%</div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${stats.completionPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
