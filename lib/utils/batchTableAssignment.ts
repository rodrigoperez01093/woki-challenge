/**
 * Batch Table Assignment
 * Automatically assigns optimal tables for batch reservation imports
 */

import type { Table, Reservation, UUID } from '@/types';
import type { ParsedReservation } from './csvParser';
import { v4 as uuidv4 } from 'uuid';

export interface TableAssignment {
  reservation: ParsedReservation;
  assignedTable?: Table;
  reason?: string;
  alternatives?: Table[];
}

export interface BatchAssignmentResult {
  assignments: TableAssignment[];
  successCount: number;
  failureCount: number;
}

interface TimeSlot {
  startTime: Date;
  endTime: Date;
}

/**
 * Checks if two time slots overlap
 */
function doTimeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  return slot1.startTime < slot2.endTime && slot1.endTime > slot2.startTime;
}

/**
 * Gets all reservations for a specific table on a specific date
 */
function getTableReservationsOnDate(
  tableId: UUID,
  date: Date,
  existingReservations: Reservation[]
): Reservation[] {
  return existingReservations.filter((res) => {
    if (res.tableId !== tableId) return false;

    const resDate = new Date(res.startTime);
    return (
      resDate.getFullYear() === date.getFullYear() &&
      resDate.getMonth() === date.getMonth() &&
      resDate.getDate() === date.getDate()
    );
  });
}

/**
 * Checks if a table is available for a specific time slot
 */
function isTableAvailable(
  table: Table,
  date: Date,
  startTime: string,
  durationMinutes: number,
  existingReservations: Reservation[],
  pendingAssignments: TableAssignment[]
): boolean {
  const [hours, minutes] = startTime.split(':').map(Number);
  const reservationStart = new Date(date);
  reservationStart.setHours(hours, minutes, 0, 0);

  const reservationEnd = new Date(reservationStart);
  reservationEnd.setMinutes(reservationEnd.getMinutes() + durationMinutes);

  const requestedSlot: TimeSlot = {
    startTime: reservationStart,
    endTime: reservationEnd,
  };

  // Check existing reservations
  const tableReservations = getTableReservationsOnDate(
    table.id,
    date,
    existingReservations
  );

  for (const res of tableReservations) {
    const resStart = new Date(res.startTime);
    const resEnd = new Date(resStart);
    resEnd.setMinutes(resEnd.getMinutes() + res.durationMinutes);

    const existingSlot: TimeSlot = {
      startTime: resStart,
      endTime: resEnd,
    };

    if (doTimeSlotsOverlap(requestedSlot, existingSlot)) {
      return false;
    }
  }

  // Check pending assignments (other reservations in this batch)
  const pendingForTable = pendingAssignments.filter(
    (a) => a.assignedTable?.id === table.id
  );

  for (const pending of pendingForTable) {
    const [pendingHours, pendingMinutes] = pending.reservation.startTime
      .split(':')
      .map(Number);
    const pendingDate = new Date(pending.reservation.date);
    const pendingStart = new Date(pendingDate);
    pendingStart.setHours(pendingHours, pendingMinutes, 0, 0);

    const pendingEnd = new Date(pendingStart);
    pendingEnd.setMinutes(
      pendingEnd.getMinutes() + pending.reservation.durationMinutes
    );

    const pendingSlot: TimeSlot = {
      startTime: pendingStart,
      endTime: pendingEnd,
    };

    if (doTimeSlotsOverlap(requestedSlot, pendingSlot)) {
      return false;
    }
  }

  return true;
}

/**
 * Scores a table for a reservation (higher is better)
 */
function scoreTable(
  table: Table,
  partySize: number,
  preferredSectorId?: UUID
): number {
  let score = 0;

  // Capacity match (prefer exact or slightly larger)
  const capacityDiff = table.capacity.max - partySize;

  if (capacityDiff < 0) {
    // Table too small - not suitable
    return -1000;
  } else if (capacityDiff === 0) {
    // Perfect match
    score += 100;
  } else if (capacityDiff <= 2) {
    // Slightly larger (good)
    score += 80;
  } else if (capacityDiff <= 4) {
    // Moderately larger (okay)
    score += 50;
  } else {
    // Much larger (wasteful)
    score += 20;
  }

  // Minimum capacity consideration
  if (partySize < table.capacity.min) {
    // Party smaller than minimum - penalize
    score -= 30;
  }

  // Sector preference
  if (preferredSectorId && table.sectorId === preferredSectorId) {
    score += 50;
  }

  return score;
}

/**
 * Finds the best available table for a reservation
 */
