import type { Reservation, Table } from '@/types';

/**
 * Represents capacity data for a specific time slot
 */
export interface TimeSlotCapacity {
  /** Start hour of the slot (0-23) */
  hour: number;
  /** Start minute of the slot (0, 15, 30, 45) */
  minute: number;
  /** Total capacity (sum of all table max capacities) */
  totalCapacity: number;
  /** Occupied seats in this slot */
  occupiedSeats: number;
  /** Percentage of capacity used (0-100) */
  occupancyRate: number;
  /** Number of reservations active in this slot */
  reservationCount: number;
  /** ISO timestamp for the start of this slot */
  timestamp: string;
}

/**
 * Color coding based on occupancy rate
 */
export function getOccupancyColor(occupancyRate: number): {
  bg: string;
  text: string;
  label: string;
} {
  if (occupancyRate >= 90) {
    return {
      bg: 'bg-red-500',
      text: 'text-red-900',
      label: 'Completo',
    };
  } else if (occupancyRate >= 70) {
    return {
      bg: 'bg-yellow-500',
      text: 'text-yellow-900',
      label: 'Alto',
    };
  } else {
    return {
      bg: 'bg-green-500',
      text: 'text-green-900',
      label: 'Disponible',
    };
  }
}

/**
 * Check if a reservation is active during a specific time slot
 */
function isReservationActiveInSlot(
  reservation: Reservation,
  slotStart: Date,
  slotEnd: Date
): boolean {
  const resStart = new Date(reservation.startTime);
  const resEnd = new Date(reservation.endTime);

  // Reservation is active if it overlaps with the slot
  // Overlap exists if: resStart < slotEnd AND resEnd > slotStart
  return resStart < slotEnd && resEnd > slotStart;
}

/**
 * Calculate capacity analytics for all time slots in a day
 *
 * @param reservations - All reservations (should be pre-filtered by date)
 * @param tables - All tables in the restaurant
 * @param selectedDate - The date to analyze
 * @param startHour - First hour to analyze (default: 11)
 * @param endHour - Last hour to analyze (default: 24)
 * @returns Array of capacity data for each 15-minute slot
 */
export function calculateCapacityByTimeSlot(
  reservations: Reservation[],
  tables: Table[],
  selectedDate: Date,
  startHour: number = 11,
  endHour: number = 24
): TimeSlotCapacity[] {
  const slots: TimeSlotCapacity[] = [];

  // Calculate total restaurant capacity (sum of all table max capacities)
  const totalCapacity = tables.reduce(
    (sum, table) => sum + table.capacity.max,
    0
  );

  // Iterate through each 15-minute slot
  // Changed to <= to include the last hour slot (e.g., 23:00, 23:15, 23:30, 23:45)
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      // Create slot time range
      const slotStart = new Date(selectedDate);
      slotStart.setHours(hour, minute, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + 15);

      // Find all active reservations in this slot
      const activeReservations = reservations.filter((res) =>
        isReservationActiveInSlot(res, slotStart, slotEnd)
      );

      // Calculate occupied seats (sum of party sizes)
      const occupiedSeats = activeReservations.reduce(
        (sum, res) => sum + res.partySize,
        0
      );

      // Calculate occupancy rate
      const occupancyRate =
        totalCapacity > 0 ? (occupiedSeats / totalCapacity) * 100 : 0;

      slots.push({
        hour,
        minute,
        totalCapacity,
        occupiedSeats,
        occupancyRate: Math.min(100, occupancyRate), // Cap at 100%
        reservationCount: activeReservations.length,
        timestamp: slotStart.toISOString(),
      });
    }
  }

  // Add one final slot at midnight (00:00) to show capacity for reservations ending at that time
  const midnightSlot = new Date(selectedDate);
  midnightSlot.setHours(24, 0, 0, 0); // 24:00 = 00:00 next day

  const midnightEnd = new Date(midnightSlot);
  midnightEnd.setMinutes(15); // 00:00 to 00:15

  const midnightReservations = reservations.filter((res) =>
    isReservationActiveInSlot(res, midnightSlot, midnightEnd)
  );

  const midnightOccupied = midnightReservations.reduce(
    (sum, res) => sum + res.partySize,
    0
  );

  const midnightOccupancyRate =
    totalCapacity > 0 ? (midnightOccupied / totalCapacity) * 100 : 0;

  slots.push({
    hour: 0, // Midnight is hour 0 of next day
    minute: 0,
    totalCapacity,
    occupiedSeats: midnightOccupied,
    occupancyRate: Math.min(100, midnightOccupancyRate),
    reservationCount: midnightReservations.length,
    timestamp: midnightSlot.toISOString(),
  });

  return slots;
}

/**
 * Format time slot for display
 *
 * @param slot - Time slot capacity data
 * @returns Formatted time string like "19:00"
 */
export function formatTimeSlot(slot: TimeSlotCapacity): string {
  const hourStr = slot.hour.toString().padStart(2, '0');
  const minuteStr = slot.minute.toString().padStart(2, '0');
  return `${hourStr}:${minuteStr}`;
}
