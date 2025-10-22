import type { Reservation, UUID, ConflictCheck } from '@/types';
import { checkTimeOverlap } from '@/lib/utils/timeUtils';

/**
 * Checks for conflicts with existing reservations on a table
 *
 * @param reservations - All reservations in the system
 * @param tableId - Table to check conflicts for
 * @param startTime - Proposed start time (ISO string)
 * @param endTime - Proposed end time (ISO string)
 * @param excludeReservationId - Optional: reservation ID to exclude (for updates)
 * @returns ConflictCheck object with conflict details
 */
export function checkConflict(
  reservations: Reservation[],
  tableId: UUID,
  startTime: string,
  endTime: string,
  excludeReservationId?: UUID
): ConflictCheck {
  // Get all reservations for this table (excluding the one being updated)
  const tableReservations = reservations
    .filter((res) => res.tableId === tableId)
    .filter((res) => res.id !== excludeReservationId);

  // Find overlapping reservations
  const conflicts = tableReservations.filter((res) =>
    checkTimeOverlap(startTime, endTime, res.startTime, res.endTime)
  );

  return {
    hasConflict: conflicts.length > 0,
    conflictingReservationIds: conflicts.map((res) => res.id),
    reason: conflicts.length > 0 ? 'overlap' : undefined,
  };
}
