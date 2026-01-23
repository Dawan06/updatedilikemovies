/**
 * Image preloading utilities for carousel performance optimization
 * Preloads next/previous slide images to provide smooth transitions
 */

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    img.src = src;
  });
}

export async function preloadImages(srcs: string[]): Promise<void> {
  await Promise.all(srcs.map((src) => preloadImage(src).catch(() => null)));
}

/**
 * Build TMDB image URLs for preloading
 * @param imagePath - TMDB image path (e.g., "/abcdef.jpg")
 * @param size - Image size (w300, w500, etc.)
 * @returns Full TMDB image URL
 */
export function getTMDBImageUrl(imagePath: string | null, size: string = 'w300'): string {
  if (!imagePath) return '';
  return `https://image.tmdb.org/t/p/${size}${imagePath}`;
}
