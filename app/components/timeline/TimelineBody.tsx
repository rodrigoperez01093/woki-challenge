'use client';

import { useReservationStore } from '@/store/useReservationStore';
import { GRID_WIDTH, ROW_HEIGHT } from '@/lib/constants';
import TableRow from './TableRow';

interface TimelineBodyProps {
  zoomLevel: number;
}

/**
 * Timeline body with table rows and reservation blocks
 */
export default function TimelineBody({ zoomLevel }: TimelineBodyProps) {
  const sectors = useReservationStore((state) => state.sectors);
  const tables = useReservationStore((state) => state.tables);
  const reservations = useReservationStore((state) => state.reservations);
  const collapsedSectorIds = useReservationStore(
    (state) => state.collapsedSectorIds
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
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
