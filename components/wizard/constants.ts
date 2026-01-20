import { Brain, Zap, Heart, Ghost, Coffee, Film, Clock } from 'lucide-react';

export const VIBES = [
    { id: 'chill', label: 'Chill & Relax', icon: Coffee, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', genres: '35,10751', sort: 'popularity.desc' },
    { id: 'adrenaline', label: 'Adrenaline Rush', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', genres: '28,53', sort: 'popularity.desc' },
    { id: 'brain', label: 'Mind Bender', icon: Brain, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', genres: '878,9648', sort: 'vote_average.desc' },
    { id: 'feelgood', label: 'Feel Good', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/20', genres: '10749,35', sort: 'popularity.desc' },
    { id: 'dark', label: 'Dark & Gritty', icon: Ghost, color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20', genres: '80,27', sort: 'vote_count.desc' },
    { id: 'epic', label: 'Epic Adventure', icon: Film, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', genres: '12,14', sort: 'revenue.desc' },
];

export const RUNTIME_OPTIONS = [
    { id: 'short', label: 'Short', sub: '<90m', icon: Clock },
    { id: 'standard', label: 'Standard', sub: '90-120m', icon: Clock },
    { id: 'epic', label: 'Epic', sub: '2h+', icon: Clock },
    { id: 'any', label: 'Any', sub: 'All', icon: Clock },
];

export const ERAS = [
    { id: 'modern', label: 'Modern', sub: '2015+' },
    { id: '2000s', label: '2000s', sub: '2000-2014' },
    { id: '90s', label: '90s', sub: '1990-1999' },
    { id: 'classic', label: 'Classic', sub: 'Pre-1990' },
];
