'use client';

import { forwardRef } from 'react';
import {
  SLOT_WIDTH,
  SLOT_DURATION,
  START_HOUR,
  TOTAL_SLOTS,
  GRID_WIDTH,
} from '@/lib/constants';
import { formatTime } from '@/lib/utils/dateUtils';

interface TimelineHeaderProps {
  zoomLevel: number;
}

/**
 * Timeline header with time slots
 * Shows time labels from START_HOUR to END_HOUR
 */
const TimelineHeader = forwardRef<HTMLDivElement, TimelineHeaderProps>(
  ({ zoomLevel }, ref) => {
    // Generate time slots
    const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
      const totalMinutes = START_HOUR * 60 + i * SLOT_DURATION;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      const date = new Date();
      date.setHours(hours, minutes, 0, 0);

      return {
        index: i,
        time: date,
        label: formatTime(date),
        isHour: minutes === 0,
        isHalfHour: minutes === 30,
      };
    });

    const scaledWidth = GRID_WIDTH * zoomLevel;
    const scaledSlotWidth = SLOT_WIDTH * zoomLevel;

    return (
      <div
        ref={ref}
        className="flex overflow-x-auto overflow-y-hidden bg-white scrollbar-none"
        style={{ width: '100%' }}
      >
        <div
          className="flex"
          style={{
            width: `${scaledWidth}px`,
            minWidth: `${scaledWidth}px`,
            maxWidth: `${scaledWidth}px`,
          }}
        >
          {slots.map((slot) => (
            <div
              key={slot.index}
              className={`
                flex shrink-0 items-center justify-center
                border-r text-sm font-medium
                ${
                  slot.isHour
                    ? 'border-gray-300 bg-gray-50 font-semibold text-gray-700'
                    : slot.isHalfHour
                      ? 'border-gray-200 text-gray-600'
                      : 'border-gray-100 text-gray-500'
                }
              `}
              style={{ width: `${scaledSlotWidth}px` }}
            >
              {slot.isHour || slot.isHalfHour ? slot.label : ''}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

TimelineHeader.displayName = 'TimelineHeader';

export default TimelineHeader;
