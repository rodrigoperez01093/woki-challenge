'use client';

import { useEffect, useState } from 'react';
import {
  CURRENT_TIME_COLOR,
  CURRENT_TIME_LINE_WIDTH,
  CURRENT_TIME_MARKER_SIZE,
  Z_INDEX,
} from '@/lib/constants';
import { timeToX } from '@/lib/utils/coordinateUtils';
import { getCurrentTime, isSameDay } from '@/lib/utils/dateUtils';

interface CurrentTimeLineProps {
  selectedDate: Date;
  zoomLevel: number;
  totalHeight?: number;
}

/**
 * Current time indicator (red vertical line)
 * Only shows if selected date is today
 */
export default function CurrentTimeLine({
  selectedDate,
  zoomLevel,
  totalHeight,
}: CurrentTimeLineProps) {
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true on mount (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Don't render on server or before hydration
  if (!isClient || !currentTime) {
    return null;
  }

  // Don't show line if not today
  if (!isSameDay(selectedDate, currentTime)) {
    return null;
  }

  const xPosition = timeToX(currentTime, selectedDate) * zoomLevel;

  return (
    <div
      className="pointer-events-none absolute top-0"
      style={{
        left: `${xPosition}px`,
        width: `${CURRENT_TIME_LINE_WIDTH}px`,
        height: totalHeight ? `${totalHeight}px` : '100%',
        backgroundColor: CURRENT_TIME_COLOR,
        zIndex: Z_INDEX.CURRENT_TIME_LINE,
      }}
    >
      {/* Marker dot at the top */}
      <div
        className="absolute rounded-full border-2 border-white shadow-md"
        style={{
          top: `-${CURRENT_TIME_MARKER_SIZE / 2}px`,
          left: `-${CURRENT_TIME_MARKER_SIZE / 2 - 1}px`,
          width: `${CURRENT_TIME_MARKER_SIZE}px`,
          height: `${CURRENT_TIME_MARKER_SIZE}px`,
          backgroundColor: CURRENT_TIME_COLOR,
        }}
      />
    </div>
  );
}
