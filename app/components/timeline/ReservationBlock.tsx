'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
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
import { memo, useMemo } from 'react';

interface ReservationBlockProps {
  reservation: Reservation;
  zoomLevel: number;
  isOverlay?: boolean;
  hasConflict?: boolean;
  onEdit?: (reservation: Reservation) => void;
  onContextMenu?: (reservation: Reservation, x: number, y: number) => void;
}

function ReservationBlock({
  reservation,
  zoomLevel,
  isOverlay,
  hasConflict,
  onEdit,
  onContextMenu,
}: ReservationBlockProps) {
  const selectedReservationIds = useReservationStore(
    (state) => state.selectedReservationIds
  );

  // Make it droppable too (for collision detection)
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `reservation-drop-${reservation.id}`,
    data: {
      reservation,
      type: 'reservation-drop',
    },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: reservation.id,
    data: {
      reservation,
      type: 'reservation',
    },
  });

  // Left resize handle
  const {
    attributes: leftHandleAttributes,
    listeners: leftHandleListeners,
    setNodeRef: setLeftHandleRef,
  } = useDraggable({
    id: `${reservation.id}-resize-left`,
    data: {
      reservation,
      type: 'resize-left',
      reservationId: reservation.id,
    },
  });

  // Right resize handle
  const {
    attributes: rightHandleAttributes,
    listeners: rightHandleListeners,
    setNodeRef: setRightHandleRef,
  } = useDraggable({
    id: `${reservation.id}-resize-right`,
    data: {
      reservation,
      type: 'resize-right',
      reservationId: reservation.id,
    },
  });

  // Combine refs
  const setNodeRef = (node: HTMLElement | null) => {
    setDraggableRef(node);
    setDroppableRef(node);
  };

  const isSelected = selectedReservationIds.includes(reservation.id);

  // Memoize card scale calculation
  const cardScale = useMemo(() => {
    if (zoomLevel > 1) {
      // Para zoom > 1, aplicar solo 75% del zoom adicional
      // zoom 1.5 → 1 + (0.5 * 0.75) = 1.125
      return 1 + (zoomLevel - 1) * 0.75;
    }
    return zoomLevel;
  }, [zoomLevel]);

  // Memoize position and size calculations
  const { left, width } = useMemo(() => {
    const startTime = new Date(reservation.startTime);
    const reservationDate = new Date(reservation.startTime);
    reservationDate.setHours(0, 0, 0, 0);

    return {
      left: timeToX(startTime, reservationDate) * zoomLevel,
      width: durationToWidth(reservation.durationMinutes) * zoomLevel,
    };
  }, [reservation.startTime, reservation.durationMinutes, zoomLevel]);

  // Memoize status colors and priority styles
  const statusColors = useMemo(
    () => STATUS_COLORS[reservation.status],
    [reservation.status]
  );
  const priorityStyles = useMemo(
    () => PRIORITY_STYLES[reservation.priority],
    [reservation.priority]
  );

  // Memoize tooltip content
  const tooltipContent = useMemo(
    () =>
      `${reservation.customer.name} - ${reservation.partySize} personas
  ${formatTimeRange(reservation.startTime, reservation.endTime)} (${reservation.durationMinutes} min)
  Estado: ${reservation.status}
  ${reservation.customer.phone ? `Tel: ${reservation.customer.phone}` : ''}
  ${reservation.notes ? `Notas: ${reservation.notes}` : ''}`.trim(),
    [
      reservation.customer.name,
      reservation.customer.phone,
      reservation.partySize,
      reservation.startTime,
      reservation.endTime,
      reservation.durationMinutes,
      reservation.status,
      reservation.notes,
    ]
  );

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(reservation, e.clientX, e.clientY);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger edit on left click, not when dragging
    if (e.button === 0) {
      onEdit?.(reservation);
    }
  };

  // Combine listeners with our custom handlers
  const combinedListeners = {
    ...listeners,
    onClick: (e: React.MouseEvent) => {
      listeners?.onClick?.(e as any); // eslint-disable-line
      if (!isDragging) {
        handleClick(e);
      }
    },
    onContextMenu: handleContextMenu,
  };

  const style = isOverlay
    ? {
        transform: transform
          ? `${CSS.Translate.toString(transform)} scaleY(${cardScale})`
          : `scaleY(${cardScale})`,
        transformOrigin: 'left top',
        zIndex: Z_INDEX.RESERVATION_DRAGGING,
      }
    : {
        position: 'absolute' as const,
        left: `${left}px`,
        width: `${width}px`,
        top: `${RESERVATION_VERTICAL_GAP}px`,
        bottom: `${RESERVATION_VERTICAL_GAP}px`,
        transform: transform
          ? `${CSS.Translate.toString(transform)} scaleY(${cardScale})`
          : `scaleY(${cardScale})`,
        transformOrigin: 'left top',
        zIndex: isDragging
          ? Z_INDEX.RESERVATION_DRAGGING
          : isSelected
            ? Z_INDEX.RESERVATION_HOVER
            : Z_INDEX.RESERVATION,
        opacity: isDragging && !isOverlay ? 0 : 1,
        cursor: 'move',
      };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...(hasConflict &&
          isOverlay && {
            boxShadow: '0 0 0 4px rgb(239 68 68)',
          }),
      }}
      {...combinedListeners}
      {...attributes}
      title={tooltipContent}
      className={`
        flex flex-col gap-1 rounded-md p-2 shadow-sm transition-all duration-200
        ${statusColors.bg} ${statusColors.text}
        ${priorityStyles.border}
        ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
        hover:shadow-lg hover:-translate-y-0.5
      `}
      onClick={() => onEdit?.(reservation)}
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

      {/* Resize handles - only show when not dragging and not overlay */}
      {!isDragging && !isOverlay && (
        <>
          {/* Left resize handle */}
          <div
            ref={setLeftHandleRef}
            {...leftHandleListeners}
            {...leftHandleAttributes}
            title="Arrastrar para cambiar hora de inicio"
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-transparent hover:bg-blue-500/40 hover:w-3 transition-all duration-200 z-10 group"
            style={{
              transform: `scaleY(${1 / cardScale})`,
              transformOrigin: 'left center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-blue-500 opacity-0 transition-opacity duration-200 group-hover:opacity-60" />
          </div>
          {/* Right resize handle */}
          <div
            ref={setRightHandleRef}
            {...rightHandleListeners}
            {...rightHandleAttributes}
            title="Arrastrar para extender duración"
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-transparent hover:bg-blue-500/40 hover:w-3 transition-all duration-200 z-10 group"
            style={{
              transform: `scaleY(${1 / cardScale})`,
              transformOrigin: 'right center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute right-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-blue-500 opacity-0 transition-opacity duration-200 group-hover:opacity-60" />
          </div>
        </>
      )}
    </div>
  );
}

// Memoize component - only re-render if props change
export default memo(ReservationBlock, (prevProps, nextProps) => {
  // Custom comparison - return true if props are equal (skip re-render)
  // return false if props changed (trigger re-render)
  return (
    prevProps.reservation.id === nextProps.reservation.id &&
    prevProps.reservation.tableId === nextProps.reservation.tableId &&
    prevProps.zoomLevel === nextProps.zoomLevel &&
    prevProps.isOverlay === nextProps.isOverlay &&
    prevProps.hasConflict === nextProps.hasConflict &&
    // Check if reservation data changed
    prevProps.reservation.status === nextProps.reservation.status &&
    prevProps.reservation.priority === nextProps.reservation.priority &&
    prevProps.reservation.startTime === nextProps.reservation.startTime &&
    prevProps.reservation.durationMinutes ===
      nextProps.reservation.durationMinutes &&
    prevProps.reservation.customer.name ===
      nextProps.reservation.customer.name &&
    prevProps.reservation.partySize === nextProps.reservation.partySize
  );
});
