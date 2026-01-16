export default function Loading() {
  return (
    <div className="min-h-screen bg-netflix-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Spinning loader */}
        <div className="relative">
          {/* Outer ring */}
          <div className="w-16 h-16 border-4 border-netflix-gray rounded-full"></div>
          {/* Spinning arc */}
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
        </div>
        
        {/* Loading text */}
        <p className="text-gray-400 text-sm font-medium tracking-wide animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}
