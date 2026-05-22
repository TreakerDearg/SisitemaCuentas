'use client';

import { useState, useEffect } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    const toast = { id, message, type };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return {
    toasts,
    addToast,
    removeToast
  };
}

export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-2 right-2 lg:top-4 lg:right-4 z-50 flex flex-col gap-2 lg:gap-3 max-w-[calc(100vw-2rem)] lg:max-w-md">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 lg:px-6 lg:py-4 rounded-xl shadow-2xl text-white font-semibold text-sm lg:text-base
            ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-green-600' : ''}
            ${toast.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-600' : ''}
            ${toast.type === 'warning' ? 'bg-gradient-to-r from-amber-500 to-orange-600' : ''}
            ${toast.type === 'info' ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : ''}
            animate-slide-in backdrop-blur-xl border border-white/20
          `}
        >
          <div className="flex items-center gap-2 lg:gap-3">
            {toast.type === 'success' && (
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {toast.type === 'warning' && (
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {toast.type === 'info' && (
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="truncate">{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
