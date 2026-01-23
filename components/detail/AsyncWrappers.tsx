import { cachedTmdbClient } from '@/lib/tmdb/cached-client';
import PhotoGallery from '@/components/detail/PhotoGallery';
import SimilarContent from '@/components/detail/SimilarContent';
import ReviewsSection from '@/components/detail/ReviewsSection';

export async function AsyncPhotoGallery({ id, title, type }: { id: number; title: string; type: 'movie' | 'tv' }) {
    const images = type === 'movie'
        ? await cachedTmdbClient.getMovieImages(id)
        : await cachedTmdbClient.getTVImages(id);

    // Filter for English or null language images if needed, or just take all
    // TMDB returns all languages by default usually, or based on query param
    // For now, pass all. The PhotoGallery component handles slicing.

    return <PhotoGallery backdrops={images.backdrops} posters={images.posters} title={title} />;
}

export async function AsyncSimilarContent({ id, type }: { id: number; type: 'movie' | 'tv' }) {
    const similar = type === 'movie'
        ? await cachedTmdbClient.getSimilarMovies(id)
        : await cachedTmdbClient.getSimilarTV(id);

    const recommendations = type === 'movie'
        ? await cachedTmdbClient.getMovieRecommendations(id)
        : await cachedTmdbClient.getTVRecommendations(id);

    return <SimilarContent items={similar.results} recommendations={recommendations.results} mediaType={type} />;
}

export async function AsyncReviewsSection({ id, type }: { id: number; type: 'movie' | 'tv' }) {
    const reviews = type === 'movie'
        ? await cachedTmdbClient.getMovieReviews(id)
        : await cachedTmdbClient.getTVReviews(id);

    return <ReviewsSection reviews={reviews.results} totalResults={reviews.total_results} />;
}
