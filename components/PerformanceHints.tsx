'use client';

import { useEffect } from 'react';

export default function PerformanceHints() {
  useEffect(() => {
    // Add preconnect hints for external domains
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://image.tmdb.org';
    preconnect.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect);

    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = 'https://image.tmdb.org';
    document.head.appendChild(dnsPrefetch);

    return () => {
      // Cleanup on unmount
      document.head.removeChild(preconnect);
      document.head.removeChild(dnsPrefetch);
    };
  }, []);

  return null;
}
