import type { SeedData } from '@/types';
import { restaurant } from './data/restaurant';
import { sectors } from './data/sectors';
import { tables } from './data/tables';
import { reservations, generateRandomReservations } from './data/reservations';

// ============================================================================
// Complete Seed Data Export
// ============================================================================

const baseDate = '2025-10-15';
export const seedData: SeedData = {
  date: baseDate,
  restaurant,
  sectors,
  tables,
  reservations,
};

// ============================================================================
// Individual Exports
// ============================================================================

export { restaurant, sectors, tables, reservations };

// ============================================================================
// Generator Function Export
// ============================================================================

export { generateRandomReservations };

// ============================================================================
// Stats (for info)
// ============================================================================

export const stats = {
  totalSectors: sectors.length,
  totalTables: tables.length,
  totalReservations: reservations.length,
  capacity: {
    theoretical: tables.length * 4, // ~4 turns per day
    withReservations: reservations.length,
  },
};

// Default export
export default seedData;
