'use client';

import { useRef, useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  DragMoveEvent,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
} from '@dnd-kit/core';
import { useReservationStore } from '@/store/useReservationStore';
import TimelineHeader from './TimelineHeader';
import TimelineBody from './TimelineBody';
import TimelineSidebar from './TimelineSidebar';
import CurrentTimeLine from './CurrentTimeLine';
import ReservationBlock from './ReservationBlock';
import { HEADER_HEIGHT, SIDEBAR_WIDTH, ROW_HEIGHT } from '@/lib/constants';
import { xToTime, snapToSlot, timeToX } from '@/lib/utils/coordinateUtils';
import { createISODateTime } from '@/lib/utils/dateUtils';
import type { Reservation } from '@/types';

/**
 * Main Timeline component
 * Orchestrates the reservation timeline with drag & drop functionality
 */
export default function Timeline() {
  const timeHeaderRef = useRef<HTMLDivElement>(null);
  const gridBodyRef = useRef<HTMLDivElement>(null);
  const [activeReservation, setActiveReservation] =
    useState<Reservation | null>(null);
  const [hasConflict, setHasConflict] = useState(false);

  // Store state
  const selectedDate = useReservationStore((state) => state.selectedDate);
  const zoomLevel = useReservationStore((state) => state.zoomLevel);
  const moveReservation = useReservationStore((state) => state.moveReservation);
  const checkConflict = useReservationStore((state) => state.checkConflict);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement before drag starts
      },
    })
  );

  // Sync horizontal scroll between header and body
  useEffect(() => {
    const header = timeHeaderRef.current;
    const body = gridBodyRef.current;

    if (!header || !body) return;

    const handleBodyScroll = () => {
      header.scrollLeft = body.scrollLeft;
    };

    body.addEventListener('scroll', handleBodyScroll);

    return () => {
      body.removeEventListener('scroll', handleBodyScroll);
    };
  }, []);

  useEffect(() => {
    // Reset scroll position when zoom changes
    if (gridBodyRef.current && timeHeaderRef.current) {
      const scrollLeft = gridBodyRef.current.scrollLeft;
      timeHeaderRef.current.scrollLeft = scrollLeft;
    }
  }, [zoomLevel]);

  // Drag & Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const activeData = event.active.data.current;
    if (activeData && activeData.reservation) {
      setActiveReservation(activeData.reservation);
      setHasConflict(false);
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { delta } = event;

    if (!activeReservation) {
      setHasConflict(false);
      return;
    }

    // Calculate target table based on Y delta (same logic as handleDragEnd)
    const tables = useReservationStore.getState().tables;
    const sectors = useReservationStore.getState().sectors;
    const collapsedSectorIds =
      useReservationStore.getState().collapsedSectorIds;

    // Get visible tables in order
    const visibleTables: string[] = [];
    sectors.forEach((sector) => {
      if (!collapsedSectorIds.includes(sector.id)) {
        const sectorTables = tables
          .filter((t) => t.sectorId === sector.id)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        visibleTables.push(...sectorTables.map((t) => t.id));
      }
    });

    // Find current table index
    const currentTableIndex = visibleTables.indexOf(activeReservation.tableId);

    // Calculate how many rows moved
    const rowsMoved = Math.round(delta.y / ROW_HEIGHT);
    const newTableIndex = Math.max(
      0,
      Math.min(currentTableIndex + rowsMoved, visibleTables.length - 1)
    );
    const targetTableId = visibleTables[newTableIndex];

    // Calculate new time position
    const originalStartTime = new Date(activeReservation.startTime);
    const reservationDate = new Date(activeReservation.startTime);
    reservationDate.setHours(0, 0, 0, 0);

    const originalX = timeToX(originalStartTime, reservationDate);
    const newX = snapToSlot(originalX + delta.x);
    const newStartTime = xToTime(newX, selectedDate);
    const newStartTimeISO = createISODateTime(
      newStartTime,
      newStartTime.getHours(),
      newStartTime.getMinutes()
    );

    // Calculate new end time
    const newEndTime = new Date(newStartTime);
    newEndTime.setMinutes(
      newEndTime.getMinutes() + activeReservation.durationMinutes
    );
    const newEndTimeISO = createISODateTime(
      newEndTime,
      newEndTime.getHours(),
      newEndTime.getMinutes()
    );

    // Check for conflicts
    const conflict = checkConflict(
      targetTableId,
      newStartTimeISO,
      newEndTimeISO,
      activeReservation.id
    );

    setHasConflict(conflict.hasConflict);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;

    if (!activeReservation) {
      console.log('No active reservation');
      return;
    }

    const reservationId = active.id as string;

    // Calculate new position
    const originalStartTime = new Date(activeReservation.startTime);
    const reservationDate = new Date(activeReservation.startTime);
    reservationDate.setHours(0, 0, 0, 0);

    const originalX = timeToX(originalStartTime, reservationDate);
    const newX = snapToSlot(originalX + delta.x);
    const newStartTime = xToTime(newX, selectedDate);

    // Determine target table based on Y delta
    const tables = useReservationStore.getState().tables;
    const sectors = useReservationStore.getState().sectors;
    const collapsedSectorIds =
      useReservationStore.getState().collapsedSectorIds;

    // Get visible tables in order
    const visibleTables: string[] = [];
    sectors.forEach((sector) => {
      if (!collapsedSectorIds.includes(sector.id)) {
        const sectorTables = tables
          .filter((t) => t.sectorId === sector.id)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        visibleTables.push(...sectorTables.map((t) => t.id));
      }
    });

    // Find current table index
    const currentTableIndex = visibleTables.indexOf(activeReservation.tableId);

    // Calculate how many rows moved (each row is ROW_HEIGHT px)
    const rowsMoved = Math.round(delta.y / ROW_HEIGHT);
    const newTableIndex = Math.max(
      0,
      Math.min(currentTableIndex + rowsMoved, visibleTables.length - 1)
    );
    const targetTableId = visibleTables[newTableIndex];

    // Create ISO string
    const newStartTimeISO = createISODateTime(
      newStartTime,
      newStartTime.getHours(),
      newStartTime.getMinutes()
    );

    // Update reservation
    const success = moveReservation(
      reservationId,
      targetTableId,
      newStartTimeISO
    );

    if (success) {
      console.log('Reservation moved successfully');
    } else {
      console.warn('Failed to move reservation - conflict detected');
    }

    setActiveReservation(null);
    setHasConflict(false);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
      <div className="flex h-full flex-col overflow-hidden bg-white">
        {/* Header row with time slots */}
        <div
          className="flex border-b-2 border-gray-200"
          style={{ height: `${HEADER_HEIGHT}px` }}
        >
          {/* Empty corner space above sidebar */}
          <div
            className="shrink-0 border-r-2 border-gray-200 bg-gray-50"
            style={{ width: `${SIDEBAR_WIDTH}px` }}
          />

          {/* Time header (scrollable horizontally) */}
          <TimelineHeader ref={timeHeaderRef} zoomLevel={zoomLevel} />
        </div>

        {/* Body with sidebar and grid */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar with table list */}
          <TimelineSidebar />

          {/* Main grid area (scrollable) */}
          <div className="relative flex-1 overflow-auto" ref={gridBodyRef}>
            <TimelineBody zoomLevel={zoomLevel} />
            <CurrentTimeLine selectedDate={selectedDate} />
          </div>
        </div>
      </div>

      {/* Drag Overlay - shows preview while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeReservation ? (
          <div
            className={`
              transition-all
              ${hasConflict ? 'opacity-80 ring-4 ring-red-500' : 'opacity-80'}
            `}
          >
            <ReservationBlock
              reservation={activeReservation}
              zoomLevel={zoomLevel}
              isOverlay
            />
            {hasConflict && (
              <div className="absolute -bottom-8 left-0 right-0 rounded bg-red-500 px-2 py-1 text-center text-xs font-semibold text-white shadow-lg">
                ⚠ Conflicto detectado
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
