import type { Reservation, UUID } from '@/types';
import { calculateEndTime, isValidDuration } from '../utils/helpers';
import { checkConflict } from '../utils/conflictDetection';
import { updateReservation } from './reservationActions';

/**
 * Moves a reservation to a new table and/or time
 *
 * @param reservations - Current reservations array
 * @param id - Reservation ID to move
 * @param newTableId - New table ID
 * @param newStartTime - New start time (ISO string)
 * @returns Object with success status and updated reservations
 */
export function moveReservation(
  reservations: Reservation[],
  id: UUID,
  newTableId: UUID,
  newStartTime: string
): { success: boolean; reservations: Reservation[] } {
  const reservation = reservations.find((res) => res.id === id);

  if (!reservation) {
    console.warn('Reservation not found:', id);
    return { success: false, reservations };
  }

  const newEndTime = calculateEndTime(
    newStartTime,
    reservation.durationMinutes
  );

  // Filter reservations to only include those on the same date as newStartTime
  // This prevents false conflicts when we have reservations across multiple days
  const newStartDate = new Date(newStartTime);
  const reservationsOnDate = reservations.filter((res) => {
    const resDate = new Date(res.startTime);
    return (
      resDate.getFullYear() === newStartDate.getFullYear() &&
      resDate.getMonth() === newStartDate.getMonth() &&
      resDate.getDate() === newStartDate.getDate()
    );
  });

  // Check for conflicts (excluding current reservation)
  const conflict = checkConflict(
    reservationsOnDate,
    newTableId,
    newStartTime,
    newEndTime,
    id
  );

  if (conflict.hasConflict) {
    console.warn('Cannot move reservation: conflict detected', conflict);
    return { success: false, reservations };
  }

  const updated = updateReservation(reservations, {
    id,
    tableId: newTableId,
    startTime: newStartTime,
  });

  return { success: true, reservations: updated };
}

/**
 * Resizes a reservation by changing its duration
 *
 * @param reservations - Current reservations array
 * @param id - Reservation ID to resize
 * @param newDurationMinutes - New duration in minutes
 * @returns Object with success status and updated reservations
 */
export function resizeReservation(
  reservations: Reservation[],
  id: UUID,
  newDurationMinutes: number
): { success: boolean; reservations: Reservation[] } {
  const reservation = reservations.find((res) => res.id === id);

  if (!reservation) {
    console.warn('Reservation not found:', id);
    return { success: false, reservations };
  }

  // Validate duration (30 min to 4 hours)
  if (!isValidDuration(newDurationMinutes)) {
    console.warn(
      'Invalid duration:',
      newDurationMinutes,
      '(must be 30-240 minutes)'
    );
    return { success: false, reservations };
  }

  const newEndTime = calculateEndTime(
    reservation.startTime,
    newDurationMinutes
  );

  // Filter reservations to only include those on the same date
  // This prevents false conflicts when we have reservations across multiple days
  const startDate = new Date(reservation.startTime);
  const reservationsOnDate = reservations.filter((res) => {
    const resDate = new Date(res.startTime);
    return (
      resDate.getFullYear() === startDate.getFullYear() &&
      resDate.getMonth() === startDate.getMonth() &&
      resDate.getDate() === startDate.getDate()
    );
  });

  // Check for conflicts
  const conflict = checkConflict(
    reservationsOnDate,
    reservation.tableId,
    reservation.startTime,
    newEndTime,
    id
  );

  if (conflict.hasConflict) {
    console.warn('Cannot resize: conflict detected', conflict);
    return { success: false, reservations };
  }

  const updated = updateReservation(reservations, {
    id,
    durationMinutes: newDurationMinutes,
  });

  return { success: true, reservations: updated };
}
