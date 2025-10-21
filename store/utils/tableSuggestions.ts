import type { Table, Reservation, UUID } from '@/types';
import { checkConflict } from './conflictDetection';

export interface TableSuggestion {
  table: Table;
  score: number;
  reason: string;
  isAvailable: boolean;
}
export interface TimeSlotSuggestion {
  startTime: Date;
  suggestions: TableSuggestion[];
}

//#region: calculateSuitabilityScore Calculate score based on partySize
/*
 * Scoring:
 * - Perfect fit (partySize === max): 100 points
 * - Good fit (partySize close to max): 80-95 points
 * - Acceptable fit (within range): 50-79 points
 * - Poor fit (wastes capacity): 20-49 points
 */
function calculateSuitabilityScore(
  table: Table,
  partySize: number,
  sectorPreference?: UUID
): number {
  const { min, max } = table.capacity;

  // Check if party size fits
  if (partySize < min || partySize > max) {
    return 0;
  }

  let score = 0;

  // Perfect fit
  if (partySize === max) {
    score = 100;
  } else {
    // Calculate how efficiently the table is used
    const utilization = partySize / max;

    if (utilization >= 0.9) {
      score = 95; // 90-100% utilization
    } else if (utilization >= 0.75) {
      score = 80; // 75-89% utilization
    } else if (utilization >= 0.6) {
      score = 65; // 60-74% utilization
    } else {
      score = 50; // 50-59% utilization (acceptable but wastes space)
    }
  }

  // Bonus for sector preference
  if (sectorPreference && table.sectorId === sectorPreference) {
    score += 10;
  }

  return score;
}

//#region getSuggestionReason
function getSuggestionReason(table: Table, partySize: number): string {
  const { min, max } = table.capacity;
  const utilization = partySize / max;

  if (partySize === max) {
    return 'Capacidad perfecta';
  } else if (utilization >= 0.9) {
    return 'Excelente uso del espacio';
  } else if (utilization >= 0.75) {
    return 'Buen ajuste';
  } else if (utilization >= 0.6) {
    return 'Ajuste aceptable';
  } else {
    return `Capacidad ${min}-${max} personas`;
  }
}

//#region findBestTables: Find best available tables for a party size and time slot
/**
 * @param tables - All tables in the restaurant
 * @param reservations - All reservations (will be filtered by date)
 * @param partySize - Number of people
 * @param startTime - Desired start time (ISO string)
 * @param durationMinutes - Duration in minutes
 * @param sectorPreference - Optional sector ID for preference
 * @returns Array of table suggestions sorted by score (best first)
 */
export function findBestTables(
  tables: Table[],
  reservations: Reservation[],
  partySize: number,
  startTime: string,
  durationMinutes: number,
  sectorPreference?: UUID
): TableSuggestion[] {
  // Calculate end time
  const start = new Date(startTime);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + durationMinutes);
  const endTime = end.toISOString();

  // Filter reservations to only include those on the same date
  const startDate = new Date(startTime);
  const reservationsOnDate = reservations.filter((res) => {
    const resDate = new Date(res.startTime);
    return (
      resDate.getUTCFullYear() === startDate.getUTCFullYear() &&
      resDate.getUTCMonth() === startDate.getUTCMonth() &&
      resDate.getUTCDate() === startDate.getUTCDate()
    );
  });

  // Evaluate each table
  const suggestions: TableSuggestion[] = tables.map((table) => {
    const score = calculateSuitabilityScore(table, partySize, sectorPreference);

    // Check availability
    const conflict = checkConflict(
      reservationsOnDate,
      table.id,
      startTime,
      endTime
    );

    const isAvailable = !conflict.hasConflict && score > 0;
    const reason = getSuggestionReason(table, partySize);

    return {
      table,
      score,
      reason,
      isAvailable,
    };
  });

  // Sort by availability first, then by score
  return suggestions.sort((a, b) => {
    if (a.isAvailable && !b.isAvailable) return -1;
    if (!a.isAvailable && b.isAvailable) return 1;
    return b.score - a.score;
  });
}

//#region findNextAvailableSlots: Find next available time slots for a party size
// Searches in ±15, ±30, ±60 minute windows
/*
 *
 * @param tables - All tables in the restaurant
 * @param reservations - All reservations
 * @param partySize - Number of people
 * @param desiredStartTime - Desired start time (ISO string)
 * @param durationMinutes - Duration in minutes
 * @param sectorPreference - Optional sector ID for preference
 * @returns Array of time slot suggestions with available tables
 */
export function findNextAvailableSlots(
  tables: Table[],
  reservations: Reservation[],
  partySize: number,
  desiredStartTime: string,
  durationMinutes: number,
  sectorPreference?: UUID
): TimeSlotSuggestion[] {
  const slots: TimeSlotSuggestion[] = [];
  const desiredTime = new Date(desiredStartTime);

  // Search windows: ±15, ±30, ±60 minutes
  const searchWindows = [15, 30, 60];
  const searchedTimes = new Set<string>();

  for (const windowMinutes of searchWindows) {
    // Check earlier times
    for (let offset = -windowMinutes; offset <= windowMinutes; offset += 15) {
      if (offset === 0) continue; // Skip the original time (already checked)

      const testTime = new Date(desiredTime);
      testTime.setMinutes(testTime.getMinutes() + offset);

      // Create ISO string for this time
      const testTimeISO = testTime.toISOString();

      // Skip if we already checked this time
      if (searchedTimes.has(testTimeISO)) continue;
      searchedTimes.add(testTimeISO);

      // Find available tables for this time slot
      const suggestions = findBestTables(
        tables,
        reservations,
        partySize,
        testTimeISO,
        durationMinutes,
        sectorPreference
      );

      // Only include slots with at least one available table
      const availableSuggestions = suggestions.filter((s) => s.isAvailable);
      if (availableSuggestions.length > 0) {
        slots.push({
          startTime: testTime,
          suggestions: availableSuggestions,
        });
      }
    }
  }

  // Sort by time (closest to desired time first)
  return slots.sort((a, b) => {
    const diffA = Math.abs(a.startTime.getTime() - desiredTime.getTime());
    const diffB = Math.abs(b.startTime.getTime() - desiredTime.getTime());
    return diffA - diffB;
  });
}

//#region formatTimeDifference: Format time difference in human-readable format
/*
 * @param minutes - Number of minutes difference
 * @returns Formatted string like "+15 min", "-30 min", etc.
 */
export function formatTimeDifference(
  desiredTime: Date,
  actualTime: Date
): string {
  const diffMinutes = Math.round(
    (actualTime.getTime() - desiredTime.getTime()) / (1000 * 60)
  );

  if (diffMinutes === 0) return 'Hora solicitada';

  const sign = diffMinutes > 0 ? '+' : '';
  return `${sign}${diffMinutes} min`;
}
