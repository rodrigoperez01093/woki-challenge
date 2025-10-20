'use client';

import { useRef, useEffect } from 'react';
import { DndContext, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useReservationStore } from '@/store/useReservationStore';
import TimelineHeader from './TimelineHeader';
import TimelineBody from './TimelineBody';
import TimelineSidebar from './TimelineSidebar';
import CurrentTimeLine from './CurrentTimeLine';
import { HEADER_HEIGHT, SIDEBAR_WIDTH } from '@/lib/constants';
import { xToTime } from '@/lib/utils/coordinateUtils';
import { toISODateString } from '@/lib/utils/dateUtils';

/**
 * Main Timeline component
 * Orchestrates the reservation timeline with drag & drop functionality
 */
export default function Timeline() {
  const timeHeaderRef = useRef<HTMLDivElement>(null);
  const gridBodyRef = useRef<HTMLDivElement>(null);

  // Store state
  const selectedDate = useReservationStore((state) => state.selectedDate);
  const zoomLevel = useReservationStore((state) => state.zoomLevel);
  const moveReservation = useReservationStore((state) => state.moveReservation);

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
    // Optional: Visual feedback when drag starts
    console.log('Drag started:', event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    console.log('EVENT', event);
    if (!over) {
      console.log('Dropped outside valid area');
      return;
    }

    // Extract reservation ID and target info
    const reservationId = active.id as string;
    const targetData = over.data.current;

    if (!targetData) {
      console.warn('No target data');
      return;
    }

    const { tableId, x } = targetData;

    // Convert X position to time
    const newStartTime = xToTime(x + delta.x, selectedDate);
    const newStartTimeISO = toISODateString(newStartTime);

    // Update reservation in store
    const success = moveReservation(reservationId, tableId, newStartTimeISO);

    if (!success) {
      console.warn('Failed to move reservation - conflict detected');
      // TODO: Show error toast
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
    </DndContext>
  );
}
