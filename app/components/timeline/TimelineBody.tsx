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
  onHeightChange?: (height: number) => void;
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
  onHeightChange,
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
  // Include sector headers to maintain alignment with sidebar
  const allTablesFlattened = useMemo(() => {
    const result: Array<{
      type: 'sector' | 'table';
      sector?: any; // eslint-disable-line
      table?: any; // eslint-disable-line
      index: number;
      yOffset: number;
      isCollapsed?: boolean;
    }> = [];
    let currentIndex = 0;

    sectors.forEach((sector) => {
      const sectorTables = tables.filter((t) => t.sectorId === sector.id);
      const isCollapsed = collapsedSectorIds.includes(sector.id);

      // Add sector header row
      result.push({
        type: 'sector',
        sector,
        index: currentIndex,
        yOffset: currentIndex * ROW_HEIGHT,
        isCollapsed,
      });
      currentIndex++;

      if (!isCollapsed) {
        sectorTables.forEach((table) => {
          result.push({
            type: 'table',
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

  // Notify parent of height changes
  useEffect(() => {
    if (onHeightChange) {
      onHeightChange(totalHeight);
    }
  }, [totalHeight, onHeightChange]);

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
      {visibleTables.map((item) => {
        const { type, yOffset } = item;

        if (type === 'sector') {
          // Render empty sector header row (visual separator only)
          return (
            <div
              key={`sector-${item.sector.id}`}
              style={{
                position: 'absolute',
                top: `${yOffset}px`,
                left: 0,
                right: 0,
                height: `${ROW_HEIGHT}px`,
              }}
              className="border-b border-gray-200 bg-gray-50"
            />
          );
        }

        // Render table row
        const { table } = item;
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
