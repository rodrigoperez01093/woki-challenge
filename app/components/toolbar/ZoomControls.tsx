'use client';

import { useReservationStore } from '@/store/useReservationStore';
import { ZOOM_LEVELS } from '@/lib/constants';

/**
 * Zoom level controls
 */
export default function ZoomControls() {
  const zoomLevel = useReservationStore((state) => state.zoomLevel);
  const setZoomLevel = useReservationStore((state) => state.setZoomLevel);

  const currentIndex = ZOOM_LEVELS.indexOf(
    zoomLevel as (typeof ZOOM_LEVELS)[number]
  );
  const canZoomOut = currentIndex > 0;
  const canZoomIn = currentIndex < ZOOM_LEVELS.length - 1;

  const zoomOut = () => {
    if (canZoomOut) {
      setZoomLevel(ZOOM_LEVELS[currentIndex - 1]);
    }
  };

  const zoomIn = () => {
    if (canZoomIn) {
      setZoomLevel(ZOOM_LEVELS[currentIndex + 1]);
    }
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  return (
    <div className="flex items-center gap-1 rounded-md border border-gray-300 bg-white p-1">
      {/* Zoom Out */}
      <button
        onClick={zoomOut}
        disabled={!canZoomOut}
        className="rounded px-2 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
        aria-label="Alejar"
      >
        −
      </button>

      {/* Current Zoom Level */}
      <button
        onClick={resetZoom}
        className="min-w-[60px] rounded px-3 py-1 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100"
        title="Click para resetear al 100%"
      >
        {Math.round(zoomLevel * 100)}%
      </button>

      {/* Zoom In */}
      <button
        onClick={zoomIn}
        disabled={!canZoomIn}
        className="rounded px-2 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
        aria-label="Acercar"
      >
        +
      </button>
    </div>
  );
}
