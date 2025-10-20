import type { Reservation, UUID, ConflictCheck } from '@/types';

/**
 * Checks if two time ranges overlap
 *
 * @param start1 - Start time of first range (ISO string)
 * @param end1 - End time of first range (ISO string)
 * @param start2 - Start time of second range (ISO string)
 * @param end2 - End time of second range (ISO string)
 * @returns true if ranges overlap, false otherwise
 *
 * @example
 * checkTimeOverlap('2025-10-15T20:00:00', '2025-10-15T21:30:00',
 *                  '2025-10-15T21:00:00', '2025-10-15T22:30:00')
 * // Returns: true (overlaps from 21:00 to 21:30)
 *
 * Logic: Two ranges [s1, e1] and [s2, e2] overlap if:
 * s1 < e2 AND s2 < e1
 */
export function checkTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();

  return s1 < e2 && s2 < e1;
}

/**
 * Checks for conflicts with existing reservations on a table
 *
 * @param reservations - All reservations in the system
 * @param tableId - Table to check conflicts for
 * @param startTime - Proposed start time (ISO string)
 * @param endTime - Proposed end time (ISO string)
 * @param excludeReservationId - Optional: reservation ID to exclude (for updates)
 * @returns ConflictCheck object with conflict details
 *
 * @example
 * // Check if new reservation conflicts
 * const conflict = checkConflict(
 *   allReservations,
 *   'TABLE_M1',
 *   '2025-10-15T20:00:00',
 *   '2025-10-15T21:30:00'
 * );
 *
 * if (conflict.hasConflict) {
 *   console.log('Conflicts with:', conflict.conflictingReservationIds);
 * }
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

/**
 * Validates if a party size fits within table capacity
 *
 * @param partySize - Number of people
 * @param tableCapacity - Table capacity object with min/max
 * @returns true if party size is within capacity, false otherwise
 */
export function isValidCapacity(
  partySize: number,
  tableCapacity: { min: number; max: number }
): boolean {
  return partySize >= tableCapacity.min && partySize <= tableCapacity.max;
}
