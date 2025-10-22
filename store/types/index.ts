import {
  ConflictCheck,
  CreateReservationInput,
  Reservation,
  ReservationStatus,
  Restaurant,
  Sector,
  Table,
  TimelineConfig,
  UpdateReservationInput,
  UUID,
  ViewMode,
} from '@/types';

/**
 * Filters state interface
 */
export interface FiltersState {
  sectorIds: UUID[];
  statuses: ReservationStatus[];
  searchQuery: string;
}

export interface ReservationState {
  // Core Data
  restaurant: Restaurant;
  sectors: Sector[];
  tables: Table[];
  reservations: Reservation[];

  // UI State
  selectedDate: Date;
  viewMode: ViewMode;
  zoomLevel: number;
  selectedReservationIds: UUID[];
  collapsedSectorIds: UUID[];

  // Filters
  filters: FiltersState;

  // Timeline Config
  config: TimelineConfig;

  // Actions - Data mutations
  addReservation: (input: CreateReservationInput) => boolean;
  updateReservation: (input: UpdateReservationInput) => void;
  deleteReservation: (id: UUID) => void;
  changeReservationStatus: (id: UUID, status: ReservationStatus) => void;

  // Actions - Drag & Drop
  moveReservation: (
    id: UUID,
    newTableId: UUID,
    newStartTime: string
  ) => boolean;
  resizeReservation: (id: UUID, newDurationMinutes: number) => boolean;

  // Actions - UI
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  setZoomLevel: (level: number) => void;
  toggleReservationSelection: (id: UUID) => void;
  clearSelection: () => void;
  toggleSectorCollapse: (sectorId: UUID) => void;

  // Actions - Filters
  setFilters: (filters: Partial<FiltersState>) => void;
  clearFilters: () => void;

  // Actions - Stress Test
  loadStressTest: (count?: number) => void;
  clearStressTest: () => void;

  // Actions - Batch Import
  replaceAllReservations: (reservations: Reservation[]) => void;

  // Selectors
  getReservationById: (id: UUID) => Reservation | undefined;
  getReservationsByTable: (tableId: UUID) => Reservation[];
  getTableById: (tableId: UUID) => Table | undefined;
  getSectorById: (sectorId: UUID) => Sector | undefined;
  getFilteredReservations: () => Reservation[];
  checkConflict: (
    tableId: UUID,
    startTime: string,
    endTime: string,
    excludeReservationId?: UUID
  ) => ConflictCheck;

  // Table Suggestions
  findBestTables: (
    partySize: number,
    startTime: string,
    durationMinutes: number,
    sectorPreference?: UUID
  ) => import('../utils/tableSuggestions').TableSuggestion[];
  findNextAvailableSlots: (
    partySize: number,
    desiredStartTime: string,
    durationMinutes: number,
    sectorPreference?: UUID
  ) => import('../utils/tableSuggestions').TimeSlotSuggestion[];

  // Utilities
  resetToSeedData: () => void;
}