function findBestTable(
  reservation: ParsedReservation,
  tables: Table[],
  date: Date,
  existingReservations: Reservation[],
  pendingAssignments: TableAssignment[],
  sectorMap: Map<string, UUID>
): { bestTable?: Table; alternatives: Table[] } {
  const availableTables = tables.filter((table) =>
    isTableAvailable(
      table,
      date,
      reservation.startTime,
      reservation.durationMinutes,
      existingReservations,
      pendingAssignments
    )
  );

  if (availableTables.length === 0) {
    return { alternatives: [] };
  }

  // Convert sector name to ID if provided
  const preferredSectorId = reservation.preferredSector
    ? sectorMap.get(reservation.preferredSector)
    : undefined;

  // Score all available tables
  const scoredTables = availableTables
    .map((table) => ({
      table,
      score: scoreTable(table, reservation.partySize, preferredSectorId),
    }))
    .filter((item) => item.score >= 0) // Remove unsuitable tables
    .sort((a, b) => b.score - a.score); // Sort by score descending

  if (scoredTables.length === 0) {
    return { alternatives: [] };
  }

  const bestTable = scoredTables[0].table;
  const alternatives = scoredTables.slice(1, 4).map((item) => item.table); // Top 3 alternatives

  return { bestTable, alternatives };
}

/**
 * Assigns tables to a batch of reservations
 */
export function assignTablesInBatch(
  parsedReservations: ParsedReservation[],
  tables: Table[],
  existingReservations: Reservation[],
  sectorMap: Map<string, UUID>
): BatchAssignmentResult {
  const assignments: TableAssignment[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Sort reservations by priority (VIP first, then LARGE_GROUP, then STANDARD)
  const priorityOrder = { VIP: 0, LARGE_GROUP: 1, STANDARD: 2 };
  const sortedReservations = [...parsedReservations].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // If same priority, sort by party size (larger first)
    return b.partySize - a.partySize;
  });

  for (const reservation of sortedReservations) {
    const date = new Date(reservation.date);

    const { bestTable, alternatives } = findBestTable(
      reservation,
      tables,
      date,
      existingReservations,
      assignments,
      sectorMap
    );

    if (bestTable) {
      assignments.push({
        reservation,
        assignedTable: bestTable,
        alternatives,
      });
      successCount++;
    } else {
      // No table available
      let reason =
        'No hay mesas disponibles para este horario y tamaño de grupo';

      // Try to provide more specific reason
      const suitableTables = tables.filter(
        (t) => t.capacity.max >= reservation.partySize
      );

      if (suitableTables.length === 0) {
        reason = `No hay mesas con capacidad para ${reservation.partySize} personas`;
      } else {
        // Check if it's a timing issue
        const hasAvailableCapacity = suitableTables.some(
          (table) =>
            getTableReservationsOnDate(table.id, date, existingReservations)
              .length === 0
        );

        if (!hasAvailableCapacity) {
          reason = 'Todas las mesas están reservadas para esta fecha';
        } else {
          reason =
            'Conflicto de horario - todas las mesas adecuadas están ocupadas en este horario';
        }
      }

      assignments.push({
        reservation,
        reason,
        alternatives: [],
      });
      failureCount++;
    }
  }

  return {
    assignments,
    successCount,
    failureCount,
  };
}

/**
 * Converts a ParsedReservation to a full Reservation object
 */
export function createReservationFromParsed(
  parsed: ParsedReservation,
  tableId: UUID
): Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'> {
  // Parse date manually to avoid timezone issues
  const [year, month, day] = parsed.date.split('-').map(Number);
  const [hours, minutes] = parsed.startTime.split(':').map(Number);

  const startTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + parsed.durationMinutes);

  return {
    tableId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    durationMinutes: parsed.durationMinutes,
    partySize: parsed.partySize,
    customer: {
      name: parsed.customerName,
      phone: parsed.customerPhone,
      email: parsed.customerEmail,
    },
    status: 'CONFIRMED',
    priority: parsed.priority,
    notes: parsed.specialRequests,
    source: 'BATCH_IMPORT',
  };
}

/**
 * Creates all reservations from successful assignments
 */
export function createReservationsFromAssignments(
  assignments: TableAssignment[]
): Reservation[] {
  const now = new Date().toISOString();

  return assignments
    .filter((assignment) => assignment.assignedTable)
    .map((assignment) => {
      const reservation = createReservationFromParsed(
        assignment.reservation,
        assignment.assignedTable!.id
      );

      return {
        ...reservation,
        id: uuidv4() as UUID,
        createdAt: now,
        updatedAt: now,
      };
    });
}
