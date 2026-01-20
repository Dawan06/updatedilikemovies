'use client';

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-netflix-black flex items-center justify-center px-4">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-4">You're Offline</h1>
                <p className="text-gray-400 mb-8 max-w-md">
                    It looks like you've lost your internet connection.
                    Don't worry - your cached content is still available!
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
