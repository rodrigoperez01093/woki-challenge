'use client';

import { useDroppable } from '@dnd-kit/core';
import type { Table, Reservation } from '@/types';
import { GRID_LINE_COLORS, SLOT_WIDTH, TOTAL_SLOTS } from '@/lib/constants';
import { xToTime } from '@/lib/utils/coordinateUtils';
import { useReservationStore } from '@/store/useReservationStore';
import ReservationBlock from './ReservationBlock';
import { memo, useMemo } from 'react';

interface TableRowProps {
  table: Table;
  reservations: Reservation[];
  zoomLevel: number;
  rowHeight: number;
  onEditReservation?: (reservation: Reservation) => void;
  onContextMenu?: (reservation: Reservation, x: number, y: number) => void;
  onEmptySlotClick?: (tableId: string, clickTime: Date) => void;
}

function TableRow({
  table,
  reservations,
  zoomLevel,
  rowHeight,
  onEditReservation,
  onContextMenu,
  onEmptySlotClick,
}: TableRowProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `table-${table.id}`,
    data: {
      tableId: table.id,
      type: 'table-row',
    },
  });

  const selectedDate = useReservationStore((state) => state.selectedDate);

  const scaledSlotWidth = SLOT_WIDTH * zoomLevel;
  const totalWidth = TOTAL_SLOTS * scaledSlotWidth;

  // Memoize grid cells - only recreate when zoomLevel changes
  const gridCells = useMemo(() => {
    return Array.from({ length: TOTAL_SLOTS }, (_, i) => {
      const isHour = i % 4 === 0;
      const isHalfHour = i % 2 === 0;

      return {
        index: i,
        isHour,
        isHalfHour,
      };
    });
  }, []); // Grid cells never change

  const handleRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle clicks directly on the row (not on reservation blocks)
    if (e.target !== e.currentTarget) return;

    // Get the click position relative to the row
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;

    // Adjust for zoom level
    const actualX = clickX / zoomLevel;

    // Convert X position to time
    const clickTime = xToTime(actualX, selectedDate);

    // Call the callback
    onEmptySlotClick?.(table.id, clickTime);
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleRowClick}
      className={`
        relative border-b cursor-pointer
        ${isOver ? 'bg-blue-400' : ''}
      `}
      style={{
        height: `${rowHeight}px`,
        width: `${totalWidth}px`,
        borderColor: GRID_LINE_COLORS.BORDER,
      }}
    >
      {/* Grid cells */}
      {gridCells.map((cell) => (
        <div
          key={cell.index}
          className="absolute top-0 bottom-0 border-r pointer-events-none"
          style={{
            left: `${cell.index * scaledSlotWidth}px`,
            width: `${scaledSlotWidth}px`,
            borderColor: cell.isHour
              ? GRID_LINE_COLORS.HEAVY
              : cell.isHalfHour
                ? GRID_LINE_COLORS.MEDIUM
                : GRID_LINE_COLORS.LIGHT,
          }}
        />
      ))}

      {/* Reservation blocks */}
      {reservations.map((reservation) => (
        <ReservationBlock
          key={reservation.id}
          reservation={reservation}
          zoomLevel={zoomLevel}
          onEdit={onEditReservation}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  );
}

// Memoize component - only re-render if props change
export default memo(TableRow, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these change
  return (
    prevProps.table.id === nextProps.table.id &&
    prevProps.zoomLevel === nextProps.zoomLevel &&
    prevProps.rowHeight === nextProps.rowHeight &&
    prevProps.reservations.length === nextProps.reservations.length &&
    prevProps.reservations.every(
      (r, i) => r.id === nextProps.reservations[i]?.id
    )
  );
});
