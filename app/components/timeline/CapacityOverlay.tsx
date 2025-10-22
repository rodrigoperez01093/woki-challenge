'use client';

import { useMemo, forwardRef } from 'react';
import { useReservationStore } from '@/store/useReservationStore';
import {
  calculateCapacityByTimeSlot,
  getOccupancyColor,
  formatTimeSlot,
  type TimeSlotCapacity,
} from '@/store/utils/capacityAnalytics';
import { SLOT_WIDTH, START_HOUR, END_HOUR, GRID_WIDTH } from '@/lib/constants';

interface CapacityOverlayProps {
  zoomLevel: number;
  onTimeSlotClick?: (hour: number, minute: number) => void;
}

const CapacityOverlay = forwardRef<HTMLDivElement, CapacityOverlayProps>(
  ({ zoomLevel, onTimeSlotClick }, ref) => {
    const selectedDate = useReservationStore((state) => state.selectedDate);
    const tables = useReservationStore((state) => state.tables);
    const allReservations = useReservationStore((state) => state.reservations);
    const getFilteredReservations = useReservationStore(
      (state) => state.getFilteredReservations
    );

    // Get reservations for the selected date
    const reservations = useMemo(
      () => getFilteredReservations(),
      // eslint-disable-next-line
      [getFilteredReservations, allReservations, selectedDate] // Re-calculate when reservations or date change
    );

    // Calculate capacity for each time slot
    const capacityData = useMemo(
      () =>
        calculateCapacityByTimeSlot(
          reservations,
          tables,
          selectedDate,
          START_HOUR,
          END_HOUR
        ),
      [reservations, tables, selectedDate, allReservations] // eslint-disable-line
    );

    // Calculate max occupancy for scaling the bars
    const maxOccupancy = useMemo(
      () => Math.max(...capacityData.map((slot) => slot.occupancyRate), 0),
      [capacityData]
    );

    const handleSlotClick = (slot: TimeSlotCapacity) => {
      if (onTimeSlotClick) {
        onTimeSlotClick(slot.hour, slot.minute);
      }
    };

    // Calculate dimensions to match timeline
    const scaledWidth = GRID_WIDTH * zoomLevel;
    const scaledSlotWidth = SLOT_WIDTH * zoomLevel;
    const overlayHeight = 60; // Height of the overlay in pixels

    return (
      <div
        ref={ref}
        className="overflow-x-auto overflow-y-hidden bg-gray-50 scrollbar-none"
        style={{ width: '100%' }}
      >
        <div
          className="relative flex items-end"
          style={{
            width: `${scaledWidth}px`,
            minWidth: `${scaledWidth}px`,
            maxWidth: `${scaledWidth}px`,
            height: `${overlayHeight}px`,
          }}
        >
          {capacityData.map((slot) => {
            const color = getOccupancyColor(slot.occupancyRate);

            // Calculate bar height (max 80% of container to leave space for labels)
            const heightPercent =
              maxOccupancy > 0 ? (slot.occupancyRate / maxOccupancy) * 80 : 0;

            return (
              <button
                key={`${slot.hour}-${slot.minute}`}
                type="button"
                onClick={() => handleSlotClick(slot)}
                className="group relative flex-shrink-0 transition-all hover:opacity-80"
                style={{
                  width: `${scaledSlotWidth}px`,
                  height: '100%',
                }}
                title={`${formatTimeSlot(slot)} - ${slot.occupancyRate.toFixed(0)}% ocupado`}
              >
                {/* Bar */}
                <div
                  className={`absolute bottom-0 left-0 right-0 ${color.bg} rounded-t transition-all`}
                  style={{
                    height: `${heightPercent}%`,
                    minHeight: slot.occupancyRate > 0 ? '2px' : '0px',
                  }}
                />

                {/* Hover tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:block group-hover:opacity-100">
                  <div className="font-semibold">{formatTimeSlot(slot)}</div>
                  <div className="text-gray-300">
                    {slot.occupiedSeats}/{slot.totalCapacity} asientos
                  </div>
                  <div className="font-medium text-white">
                    {slot.occupancyRate.toFixed(0)}% - {color.label}
                  </div>
                  <div className="mt-1 text-gray-400">
                    {slot.reservationCount} reserva
                    {slot.reservationCount !== 1 ? 's' : ''}
                  </div>
                  {/* Arrow */}
                  <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>

                {/* Show percentage on high occupancy slots */}
                {slot.occupancyRate >= 70 && (
                  <div
                    className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-700"
                    style={{ marginBottom: '2px' }}
                  >
                    {slot.occupancyRate.toFixed(0)}%
                  </div>
                )}
              </button>
            );
          })}

          {/* Legend in absolute position */}
          <div className="absolute right-3 top-2 flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-green-500" />
              <span className="text-gray-600">&lt;70%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-yellow-500" />
              <span className="text-gray-600">70-90%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-red-500" />
              <span className="text-gray-600">&gt;90%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CapacityOverlay.displayName = 'CapacityOverlay';

export default CapacityOverlay;
