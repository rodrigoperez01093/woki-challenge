import type { SeedData } from '@/types';
import { restaurant } from './data/restaurant';
import { sectors } from './data/sectors';
import { tables } from './data/tables';
import { reservations, generateRandomReservations } from './data/reservations';

// ============================================================================
// Complete Seed Data Export
// ============================================================================

// Use static date for seed data to avoid SSR hydration issues
// The actual date will be set in the client store
const isServer = typeof window === 'undefined';
const staticDate = new Date('2025-01-20');
const clientDate = new Date();

const today = isServer ? staticDate : clientDate;
const baseDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

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
