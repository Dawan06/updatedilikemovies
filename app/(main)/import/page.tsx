'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2, Info, LogIn, Plus } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useWatchlist } from '@/lib/hooks/useWatchlist';

export default function ImportPage() {
  const { isSignedIn, isLoaded: authLoaded } = useUser();
  const { addItem, refresh } = useWatchlist();

  // Show sign-in prompt for guests
  if (authLoaded && !isSignedIn) {
    return (
      <main className="min-h-screen bg-netflix-black px-4 md:px-12 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl text-white mb-3 tracking-wide">IMPORT WATCHLIST</h1>
            <p className="text-gray-400 text-lg">
              Upload your CSV file from IMDb or Letterboxd to add items to your watchlist
            </p>
          </div>

          <div className="glass rounded-xl p-8 text-center">
            <div className="relative inline-flex items-center justify-center mb-8">
              <div className="absolute w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              <div className="relative w-24 h-24 bg-netflix-dark rounded-2xl flex items-center justify-center border border-white/10">
                <Upload className="w-12 h-12 text-gray-600" />
              </div>
            </div>
            
            <h2 className="text-white text-2xl font-semibold mb-3">Sign in to import your watchlist</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Create an account or sign in to import your watchlist from IMDb or Letterboxd
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link 
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </Link>
              <Link 
                href="/sign-up"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 glass hover:bg-white/10 text-white rounded-lg font-semibold transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Account
              </Link>
            </div>
            
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-gray-500 text-sm mb-4">Or continue browsing</p>
              <Link 
                href="/"
                className="text-primary hover:underline"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<'imdb' | 'letterboxd' | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    total?: number;
    added?: number;
    skipped?: number;
    failed?: number;
    matched?: number;
    error?: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file || !source) {
      alert('Please select a file and source type');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('source', source);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save matched items to Supabase via batch API
        const items = data.items || [];
        
        const batchResponse = await fetch('/api/watchlist', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });

        let added = 0;
        let skipped = 0;
        const batchData = await batchResponse.json();
        
        if (batchResponse.ok && batchData.success !== false) {
          added = batchData.added || 0;
          skipped = batchData.skipped || 0;
          
          // Show errors if any
          if (batchData.errors && batchData.errors.length > 0) {
            console.error('[Import] Batch import errors:', batchData.errors);
            console.error('[Import] Sample error:', batchData.sampleError || batchData.errors[0]);
          }
        } else {
          // Fallback to individual adds if batch fails
          console.error('[Import] Batch request failed, falling back to individual adds');
          for (const item of items) {
            try {
              const success = await addItem(item.tmdb_id, item.media_type);
              if (success) {
                added++;
              } else {
                skipped++;
              }
            } catch (error) {
              console.error(`[Import] Error adding item ${item.tmdb_id}:`, error);
              skipped++;
            }
          }
        }

        // Refresh watchlist to show updated data
        await refresh();
        
        // Check if batch response had errors (all items failed to add)
        const hasErrors = batchData.errorCount > 0 || (added === 0 && skipped === items.length && items.length > 0);
        
        setResult({
          success: !hasErrors && added > 0,
          total: data.total,
          matched: data.matched,
          added,
          skipped,
          failed: data.failed,
          ...(hasErrors && {
            error: batchData.error || `Failed to add items. ${batchData.errorCount || skipped} errors occurred. Check server console for details.`,
            errorDetails: batchData.sampleError || batchData.errors?.[0]
          })
        });
      } else {
        setResult({ success: false, error: data.error || 'Import failed' });
      }
    } catch (error) {
      console.error('Import error:', error);
      setResult({ success: false, error: 'Failed to import watchlist' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-netflix-black px-4 md:px-12 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl text-white mb-3 tracking-wide">IMPORT WATCHLIST</h1>
          <p className="text-gray-400 text-lg">
            Upload your CSV file from IMDb or Letterboxd to add items to your watchlist
          </p>
        </div>

        {/* Main Card */}
        <div className="glass rounded-xl p-6 md:p-8 space-y-6">
          {/* Source Selection */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Select Source
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setSource('imdb')}
                className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all duration-200 font-semibold ${
                  source === 'imdb'
                    ? 'bg-primary border-primary text-white shadow-lg'
                    : 'bg-netflix-dark border-white/10 text-gray-300 hover:border-white/20 hover:text-white'
                }`}
              >
                IMDb
              </button>
              <button
                onClick={() => setSource('letterboxd')}
                className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all duration-200 font-semibold ${
                  source === 'letterboxd'
                    ? 'bg-primary border-primary text-white shadow-lg'
                    : 'bg-netflix-dark border-white/10 text-gray-300 hover:border-white/20 hover:text-white'
                }`}
              >
                Letterboxd
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              CSV File
            </label>
            <label className="block cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className={`flex items-center justify-center gap-3 px-6 py-4 rounded-lg border-2 border-dashed transition-all duration-200 ${
                file 
                  ? 'border-primary bg-primary/10' 
                  : 'border-white/20 bg-netflix-dark hover:border-white/30'
              }`}>
                <Upload className={`w-5 h-5 ${file ? 'text-primary' : 'text-gray-400'}`} />
                <span className={`font-medium ${file ? 'text-primary' : 'text-gray-400'}`}>
                  {file ? file.name : 'Choose CSV file'}
                </span>
              </div>
            </label>
            {file && (
              <p className="mt-2 text-sm text-gray-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
              </p>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-netflix-dark/50 border border-white/10 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-white">How to Export</h3>
            </div>
            <ul className="text-sm text-gray-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong className="text-white">IMDb:</strong> Go to your watchlist, click the three dots menu, select &quot;Export&quot; and download the CSV file.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong className="text-white">Letterboxd:</strong> Go to Settings → Import & Export → Export Your Data, then use the &quot;watched.csv&quot; or &quot;watchlist.csv&quot; file.
                </span>
              </li>
            </ul>
          </div>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={!file || !source || loading}
            className={`w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              !file || !source || loading
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-primary-dark text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Importing... (this may take a minute)
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Import Watchlist
              </>
            )}
          </button>

          {/* Results */}
          {result && (
            <div
              className={`p-5 rounded-lg border-2 animate-fade-in-up ${
                result.success
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              {result.success ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-semibold text-lg">Import Successful!</span>
                  </div>
                  {result.total !== undefined && (
                    <div className="text-sm text-gray-300 space-y-1.5 ml-8">
                      <p><span className="text-gray-400">Total items in file:</span> <span className="text-white font-medium">{result.total}</span></p>
                      <p><span className="text-gray-400">Matched with TMDB:</span> <span className="text-white font-medium">{result.matched || 0}</span></p>
                      <p className="text-green-400 font-medium">Added to watchlist: {result.added || 0}</p>
                      {result.skipped !== undefined && result.skipped > 0 && (
                        <p className="text-blue-400">Already in list (skipped): {result.skipped}</p>
                      )}
                      {result.failed !== undefined && result.failed > 0 && (
                        <p className="text-yellow-400">Could not match: {result.failed}</p>
                      )}
                    </div>
                  )}
                  <Link
                    href="/my-list"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
                  >
                    View My List
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-6 h-6" />
                  <span className="font-medium">{result.error || 'Import failed'}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
