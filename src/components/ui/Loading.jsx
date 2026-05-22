export function Loading({ size = 'md', text = 'Cargando...' }) {
  const sizeStyles = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className={`animate-spin rounded-full border-4 border-purple-200 border-t-indigo-600 ${sizeStyles[size]}`} />
        {text && (
          <span className="text-sm font-medium text-slate-600">{text}</span>
        )}
      </div>
    </div>
  );
}

export function LoadingSkeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gradient-to-r from-purple-100 to-indigo-100 rounded ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
      <LoadingSkeleton className="h-5 w-1/3 mb-3" />
      <LoadingSkeleton className="h-10 w-1/2 mb-6" />
      <div className="space-y-3">
        <LoadingSkeleton className="h-4 w-full" />
        <LoadingSkeleton className="h-4 w-full" />
        <LoadingSkeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-purple-100">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-purple-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <LoadingSkeleton key={colIndex} className="h-5 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
