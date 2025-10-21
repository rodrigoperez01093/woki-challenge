'use client';

import { useReservationStore } from '@/store/useReservationStore';
import { GRID_WIDTH, ROW_HEIGHT } from '@/lib/constants';
import TableRow from './TableRow';
import { useMemo, useState, useEffect } from 'react';
import { Reservation } from '@/types';

interface TimelineBodyProps {
  zoomLevel: number;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  onEditReservation?: (reservation: Reservation) => void;
  onContextMenu?: (reservation: Reservation, x: number, y: number) => void;
  onEmptySlotClick?: (tableId: string, clickTime: Date) => void;
}

/**
 * Timeline body with table rows and reservation blocks
 * Optimized with virtualization for performance with 200+ reservations
 */
export default function TimelineBody({
  zoomLevel,
  scrollContainerRef,
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

  // Virtualization state
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(800);

  // Track scroll position
  useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const handleResize = () => {
      setContainerHeight(container.clientHeight);
    };

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // Initial size
    setContainerHeight(container.clientHeight);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [scrollContainerRef]);

  // Calculate visible rows
  const OVERSCAN = 3; // Render 3 extra rows above and below viewport
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex =
    Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN;

  // Flatten all visible tables with their positions
  const allTablesFlattened = useMemo(() => {
    const result: Array<{ table: any; index: number; yOffset: number }> = []; // eslint-disable-line
    let currentIndex = 0;

    sectors.forEach((sector) => {
      const sectorTables = tables.filter((t) => t.sectorId === sector.id);
      const isCollapsed = collapsedSectorIds.includes(sector.id);

      if (!isCollapsed) {
        sectorTables.forEach((table) => {
          result.push({
            table,
            index: currentIndex,
            yOffset: currentIndex * ROW_HEIGHT,
          });
          currentIndex++;
        });
      }
    });

    return result;
  }, [sectors, tables, collapsedSectorIds]);

  const totalHeight = allTablesFlattened.length * ROW_HEIGHT;
  const visibleTables = allTablesFlattened.filter(
    ({ index }) => index >= startIndex && index <= endIndex
  );

  return (
    <div
      style={{
        width: `${scaledWidth}px`,
        minWidth: `${scaledWidth}px`,
        maxWidth: `${scaledWidth}px`,
        height: `${totalHeight}px`,
        position: 'relative',
      }}
    >
      {visibleTables.map(({ table, yOffset }) => {
        const tableReservations = reservations.filter(
          (r) => r.tableId === table.id
        );

        return (
          <div
            key={table.id}
            style={{
              position: 'absolute',
              top: `${yOffset}px`,
              left: 0,
              right: 0,
              height: `${ROW_HEIGHT}px`,
            }}
          >
            <TableRow
              table={table}
              reservations={tableReservations}
              zoomLevel={zoomLevel}
              rowHeight={ROW_HEIGHT}
              onEditReservation={onEditReservation}
              onContextMenu={onContextMenu}
              onEmptySlotClick={onEmptySlotClick}
            />
          </div>
        );
      })}
    </div>
  );
}
