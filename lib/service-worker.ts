/**
 * Service Worker Registration
 * 
 * Registers the service worker for offline support and caching.
 * Must be called from client-side only.
 */

export async function registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        console.log('[SW] Service workers not supported');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
        });

        console.log('[SW] Service worker registered:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
            registration.update();
        }, 60 * 60 * 1000); // Check every hour

        // Listen for updates
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;

            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New version available - could show update notification
                        console.log('[SW] New version available! Refresh to update.');
                    }
                });
            }
        });
    } catch (error) {
        console.error('[SW] Registration failed:', error);
    }
}

/**
 * Clear all caches manually
 */
export async function clearAllCaches() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const messageChannel = new MessageChannel();

        return new Promise((resolve) => {
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.success);
            };

            registration.active?.postMessage(
                { action: 'clearCache' },
                [messageChannel.port2]
            );
        });
    } catch (error) {
        console.error('[SW] Failed to clear caches:', error);
        return false;
    }
}

/**
 * Check if service worker is active
 */
export function isServiceWorkerActive(): boolean {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return false;
    }

    return navigator.serviceWorker.controller !== null;
}
