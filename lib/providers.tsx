'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { registerServiceWorker } from './service-worker';
import { ToastProvider } from './contexts/ToastContext';

export function Providers({ children }: { children: React.ReactNode }) {
    // Create QueryClient inside component to avoid sharing between requests
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Stale time: Data is considered fresh for 30 minutes
                        staleTime: 1000 * 60 * 30,
                        // Cache time: Keep unused data in cache for 1 hour
                        gcTime: 1000 * 60 * 60,
                        // Don't refetch on window focus (saves API calls)
                        refetchOnWindowFocus: false,
                        // Don't refetch on component mount if data is fresh
                        refetchOnMount: false,
                        // Retry failed requests only once
                        retry: 1,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                {children}
            </ToastProvider>
        </QueryClientProvider>
    );
}
