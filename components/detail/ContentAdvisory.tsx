'use client';

import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ContentAdvisoryProps {
  rating: string;
  mediaType: 'movie' | 'tv';
  releaseDates?: Array<{
    iso_3166_1: string;
    release_dates: Array<{
      certification: string;
      note?: string;
      type?: number;
    }>;
  }>;
  contentRatings?: Array<{
    iso_3166_1: string;
    rating: string;
  }>;
}

interface AdvisoryItem {
  category: string;
  level: 'none' | 'mild' | 'moderate' | 'severe';
  description: string;
}

// Determine content advisory based on rating
function getContentAdvisory(
  rating: string,
  mediaType: 'movie' | 'tv'
): AdvisoryItem[] {
  const advisories: AdvisoryItem[] = [];

  // Movie ratings
  if (mediaType === 'movie') {
    if (rating === 'G' || rating === 'PG') {
      advisories.push({
        category: 'Language',
        level: 'none',
        description: 'No profanity or inappropriate language',
      });
      advisories.push({
        category: 'Violence',
        level: 'mild',
        description: 'Minimal or no violence',
      });
      advisories.push({
        category: 'Sexual Content',
        level: 'none',
        description: 'No sexual content',
      });
      advisories.push({
        category: 'Suitable for Kids',
        level: 'mild',
        description: 'Generally suitable for all ages',
      });
    } else if (rating === 'PG-13') {
      advisories.push({
        category: 'Language',
        level: 'moderate',
        description: 'May contain some profanity',
      });
      advisories.push({
        category: 'Violence',
        level: 'moderate',
        description: 'Moderate violence, may be intense',
      });
      advisories.push({
        category: 'Sexual Content',
        level: 'mild',
        description: 'Mild sexual references or content',
      });
      advisories.push({
        category: 'Suitable for Kids',
        level: 'moderate',
        description: 'Parental guidance suggested for children under 13',
      });
    } else if (rating === 'R') {
      advisories.push({
        category: 'Language',
        level: 'severe',
        description: 'Strong language and profanity',
      });
      advisories.push({
        category: 'Violence',
        level: 'severe',
        description: 'Intense violence, may be graphic',
      });
      advisories.push({
        category: 'Sexual Content',
        level: 'moderate',
        description: 'Sexual content and nudity',
      });
      advisories.push({
        category: 'Suitable for Kids',
        level: 'severe',
        description: 'Not suitable for children under 17',
      });
    } else if (rating === 'NC-17') {
      advisories.push({
        category: 'Language',
        level: 'severe',
        description: 'Extensive strong language',
      });
      advisories.push({
        category: 'Violence',
        level: 'severe',
        description: 'Extreme violence',
      });
      advisories.push({
        category: 'Sexual Content',
        level: 'severe',
        description: 'Explicit sexual content',
      });
      advisories.push({
        category: 'Suitable for Kids',
        level: 'severe',
        description: 'Adults only - not for children',
      });
    }
  } else {
    // TV ratings
    if (rating === 'TV-Y' || rating === 'TV-Y7' || rating === 'TV-G') {
      advisories.push({
        category: 'Language',
        level: 'none',
        description: 'No profanity or inappropriate language',
      });
      advisories.push({
        category: 'Violence',
        level: 'mild',
        description: 'Minimal or cartoon violence',
      });
      advisories.push({
        category: 'Sexual Content',
        level: 'none',
        description: 'No sexual content',
      });
      advisories.push({
        category: 'Suitable for Kids',
        level: 'mild',
        description: 'Suitable for children',
      });
    } else if (rating === 'TV-PG') {
      advisories.push({
        category: 'Language',
        level: 'mild',
        description: 'Mild language',
      });
      advisories.push({
        category: 'Violence',
        level: 'mild',
        description: 'Mild violence',
      });
      advisories.push({
        category: 'Sexual Content',
        level: 'none',
        description: 'No sexual content',
      });
      advisories.push({
        category: 'Suitable for Kids',
        level: 'mild',
        description: 'Parental guidance suggested',
      });
    } else if (rating === 'TV-14') {
      advisories.push({
        category: 'Language',
        level: 'moderate',
        description: 'May contain strong language',
      });
      advisories.push({
        category: 'Violence',
        level: 'moderate',
        description: 'Moderate violence',
      });
      advisories.push({
        category: 'Sexual Content',
        level: 'mild',
        description: 'Mild sexual references',
      });
      advisories.push({
        category: 'Suitable for Kids',
        level: 'moderate',
        description: 'Not suitable for children under 14',
      });
    } else if (rating === 'TV-MA') {
      advisories.push({
        category: 'Language',
        level: 'severe',
        description: 'Strong language and profanity',
      });
      advisories.push({
        category: 'Violence',
        level: 'severe',
        description: 'Intense violence, may be graphic',
      });
      advisories.push({
        category: 'Sexual Content',
        level: 'moderate',
        description: 'Sexual content and nudity',
      });
      advisories.push({
        category: 'Suitable for Kids',
        level: 'severe',
        description: 'Mature audiences only - not for children',
      });
    }
  }

  return advisories;
}

function getLevelIcon(level: AdvisoryItem['level']) {
  switch (level) {
    case 'none':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'mild':
      return <CheckCircle className="w-4 h-4 text-yellow-400" />;
    case 'moderate':
      return <AlertTriangle className="w-4 h-4 text-orange-400" />;
    case 'severe':
      return <XCircle className="w-4 h-4 text-red-400" />;
  }
}

function getLevelColor(level: AdvisoryItem['level']) {
  switch (level) {
    case 'none':
      return 'text-green-400';
    case 'mild':
      return 'text-yellow-400';
    case 'moderate':
      return 'text-orange-400';
    case 'severe':
      return 'text-red-400';
  }
}

export default function ContentAdvisory({
  rating,
  mediaType,
  releaseDates,
  contentRatings,
}: ContentAdvisoryProps) {
  // Get US rating
  let usRating = rating;
  
  if (mediaType === 'movie' && releaseDates) {
    const usRelease = releaseDates.find(r => r.iso_3166_1 === 'US');
    if (usRelease && usRelease.release_dates.length > 0) {
      const theatrical = usRelease.release_dates.find(rd => rd.certification && (rd.type === 3 || rd.type === 2));
      if (theatrical?.certification) {
        usRating = theatrical.certification;
      }
    }
  } else if (mediaType === 'tv' && contentRatings) {
    const usRatingData = contentRatings.find(r => r.iso_3166_1 === 'US');
    if (usRatingData?.rating) {
      usRating = usRatingData.rating;
    }
  }

  const advisories = getContentAdvisory(usRating, mediaType);

  if (advisories.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-primary rounded-full" />
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold text-white">Content Advisory</h2>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
      </div>

      <div className="glass rounded-lg p-6 space-y-4">
        <div className="mb-4">
          <p className="text-gray-300 text-sm mb-2">
            This content is rated <span className="font-semibold text-white">{usRating}</span>.
            The following information may help parents and viewers make informed viewing decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {advisories.map((advisory, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
            >
              {getLevelIcon(advisory.level)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-medium text-sm">{advisory.category}</h3>
                  <span className={`text-xs font-medium ${getLevelColor(advisory.level)}`}>
                    {advisory.level.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-400 text-xs">{advisory.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-gray-400 text-xs">
            Content ratings are provided as a guide. Individual sensitivities may vary.
            Parents are encouraged to review content before allowing children to watch.
          </p>
        </div>
      </div>
    </section>
  );
}
