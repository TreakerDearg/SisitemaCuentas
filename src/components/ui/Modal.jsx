'use client';

import { useEffect } from 'react';

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md'
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 lg:p-4 animate-scale-in">
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className={`relative glass-gradient rounded-2xl shadow-2xl w-full ${sizeStyles[size]} max-h-[90vh] overflow-y-auto border border-white/30 animate-slide-in`}>
        <div className="sticky top-0 glass rounded-t-2xl flex items-center justify-between p-4 lg:p-6 border-b border-indigo-100/50 z-10">
          <h2 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-xl touch-manipulation button-hover"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
