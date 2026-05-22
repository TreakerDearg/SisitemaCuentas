'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '../components/ui/Loading';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading size="lg" text="Redirigiendo..." />
    </div>
  );
}
