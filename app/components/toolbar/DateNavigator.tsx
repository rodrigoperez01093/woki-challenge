'use client';

import { useState, useEffect } from 'react';
import { useReservationStore } from '@/store/useReservationStore';
import { formatDateLong, formatDateShort } from '@/lib/utils/dateUtils';
import { addDays } from 'date-fns';

/**
 * Date navigation controls
 */
export default function DateNavigator() {
  const selectedDate = useReservationStore((state) => state.selectedDate);
  const setSelectedDate = useReservationStore((state) => state.setSelectedDate);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration errors by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const goToPreviousDay = () => {
    setSelectedDate(addDays(selectedDate, -1));
  };

  const goToNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);
  };

  const isToday = isMounted
    ? new Date().toDateString() === selectedDate.toDateString()
    : false;

  return (
    <div className="flex items-center gap-2">
      {/* Previous Day */}
      <button
        onClick={goToPreviousDay}
        className="rounded-md border border-gray-300 p-2 text-gray-700 transition-colors hover:bg-gray-50"
        aria-label="Día anterior"
      >
        ◀
      </button>

      {/* Current Date Display */}
      <div className="min-w-[100px] text-center md:min-w-[280px]">
        <div className="text-sm font-semibold text-gray-900">
          {isMounted ? (
            <>
              <span className="md:hidden">{formatDateShort(selectedDate)}</span>
              <span className="hidden md:inline">
                {formatDateLong(selectedDate)}
              </span>
            </>
          ) : (
            ''
          )}
        </div>
      </div>

      {/* Next Day */}
      <button
        onClick={goToNextDay}
        className="rounded-md border border-gray-300 p-2 text-gray-700 transition-colors hover:bg-gray-50"
        aria-label="Día siguiente"
      >
        ▶
      </button>

      {/* Today Button */}
      {!isToday && (
        <button
          onClick={goToToday}
          className="ml-2 rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
        >
          Hoy
        </button>
      )}
    </div>
  );
}
