import type { Reservation, Table, Sector } from '@/types';
export interface SectorMetrics {
  sectorId: string;
  sectorName: string;
  totalTables: number;
  totalCapacity: number;
  totalReservations: number;
  occupiedSeats: number;
  occupancyRate: number;
  averagePartySize: number;
}

function isReservationActiveAt(reservation: Reservation, time: Date): boolean {
  const start = new Date(reservation.startTime);
  const end = new Date(reservation.endTime);
  return time >= start && time < end;
}

/*
 * Calculate peak occupancy for a sector across the day
 * Samples every 15 minutes and finds the maximum
 */
function calculatePeakOccupancy(
  tableIds: string[],
  reservations: Reservation[],
  selectedDate: Date
): { peakSeats: number; peakReservations: number } {
  let maxSeats = 0;
  let maxReservations = 0;
  // Sample every 15 minutes
  for (let hour = 11; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const sampleTime = new Date(selectedDate);
      sampleTime.setHours(hour, minute, 0, 0);
      const activeReservations = reservations.filter(
        (r) =>
          tableIds.includes(r.tableId) && isReservationActiveAt(r, sampleTime)
      );

      const seatsAtTime = activeReservations.reduce(
        (sum, r) => sum + r.partySize,
        0
      );

      if (seatsAtTime > maxSeats) {
        maxSeats = seatsAtTime;
        maxReservations = activeReservations.length;
      }
    }
  }

  return { peakSeats: maxSeats, peakReservations: maxReservations };
}

/*
 * Calculate metrics for all sectors
 *
 * @param sectors - All sectors
 * @param tables - All tables
 * @param reservations - Reservations (should be pre-filtered by date)
 * @param selectedDate - The date being analyzed
 * @returns Array of sector metrics
 */
export function calculateSectorMetrics(
  sectors: Sector[],
  tables: Table[],
  reservations: Reservation[],
  selectedDate: Date
): SectorMetrics[] {
  return sectors.map((sector) => {
    const sectorTables = tables.filter((t) => t.sectorId === sector.id);
    const totalCapacity = sectorTables.reduce(
      (sum, table) => sum + table.capacity.max,
      0
    );
    // Get all reservations for tables in this sector
    const sectorTableIds = sectorTables.map((t) => t.id);
    const sectorReservations = reservations.filter((r) =>
      sectorTableIds.includes(r.tableId)
    );
    // Calculate PEAK occupancy (not total accumulated)
    const { peakSeats } = calculatePeakOccupancy(
      sectorTableIds,
      reservations,
      selectedDate
    );
    // Calculate occupancy rate based on PEAK
    const occupancyRate =
      totalCapacity > 0 ? (peakSeats / totalCapacity) * 100 : 0;
    const totalPartySize = sectorReservations.reduce(
      (sum, res) => sum + res.partySize,
      0
    );
    const averagePartySize =
      sectorReservations.length > 0
        ? totalPartySize / sectorReservations.length
        : 0;

    return {
      sectorId: sector.id,
      sectorName: sector.name,
      totalTables: sectorTables.length,
      totalCapacity,
      totalReservations: sectorReservations.length,
      occupiedSeats: peakSeats, // Peak occupancy
      occupancyRate: Math.min(100, occupancyRate),
      averagePartySize,
    };
  });
}

export function getOccupancyColor(occupancyRate: number): {
  bg: string;
  border: string;
  text: string;
} {
  if (occupancyRate >= 90) {
    return {
      bg: 'bg-red-100',
      border: 'border-red-500',
      text: 'text-red-900',
    };
  } else if (occupancyRate >= 70) {
    return {
      bg: 'bg-yellow-100',
      border: 'border-yellow-500',
      text: 'text-yellow-900',
    };
  } else {
    return {
      bg: 'bg-green-100',
      border: 'border-green-500',
      text: 'text-green-900',
    };
  }
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
