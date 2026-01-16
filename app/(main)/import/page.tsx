'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import { addManyToWatchlist } from '@/lib/watchlist-storage';

export default function ImportPage() {
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
        // Save matched items to localStorage
        const items = data.items || [];
        const { added, skipped } = addManyToWatchlist(items);
        
        setResult({
          success: true,
          total: data.total,
          matched: data.matched,
          added,
          skipped,
          failed: data.failed,
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
