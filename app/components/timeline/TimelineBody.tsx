'use client';

import { useReservationStore } from '@/store/useReservationStore';
import { GRID_WIDTH, ROW_HEIGHT } from '@/lib/constants';
import TableRow from './TableRow';
import { useMemo } from 'react';
import { Reservation } from '@/types';

interface TimelineBodyProps {
  zoomLevel: number;
  onEditReservation?: (reservation: Reservation) => void;
  onContextMenu?: (reservation: Reservation, x: number, y: number) => void;
  onEmptySlotClick?: (tableId: string, clickTime: Date) => void;
}

/**
 * Timeline body with table rows and reservation blocks
 * Optimized with memoization for performance with 200+ reservations
 */
export default function TimelineBody({
  zoomLevel,
  onEditReservation,
  onContextMenu,
  onEmptySlotClick,
}: TimelineBodyProps) {
  const sectors = useReservationStore((state) => state.sectors);
  const tables = useReservationStore((state) => state.tables);
  const collapsedSectorIds = useReservationStore(
    (state) => state.collapsedSectorIds
  );

  // Obtener dependencias para el filtro
  const allReservations = useReservationStore((state) => state.reservations);
  const filters = useReservationStore((state) => state.filters);
  const selectedDate = useReservationStore((state) => state.selectedDate);
  const getFilteredReservations = useReservationStore(
    (state) => state.getFilteredReservations
  );

  // Memoizar el resultado - esto evita re-filtrar en cada render
  const reservations = useMemo(
    () => getFilteredReservations(),
    [allReservations, filters, selectedDate, getFilteredReservations] // eslint-disable-line
  );

  const scaledWidth = GRID_WIDTH * zoomLevel;

  return (
    <div style={{ width: `${scaledWidth}px` }}>
      {sectors.map((sector) => {
        const sectorTables = tables.filter((t) => t.sectorId === sector.id);
        const isCollapsed = collapsedSectorIds.includes(sector.id);

        if (isCollapsed) return null;

        return (
          <div key={sector.id}>
            {sectorTables.map((table) => {
              const tableReservations = reservations.filter(
                (r) => r.tableId === table.id
              );

              return (
                <TableRow
                  key={table.id}
                  table={table}
                  reservations={tableReservations}
                  zoomLevel={zoomLevel}
                  rowHeight={ROW_HEIGHT}
                  onEditReservation={onEditReservation}
                  onContextMenu={onContextMenu}
                  onEmptySlotClick={onEmptySlotClick}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
