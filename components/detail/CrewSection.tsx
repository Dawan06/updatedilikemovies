'use client';

import { Award, Camera, PenTool, Video } from 'lucide-react';

interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

interface CrewSectionProps {
  readonly crew: CrewMember[];
  readonly mediaType?: 'movie' | 'tv';
}

const JOB_ICONS: Record<string, React.ReactNode> = {
  Director: <Video className="w-4 h-4" />,
  Producer: <Award className="w-4 h-4" />,
  'Executive Producer': <Award className="w-4 h-4" />,
  Screenplay: <PenTool className="w-4 h-4" />,
  Writer: <PenTool className="w-4 h-4" />,
  Cinematography: <Camera className="w-4 h-4" />,
  Creator: <Video className="w-4 h-4" />,
  Showrunner: <Award className="w-4 h-4" />,
};

const JOB_COLORS: Record<string, string> = {
  Director: 'text-blue-400',
  Producer: 'text-purple-400',
  'Executive Producer': 'text-purple-400',
  Screenplay: 'text-green-400',
  Writer: 'text-green-400',
  Cinematography: 'text-orange-400',
  Creator: 'text-blue-400',
  Showrunner: 'text-purple-400',
};

export default function CrewSection({ crew, mediaType = 'movie' }: CrewSectionProps) {
  if (!crew || crew.length === 0) return null;

  const keyJobs = mediaType === 'tv' 
    ? ['Creator', 'Executive Producer', 'Producer', 'Writer', 'Showrunner']
    : ['Director', 'Producer', 'Screenplay', 'Writer', 'Cinematography'];
  
  const filteredCrew = crew
    .filter((c) => keyJobs.includes(c.job))
    .slice(0, 8);

  if (filteredCrew.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-primary rounded-full" />
        <h2 className="text-2xl font-bold text-white">Key Crew</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredCrew.map((person) => {
          const icon = JOB_ICONS[person.job] || <Award className="w-4 h-4" />;
          const color = JOB_COLORS[person.job] || 'text-gray-400';

          return (
            <div
              key={person.id}
              className="group glass rounded-xl p-5 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex items-start gap-3">
                <div className={`${color} flex-shrink-0 mt-1`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm mb-1 truncate group-hover:text-primary transition-colors">
                    {person.name}
                  </p>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                    {person.job}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
