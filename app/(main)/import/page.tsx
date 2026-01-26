'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2, Info, LogIn, Plus } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { useToast } from '@/lib/contexts/ToastContext';

export default function ImportPage() {
  const { isSignedIn, isLoaded: authLoaded } = useUser();
  const { refresh } = useWatchlist();
  const toast = useToast();

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
  const [progress, setProgress] = useState<{
    type: string;
    progress: number;
    current: number;
    total: number;
    message: string;
    added?: number;
    skipped?: number;
    failed?: number;
    cached?: number;
    itemsPerSecond?: number;
    estimatedTimeRemaining?: number;
  } | null>(null);
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
      toast.showWarning('Please select a file and source type');
      return;
    }

    setLoading(true);
    setProgress(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('source', source);

      const response = await fetch('/api/import/stream', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        setResult({ success: false, error: 'Failed to start import' });
        setLoading(false);
        return;
      }

      // Read streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        setResult({ success: false, error: 'Failed to read response stream' });
        setLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              setProgress(data);

              if (data.type === 'complete') {
                setResult({
                  success: true,
                  total: data.total,
                  matched: data.total,
                  added: data.added || 0,
                  skipped: data.skipped || 0,
                  failed: data.failed || 0,
                });
                await refresh();
                setLoading(false);
                const addedCount = data.added || 0;
                const skippedCount = data.skipped || 0;
                if (addedCount > 0) {
                  toast.showSuccess(`Import complete! ${addedCount} item${addedCount !== 1 ? 's' : ''} added${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}`);
                } else {
                  toast.showInfo(`Import complete. ${skippedCount} item${skippedCount !== 1 ? 's were' : ' was'} skipped (already in watchlist)`);
                }
              } else if (data.type === 'error') {
                setResult({ success: false, error: data.message });
                setLoading(false);
                toast.showError(data.message || 'Import failed');
              }
            } catch (e) {
              console.error('Failed to parse SSE message:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import watchlist';
      setResult({ success: false, error: errorMessage });
      setLoading(false);
      toast.showError(errorMessage);
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

          {/* Progress Bar */}
          {progress && (
            <div className="space-y-4 p-5 rounded-lg border border-white/10 bg-netflix-dark/50 animate-fade-in">
              {/* Phase Indicator */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`flex-1 h-1 rounded-full ${progress.type === 'parsing' ? 'bg-primary' : 'bg-gray-700'}`} />
                <div className={`flex-1 h-1 rounded-full ${progress.type === 'matching' ? 'bg-primary' : 'bg-gray-700'}`} />
                <div className={`flex-1 h-1 rounded-full ${progress.type === 'saving' ? 'bg-primary' : 'bg-gray-700'}`} />
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <span className="text-sm font-semibold text-white block">{progress.message}</span>
                  {progress.type === 'matching' && progress.cached !== undefined && progress.cached > 0 && (
                    <span className="text-xs text-primary mt-1">
                      ⚡ {progress.cached} items found in cache
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-400 font-semibold">{Math.round(progress.progress)}%</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 block mb-1">Progress</span>
                  <div className="text-white font-semibold text-sm">
                    {progress.current.toLocaleString()} / {progress.total.toLocaleString()}
                  </div>
                </div>
                {progress.itemsPerSecond !== undefined && progress.itemsPerSecond > 0 && (
                  <div>
                    <span className="text-gray-500 block mb-1">Speed</span>
                    <div className="text-white font-semibold text-sm">
                      {progress.itemsPerSecond.toLocaleString()} items/sec
                    </div>
                  </div>
                )}
                {progress.estimatedTimeRemaining !== undefined && progress.estimatedTimeRemaining > 0 && (
                  <div>
                    <span className="text-gray-500 block mb-1">ETA</span>
                    <div className="text-white font-semibold text-sm">
                      {progress.estimatedTimeRemaining < 60 
                        ? `${Math.round(progress.estimatedTimeRemaining)}s`
                        : `${Math.round(progress.estimatedTimeRemaining / 60)}m`
                      }
                    </div>
                  </div>
                )}
                {progress.added !== undefined && (
                  <div>
                    <span className="text-gray-500 block mb-1">Added</span>
                    <div className="text-green-400 font-semibold text-sm">{progress.added.toLocaleString()}</div>
                  </div>
                )}
                {progress.skipped !== undefined && progress.skipped > 0 && (
                  <div>
                    <span className="text-gray-500 block mb-1">Skipped</span>
                    <div className="text-blue-400 font-semibold text-sm">{progress.skipped.toLocaleString()}</div>
                  </div>
                )}
                {progress.failed !== undefined && progress.failed > 0 && (
                  <div>
                    <span className="text-gray-500 block mb-1">Failed</span>
                    <div className="text-yellow-400 font-semibold text-sm">{progress.failed.toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
          )}

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
