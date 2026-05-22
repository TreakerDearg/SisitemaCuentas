'use client';

export function Card({ children, className = '' }) {
  return (
    <div className={`glass-gradient rounded-2xl shadow-xl border border-white/40 card-hover ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`p-4 lg:p-6 border-b border-indigo-100/50 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`p-4 lg:p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg lg:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent ${className}`}>
      {children}
    </h3>
  );
}
