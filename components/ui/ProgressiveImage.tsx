'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { createProgressiveImageProps } from '@/lib/progressive-image-loader';

interface ProgressiveImageProps {
  src: string | null;
  alt: string;
  fullSize?: 'w154' | 'w200' | 'w300' | 'w500' | 'w780' | 'w1280' | 'original';
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onLoadComplete?: () => void;
}

/**
 * Progressive Image Component
 * Loads ultra-low quality placeholder instantly, then upgrades to full quality
 * 
 * Gives the illusion of instant loading while progressively improving quality
 * 
 * Usage:
 * <ProgressiveImage
 *   src={posterPath}
 *   alt="Movie Poster"
 *   fullSize="w500"
 *   sizes="(max-width: 768px) 180px, 220px"
 *   priority
 * />
 */
export default function ProgressiveImage({
  src,
  alt,
  fullSize = 'w300',
  fill,
  width,
  height,
  className,
  sizes,
  priority = false,
  onLoadComplete,
}: ProgressiveImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fullQualityReady, setFullQualityReady] = useState(false);

  const props = createProgressiveImageProps(src, fullSize);

  // Preload full quality image in background
  useEffect(() => {
    if (!props.fullSrc) return;

    const img = document.createElement('img');
    img.onload = () => {
      setFullQualityReady(true);
    };
    img.onerror = () => {
      // Fallback - just show placeholder
      setFullQualityReady(true);
    };
    img.src = props.fullSrc;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [props.fullSrc]);

  const handleLoadingComplete = () => {
    setImageLoaded(true);
    onLoadComplete?.();
  };

  if (!src) {
    return null;
  }

  const commonProps = {
    alt,
    className: `transition-opacity duration-500 ${
      fullQualityReady ? 'opacity-100' : 'opacity-75'
    } ${className || ''}`,
    sizes,
    priority,
    onLoadingComplete: handleLoadingComplete,
  };

  // Use full quality image if ready, otherwise show placeholder with blur
  const currentSrc = fullQualityReady && imageLoaded ? props.fullSrc : props.placeholderSrc;
  const currentQuality = fullQualityReady && imageLoaded ? props.fullQuality : props.placeholderQuality;

  if (fill) {
    return (
      <Image
        {...commonProps}
        src={currentSrc}
        fill
        quality={currentQuality}
      />
    );
  }

  return (
    <Image
      {...commonProps}
      src={currentSrc}
      width={width}
      height={height}
      quality={currentQuality}
    />
  );
}
