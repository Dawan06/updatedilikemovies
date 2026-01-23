/**
 * Progressive Image Loading
 * Loads ultra-low quality placeholder instantly, then upgrades to full quality
 * Creates the illusion of "instant" load with visual progression
 */

export interface ProgressiveImageConfig {
  path: string | null;
  size: 'w154' | 'w200' | 'w300' | 'w500' | 'w780' | 'w1280' | 'original';
  priority?: boolean;
}

/**
 * Get placeholder URL with ultra-low quality for instant loading
 * This is the "horrible" quality version that loads instantly
 * Quality = 20 for fastest possible load (blur effect)
 */
export function getPlaceholderImageUrl(
  path: string | null,
  placeholderSize: 'w92' | 'w154' | 'w200' = 'w92'
): string {
  if (!path) return '';
  // Use smallest possible size (w92 typically ~5-8KB at quality 20)
  return `https://image.tmdb.org/t/p/${placeholderSize}${path}`;
}

/**
 * Get full quality URL for progressive upgrade
 * This loads in background while placeholder displays
 */
export function getFullQualityImageUrl(
  path: string | null,
  fullSize: 'w154' | 'w200' | 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w300'
): string {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/${fullSize}${path}`;
}

/**
 * Generate blur data URL for ultra-fast placeholder
 * Using tiny SVG instead of actual image for instant render
 * Color parameter allows theme-aware placeholders
 */
export function getBlurPlaceholder(dominantColor: string = 'rgb(30, 30, 30)'): string {
  // Use small 1x1 pixel encoded as data URL - renders instantly
  const encodedColor = encodeURIComponent(dominantColor);
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect fill='${encodedColor}' width='1' height='1'/%3E%3C/svg%3E`;
}

/**
 * Preload full quality image in background
 * Non-blocking, silent failure
 */
export function preloadFullQualityImage(src: string): void {
  if (typeof window === 'undefined') return;
  
  const img = new Image();
  img.src = src;
  // Silent - don't throw on error
  img.onerror = () => null;
}

/**
 * Get adaptive quality based on network speed
 * Placeholder: always 20 (horrible quality, instant)
 * Full quality: 50-75 depending on connection
 */
export function getProgressiveQuality(stage: 'placeholder' | 'full'): number {
  if (stage === 'placeholder') return 20; // Ultra-low for instant load
  
  // Full quality adapted to connection speed
  if (typeof window === 'undefined') return 75;
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection;
  if (!connection) return 75;
  
  const effectiveType = connection.effectiveType;
  if (effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g') {
    return 50; // Lower quality for slow connections
  }
  return 75; // Full quality for fast connections
}

/**
 * Create progressive image props for Next.js Image component
 * Returns object with placeholder and full quality URLs
 * 
 * Usage:
 * const imageProps = createProgressiveImageProps(posterPath, 'w500');
 * <Image {...imageProps} src={imageProps.fullSrc} />
 */
export function createProgressiveImageProps(
  path: string | null,
  fullSize: 'w154' | 'w200' | 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w300'
) {
  if (!path) {
    return {
      placeholderSrc: '',
      fullSrc: '',
      blurDataUrl: getBlurPlaceholder(),
      placeholderQuality: 20,
      fullQuality: 75,
    };
  }

  // Determine placeholder size (use smallest for fastest load)
  let placeholderSize: 'w92' | 'w154' | 'w200' = 'w92';
  if (fullSize === 'w154' || fullSize === 'w200') {
    placeholderSize = 'w154';
  }

  return {
    placeholderSrc: getPlaceholderImageUrl(path, placeholderSize),
    fullSrc: getFullQualityImageUrl(path, fullSize),
    blurDataUrl: getBlurPlaceholder(),
    placeholderQuality: 20,
    fullQuality: getProgressiveQuality('full'),
  };
}
