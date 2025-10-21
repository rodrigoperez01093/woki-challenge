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
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useReservationStore } from '@/store/useReservationStore';
import TimelineHeader from './TimelineHeader';
import TimelineBody from './TimelineBody';
import TimelineSidebar from './TimelineSidebar';
import CurrentTimeLine from './CurrentTimeLine';
import ReservationBlock from './ReservationBlock';
import {
  HEADER_HEIGHT,
  SIDEBAR_WIDTH,
  ROW_HEIGHT,
  MIN_RESERVATION_DURATION,
  MAX_RESERVATION_DURATION,
  SLOT_WIDTH,
  START_HOUR,
} from '@/lib/constants';
import { xToTime, snapToSlot, timeToX } from '@/lib/utils/coordinateUtils';
import { createISODateTime } from '@/lib/utils/dateUtils';
import type { Reservation } from '@/types';
import EditReservationModal from '../modals/EditReservationModal';
import CreateReservationModal from '../modals/CreateReservationModal';
import ReservationContextMenu from './ReservationContextMenu';
import { useToast } from '@/app/hooks/useToast';

/**
 * Main Timeline component
 * Orchestrates the reservation timeline with drag & drop functionality
 */
export default function Timeline() {
  const timeHeaderRef = useRef<HTMLDivElement>(null);
  const gridBodyRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const [activeReservation, setActiveReservation] =
    useState<Reservation | null>(null);
  const [editingReservation, setEditingReservation] =
    useState<Reservation | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [resizePreviewDuration, setResizePreviewDuration] = useState<
    number | null
  >(null);
  const [resizePreviewStartTime, setResizePreviewStartTime] = useState<
    string | null
  >(null);
  const [contextMenu, setContextMenu] = useState<{
    reservation: Reservation;
    x: number;
    y: number;
  } | null>(null);
  const [duplicatingReservation, setDuplicatingReservation] =
    useState<Reservation | null>(null);
  const [createReservationData, setCreateReservationData] = useState<{
    tableId: string;
    startTime: Date;
  } | null>(null);

  // Store state
  const selectedDate = useReservationStore((state) => state.selectedDate);
  const zoomLevel = useReservationStore((state) => state.zoomLevel);
  const moveReservation = useReservationStore((state) => state.moveReservation);
  const resizeReservation = useReservationStore(
    (state) => state.resizeReservation
  );
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

  // Handler for clicking on empty slot
  const handleEmptySlotClick = (tableId: string, clickTime: Date) => {
    setCreateReservationData({ tableId, startTime: clickTime });
  };

  // Drag & Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const activeData = event.active.data.current;
    if (activeData && activeData.reservation) {
      setActiveReservation(activeData.reservation);
      setHasConflict(false);

      // Check if we're resizing
      if (activeData.type === 'resize-left') {
        setIsResizing('left');
        setResizePreviewDuration(activeData.reservation.durationMinutes);
        setResizePreviewStartTime(activeData.reservation.startTime);
      } else if (activeData.type === 'resize-right') {
        setIsResizing('right');
        setResizePreviewDuration(activeData.reservation.durationMinutes);
        setResizePreviewStartTime(activeData.reservation.startTime);
      } else {
        setIsResizing(null);
        setResizePreviewDuration(null);
        setResizePreviewStartTime(null);
      }
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { delta } = event;

    if (!activeReservation) {
      setHasConflict(false);
      return;
    }

    // Helper to check if end time exceeds closing hour (midnight)
    const exceedsClosingTime = (
      startTime: Date,
      durationMinutes: number
    ): boolean => {
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);

      // Check if endTime is on a different day (crossed midnight)
      const startDate = new Date(startTime);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(endTime);
      endDate.setHours(0, 0, 0, 0);

      // If dates are different, it crossed midnight
      return startDate.getTime() !== endDate.getTime();
    };

    // Helper to check if start time is before opening hour (11:00)
    const beforeOpeningTime = (startTime: Date): boolean => {
      const hour = startTime.getHours();
      return hour < START_HOUR;
    };

    // Handle resize
    if (isResizing) {
      const deltaMinutes = Math.round((delta.x / SLOT_WIDTH) * 15);

      let newDuration = activeReservation.durationMinutes;
      let newStartTime = activeReservation.startTime;

      if (isResizing === 'right') {
        // Resize right: change end time, keep start time
        newDuration = activeReservation.durationMinutes + deltaMinutes;
        // Ensure duration is a multiple of 15
        newDuration = Math.round(newDuration / 15) * 15;
        newStartTime = activeReservation.startTime; // Keep original
      } else if (isResizing === 'left') {
        // Resize left: change start time, keep end time fixed
        const originalEndTime = new Date(activeReservation.endTime);
        const originalStartTime = new Date(activeReservation.startTime);
        const reservationDate = new Date(activeReservation.startTime);
        reservationDate.setHours(0, 0, 0, 0);

        // Calculate new X position and snap to slot
        const originalX = timeToX(originalStartTime, reservationDate);
        const newX = snapToSlot(originalX + delta.x);

        // Convert back to time (snapped to 15-min slots)
        const newStart = xToTime(newX, selectedDate);

        // Calculate new duration based on fixed end time
        newDuration = Math.round(
          (originalEndTime.getTime() - newStart.getTime()) / (1000 * 60)
        );
        newStartTime = createISODateTime(
          newStart,
          newStart.getHours(),
          newStart.getMinutes()
        );
      }

      // Clamp to min/max
      newDuration = Math.max(
        MIN_RESERVATION_DURATION,
        Math.min(MAX_RESERVATION_DURATION, newDuration)
      );

      // Recalculate start time if duration was clamped during left resize
      if (isResizing === 'left') {
        const originalEndTime = new Date(activeReservation.endTime);
        const recalculatedStart = new Date(originalEndTime);
        recalculatedStart.setMinutes(
          recalculatedStart.getMinutes() - newDuration
        );
        newStartTime = createISODateTime(
          recalculatedStart,
          recalculatedStart.getHours(),
          recalculatedStart.getMinutes()
        );
      }

      setResizePreviewDuration(newDuration);
      setResizePreviewStartTime(newStartTime);

      // Check for conflicts with new times
      const endTimeForConflictCheck = new Date(newStartTime);
      endTimeForConflictCheck.setMinutes(
        endTimeForConflictCheck.getMinutes() + newDuration
      );

      // Check if exceeds closing time or starts before opening
      const startTimeDate = new Date(newStartTime);
      const exceedsClosing = exceedsClosingTime(startTimeDate, newDuration);
      const beforeOpening = beforeOpeningTime(startTimeDate);

      const conflict = checkConflict(
        activeReservation.tableId,
        newStartTime,
        endTimeForConflictCheck.toISOString(),
        activeReservation.id
      );

      setHasConflict(conflict.hasConflict || exceedsClosing || beforeOpening);
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

    // Check if reservation exceeds closing time or starts before opening
    const exceedsClosing = exceedsClosingTime(
      newStartTime,
      activeReservation.durationMinutes
    );
    const beforeOpening = beforeOpeningTime(newStartTime);

    // Check for conflicts
    const conflict = checkConflict(
      targetTableId,
      newStartTimeISO,
      newEndTimeISO,
      activeReservation.id
    );

    setHasConflict(conflict.hasConflict || exceedsClosing || beforeOpening);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;

    if (!activeReservation) {
      console.log('No active reservation');
      return;
    }

    // Handle resize end
    if (isResizing && resizePreviewDuration !== null) {
      // Check if exceeds closing time or starts before opening
      const startTimeToCheck =
        resizePreviewStartTime || activeReservation.startTime;
      const startDate = new Date(startTimeToCheck);
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + resizePreviewDuration);

      // Check if crossed midnight
      const startDateOnly = new Date(startDate);
      startDateOnly.setHours(0, 0, 0, 0);
      const endDateOnly = new Date(endDate);
      endDateOnly.setHours(0, 0, 0, 0);
      const exceedsClosing = startDateOnly.getTime() !== endDateOnly.getTime();

      // Check if starts before opening hour
      const beforeOpening = startDate.getHours() < START_HOUR;

      if (exceedsClosing) {
        toast.error(
          'No se puede redimensionar: la reserva terminaría después del horario de cierre (00:00)'
        );
        setActiveReservation(null);
        setIsResizing(null);
        setResizePreviewDuration(null);
        setResizePreviewStartTime(null);
        setHasConflict(false);
        return;
      }

      if (beforeOpening) {
        toast.error(
          'No se puede redimensionar: la reserva empezaría antes del horario de apertura (11:00)'
        );
        setActiveReservation(null);
        setIsResizing(null);
        setResizePreviewDuration(null);
        setResizePreviewStartTime(null);
        setHasConflict(false);
        return;
      }

      // Check if there's a conflict before applying
      if (hasConflict) {
        toast.error('No se puede redimensionar: conflicto con otra reserva');
        setActiveReservation(null);
        setIsResizing(null);
        setResizePreviewDuration(null);
        setResizePreviewStartTime(null);
        setHasConflict(false);
        return;
      }

      let success = false;

      if (isResizing === 'right') {
        // Resize right: only change duration
        success = resizeReservation(
          activeReservation.id,
          resizePreviewDuration
        );
      } else if (isResizing === 'left' && resizePreviewStartTime) {
        // Resize left: change start time AND duration
        // Need to verify no conflict one more time
        const endTimeForCheck = new Date(resizePreviewStartTime);
        endTimeForCheck.setMinutes(
          endTimeForCheck.getMinutes() + resizePreviewDuration
        );

        const conflict = checkConflict(
          activeReservation.tableId,
          resizePreviewStartTime,
          endTimeForCheck.toISOString(),
          activeReservation.id
        );

        if (!conflict.hasConflict) {
          const updateReservation =
            useReservationStore.getState().updateReservation;
          updateReservation({
            id: activeReservation.id,
            startTime: resizePreviewStartTime,
            durationMinutes: resizePreviewDuration,
          });
          success = true;
        } else {
          console.warn('Cannot resize left - conflict detected');
        }
      }

      if (success) {
        toast.success('Reserva redimensionada correctamente');
      } else {
        toast.error('Error al redimensionar la reserva');
      }

      setActiveReservation(null);
      setIsResizing(null);
      setResizePreviewDuration(null);
      setResizePreviewStartTime(null);
      setHasConflict(false);
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

    // Check if reservation would exceed closing time (cross midnight)
    const exceedsClosing = (() => {
      const endTime = new Date(newStartTime);
      endTime.setMinutes(
        endTime.getMinutes() + activeReservation.durationMinutes
      );

      // Check if crossed midnight
      const startDateOnly = new Date(newStartTime);
      startDateOnly.setHours(0, 0, 0, 0);
      const endDateOnly = new Date(endTime);
      endDateOnly.setHours(0, 0, 0, 0);

      return startDateOnly.getTime() !== endDateOnly.getTime();
    })();

    // Check if reservation starts before opening hour
    const beforeOpening = newStartTime.getHours() < START_HOUR;

    if (exceedsClosing) {
      toast.error(
        'No se puede mover: la reserva terminaría después del horario de cierre (00:00)'
      );
      setActiveReservation(null);
      setHasConflict(false);
      return;
    }

    if (beforeOpening) {
      toast.error(
        'No se puede mover: la reserva empezaría antes del horario de apertura (11:00)'
      );
      setActiveReservation(null);
      setHasConflict(false);
      return;
    }

    // Update reservation
    const success = moveReservation(
      reservationId,
      targetTableId,
      newStartTimeISO
    );

    if (success) {
      toast.success('Reserva movida correctamente');
    } else {
      toast.error('No se puede mover: conflicto con otra reserva');
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
      modifiers={[restrictToWindowEdges]}
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
            <TimelineBody
              zoomLevel={zoomLevel}
              onEditReservation={setEditingReservation}
              onContextMenu={(reservation, x, y) =>
                setContextMenu({ reservation, x, y })
              }
              onEmptySlotClick={handleEmptySlotClick}
            />
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
                ⚠ Espacio no disponible
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
      {/* Context Menu */}
      {contextMenu && (
        <ReservationContextMenu
          reservation={contextMenu.reservation}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onEdit={(reservation) => {
            setEditingReservation(reservation);
            setContextMenu(null);
          }}
          onDuplicate={(reservation) => {
            setDuplicatingReservation(reservation);
            setContextMenu(null);
          }}
        />
      )}
      {/* Edit Reservation Modal */}
      <EditReservationModal
        isOpen={editingReservation !== null}
        onClose={() => setEditingReservation(null)}
        reservation={editingReservation}
      />
      {/* Create Reservation Modal (for duplicating) */}
      <CreateReservationModal
        isOpen={duplicatingReservation !== null}
        onClose={() => setDuplicatingReservation(null)}
        prefilledData={
          duplicatingReservation
            ? {
                customerName: duplicatingReservation.customer.name,
                customerPhone: duplicatingReservation.customer.phone,
                customerEmail: duplicatingReservation.customer.email,
                partySize: duplicatingReservation.partySize,
                durationMinutes: duplicatingReservation.durationMinutes,
                priority: duplicatingReservation.priority,
                notes: duplicatingReservation.notes,
                status: 'PENDING',
                // Dejar tableId y startTime vacíos para que el usuario los configure
              }
            : undefined
        }
      />
      {/* Create Reservation Modal (for empty slot click) */}
      <CreateReservationModal
        isOpen={createReservationData !== null}
        onClose={() => setCreateReservationData(null)}
        prefilledData={
          createReservationData
            ? {
                tableId: createReservationData.tableId,
                startTime: createReservationData.startTime,
              }
            : undefined
        }
      />
    </DndContext>
  );
}
