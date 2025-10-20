'use client';

import { useEffect, useRef } from 'react';
import { useReservationStore } from '@/store/useReservationStore';
import { STATUS_LABELS } from '@/lib/constants';
import type { Reservation, ReservationStatus } from '@/types';

interface ReservationContextMenuProps {
  reservation: Reservation;
  x: number;
  y: number;
  onClose: () => void;
  onEdit: (reservation: Reservation) => void;
  onDuplicate: (reservation: Reservation) => void;
}

export default function ReservationContextMenu({
  reservation,
  x,
  y,
  onClose,
  onEdit,
  onDuplicate,
}: ReservationContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const changeReservationStatus = useReservationStore(
    (state) => state.changeReservationStatus
  );
  const deleteReservation = useReservationStore(
    (state) => state.deleteReservation
  );

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleChangeStatus = (status: ReservationStatus) => {
    changeReservationStatus(reservation.id, status);
    onClose();
  };

  const handleEdit = () => {
    onEdit(reservation);
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`¿Eliminar la reserva de ${reservation.customer.name}?`)) {
      deleteReservation(reservation.id);
      onClose();
    }
  };

  const handleDuplicate = () => {
    onDuplicate(reservation);
  };

  const handleNoShow = () => {
    changeReservationStatus(reservation.id, 'NO_SHOW');
    onClose();
  };

  const statuses: ReservationStatus[] = [
    'PENDING',
    'CONFIRMED',
    'SEATED',
    'FINISHED',
    'CANCELLED',
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[1000] w-56 rounded-lg border border-gray-200 bg-white shadow-xl"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      {/* Header */}
      <div className="border-b border-gray-200 px-3 py-2">
        <div className="truncate text-sm font-semibold text-gray-900">
          {reservation.customer.name}
        </div>
        <div className="text-xs text-gray-500">
          👥 {reservation.partySize} personas
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        {/* Edit */}
        <button
          onClick={handleEdit}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
        >
          <span>✏️</span>
          <span>Editar</span>
        </button>

        {/* Duplicate */}
        <button
          onClick={handleDuplicate}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
        >
          <span>📋</span>
          <span>Duplicar</span>
        </button>

        <div className="my-1 border-t border-gray-200" />

        {/* Change Status Submenu */}
        <div className="px-3 py-1 text-xs font-semibold text-gray-500">
          Cambiar estado
        </div>
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => handleChangeStatus(status)}
            className={`
              flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100
              ${reservation.status === status ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}
            `}
          >
            <span>{STATUS_LABELS[status]}</span>
            {reservation.status === status && <span>✓</span>}
          </button>
        ))}

        <div className="my-1 border-t border-gray-200" />

        {/* No Show */}
        <button
          onClick={handleNoShow}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-orange-700 hover:bg-orange-50"
        >
          <span>⚠️</span>
          <span>Marcar como No Show</span>
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
        >
          <span>🗑️</span>
          <span>Eliminar</span>
        </button>
      </div>
    </div>
  );
}
