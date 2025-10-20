'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Reservation } from '@/types';
import {
  STATUS_COLORS,
  PRIORITY_STYLES,
  RESERVATION_VERTICAL_GAP,
  Z_INDEX,
} from '@/lib/constants';
import { timeToX, durationToWidth } from '@/lib/utils/coordinateUtils';
import { formatTimeRange } from '@/lib/utils/dateUtils';
import { useReservationStore } from '@/store/useReservationStore';

interface ReservationBlockProps {
  reservation: Reservation;
  zoomLevel: number;
}

export default function ReservationBlock({
  reservation,
  zoomLevel,
}: ReservationBlockProps) {
  const selectedDate = useReservationStore((state) => state.selectedDate);
  const selectedReservationIds = useReservationStore(
    (state) => state.selectedReservationIds
  );

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: reservation.id,
      data: {
        reservation,
        type: 'reservation',
      },
    });

  const isSelected = selectedReservationIds.includes(reservation.id);

  // position and size
  const startTime = new Date(reservation.startTime);
  const left = timeToX(startTime, selectedDate);
  const width = durationToWidth(reservation.durationMinutes);

  const statusColors = STATUS_COLORS[reservation.status];
  const priorityStyles = PRIORITY_STYLES[reservation.priority];

  const style = {
    position: 'absolute' as const,
    left: `${left}px`,
    width: `${width}px`,
    top: `${RESERVATION_VERTICAL_GAP}px`,
    bottom: `${RESERVATION_VERTICAL_GAP}px`,
    transform: transform
      ? `${CSS.Translate.toString(transform)} scale(${zoomLevel})`
      : `scale(${zoomLevel})`,
    transformOrigin: 'left top',
    zIndex: isDragging
      ? Z_INDEX.RESERVATION_DRAGGING
      : isSelected
        ? Z_INDEX.RESERVATION_HOVER
        : Z_INDEX.RESERVATION,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'move',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        flex flex-col gap-1 rounded-md p-2 shadow-sm transition-all
        ${statusColors.bg} ${statusColors.text}
        ${priorityStyles.border}
        ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
        hover:shadow-md hover:-translate-y-0.5
      `}
    >
      {/* Customer name */}
      <div className="flex items-center gap-1 text-xs font-bold">
        {reservation.priority === 'VIP' && <span>⭐</span>}
        <span className="truncate">{reservation.customer.name}</span>
      </div>

      {/* Details */}
      <div className="flex items-center gap-2 text-[10px] opacity-90">
        <span>👥 {reservation.partySize}</span>
        <span className="truncate">
          {formatTimeRange(reservation.startTime, reservation.endTime)}
        </span>
      </div>

      {/* Notes indicator */}
      {reservation.notes && (
        <div className="text-[10px] opacity-75" title={reservation.notes}>
          📝
        </div>
      )}
    </div>
  );
}
