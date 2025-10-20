'use client';

import { useDroppable } from '@dnd-kit/core';
import type { Table, Reservation } from '@/types';
import { GRID_LINE_COLORS, SLOT_WIDTH, TOTAL_SLOTS } from '@/lib/constants';
import ReservationBlock from './ReservationBlock';

interface TableRowProps {
  table: Table;
  reservations: Reservation[];
  zoomLevel: number;
  rowHeight: number;
}

export default function TableRow({
  table,
  reservations,
  zoomLevel,
  rowHeight,
}: TableRowProps) {
  const { setNodeRef } = useDroppable({
    id: `table-${table.id}`,
    data: {
      tableId: table.id,
      type: 'table-row',
    },
  });

  const scaledSlotWidth = SLOT_WIDTH * zoomLevel;
  const totalWidth = TOTAL_SLOTS * scaledSlotWidth;

  // Generate grid cells
  const gridCells = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
    const isHour = i % 4 === 0;
    const isHalfHour = i % 2 === 0;

    return {
      index: i,
      isHour,
      isHalfHour,
    };
  });

  return (
    <div
      ref={setNodeRef}
      className="relative border-b"
      style={{
        height: `${rowHeight}px`,
        width: `${totalWidth}px`,
        borderColor: GRID_LINE_COLORS.BORDER,
      }}
    >
      {/* Grid cells - absolutely positioned */}
      {gridCells.map((cell) => (
        <div
          key={cell.index}
          className="absolute top-0 bottom-0 border-r"
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
        />
      ))}
    </div>
  );
}
