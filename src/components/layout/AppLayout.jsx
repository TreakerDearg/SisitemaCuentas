'use client';

import { Sidebar } from './Sidebar';
import { useToast, ToastContainer } from '../../utils/toast';

export function AppLayout({ children }) {
  const { toasts, removeToast } = useToast();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 via-purple-50 to-slate-100">
      <Sidebar />
      <main className="flex-1 lg:ml-72 p-3 lg:p-8 pt-16 lg:pt-8 overflow-x-hidden">
        {children}
      </main>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
