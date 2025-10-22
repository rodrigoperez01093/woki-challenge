'use client';

import dynamic from 'next/dynamic';
import Toolbar from './components/toolbar/Toolbar';

// Disable SSR for Timeline to prevent hydration mismatch with @dnd-kit
const Timeline = dynamic(() => import('./components/timeline/Timeline'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <div className="text-sm text-gray-600">Cargando...</div>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="flex h-screen flex-col">
      <Toolbar />
      <div className="flex-1 overflow-hidden">
        <Timeline />
      </div>
    </div>
  );
}
