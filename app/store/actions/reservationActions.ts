import type {
  Reservation,
  CreateReservationInput,
  UpdateReservationInput,
  UUID,
  ReservationStatus,
} from '@/app/types';
import {
  generateId,
  calculateEndTime,
  getCurrentTimestamp,
} from '../utils/helpers';
import { checkConflict } from '../utils/conflictDetection';

/**
 * Creates a new reservation
 *
 * @param reservations - Current reservations array
 * @param input - Reservation input data
 * @returns Updated reservations array or null if conflict
 */
export function addReservation(
  reservations: Reservation[],
  input: CreateReservationInput
): Reservation[] | null {
  const endTime = calculateEndTime(input.startTime, input.durationMinutes);

  // Check for conflicts
  const conflict = checkConflict(
    reservations,
    input.tableId,
    input.startTime,
    endTime
  );

  if (conflict.hasConflict) {
    console.warn('Cannot add reservation: conflict detected', conflict);
    return null;
  }

  const now = getCurrentTimestamp();

  const newReservation: Reservation = {
    id: generateId(),
    tableId: input.tableId,
    customer: input.customer,
    partySize: input.partySize,
    startTime: input.startTime,
    endTime,
    durationMinutes: input.durationMinutes,
    status: input.status || 'CONFIRMED',
    priority: input.priority || 'STANDARD',
    notes: input.notes,
    source: input.source,
    createdAt: now,
    updatedAt: now,
  };

  return [...reservations, newReservation];
}

/**
 * Updates an existing reservation
 *
 * @param reservations - Current reservations array
 * @param input - Update input data
 * @returns Updated reservations array
 */
export function updateReservation(
  reservations: Reservation[],
  input: UpdateReservationInput
): Reservation[] {
  return reservations.map((res) => {
    if (res.id !== input.id) return res;

    // Create updated reservation object
    const updated: Reservation = { ...res };

    // Merge customer if provided (deep merge to preserve required fields)
    if (input.customer) {
      updated.customer = { ...res.customer, ...input.customer };
    }

    // Update other fields if provided
    if (input.tableId !== undefined) updated.tableId = input.tableId;
    if (input.partySize !== undefined) updated.partySize = input.partySize;
    if (input.startTime !== undefined) updated.startTime = input.startTime;
    if (input.durationMinutes !== undefined)
      updated.durationMinutes = input.durationMinutes;
    if (input.status !== undefined) updated.status = input.status;
    if (input.priority !== undefined) updated.priority = input.priority;
    if (input.notes !== undefined) updated.notes = input.notes;

    // Recalculate endTime if startTime or duration changed
    if (input.startTime !== undefined || input.durationMinutes !== undefined) {
      const startTime = input.startTime ?? res.startTime;
      const duration = input.durationMinutes ?? res.durationMinutes;
      updated.endTime = calculateEndTime(startTime, duration);
    }

    updated.updatedAt = getCurrentTimestamp();

    return updated;
  });
}

/**
 * Deletes a reservation
 *
 * @param reservations - Current reservations array
 * @param id - Reservation ID to delete
 * @returns Updated reservations array
 */
export function deleteReservation(
  reservations: Reservation[],
  id: UUID
): Reservation[] {
  return reservations.filter((res) => res.id !== id);
}

/**
 * Changes the status of a reservation
 *
 * @param reservations - Current reservations array
 * @param id - Reservation ID
 * @param status - New status
 * @returns Updated reservations array
 */
export function changeReservationStatus(
  reservations: Reservation[],
  id: UUID,
  status: ReservationStatus
): Reservation[] {
  return reservations.map((res) =>
    res.id === id ? { ...res, status, updatedAt: getCurrentTimestamp() } : res
  );
}
