'use client';

import FranchiseCard from './FranchiseCard';
import { FranchiseCard as FranchiseCardType } from '@/types';

interface FranchiseGridProps {
  readonly franchises: FranchiseCardType[];
  readonly title: string;
}

export default function FranchiseGrid({ franchises, title }: FranchiseGridProps) {
  if (franchises.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 px-4 md:px-0">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {franchises.map((franchise, index) => (
          <FranchiseCard 
            key={franchise.collection.id} 
            franchise={franchise}
            priority={index < 6} // Priority load first 6 cards (above fold)
          />
        ))}
      </div>
    </section>
  );
}
