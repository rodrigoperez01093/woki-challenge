import { restaurant } from './data/restaurant';
import { sectors } from './data/sectors';
import { tables } from './data/tables';
import { reservations, generateRandomReservations } from './data/reservations';

// ============================================================================
// Seed Data Exports
// ============================================================================
// These are used to initialize the Zustand store with default data

export {
  restaurant,
  sectors,
  tables,
  reservations,
  generateRandomReservations,
};
