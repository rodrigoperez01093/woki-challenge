import type { Reservation, UUID } from '@/app/types';
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

  // Check for conflicts (excluding current reservation)
  const conflict = checkConflict(
    reservations,
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

  // Check for conflicts
  const conflict = checkConflict(
    reservations,
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
