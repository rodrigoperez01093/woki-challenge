import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  UUID,
  ReservationStatus,
  CreateReservationInput,
  UpdateReservationInput,
  ConflictCheck,
  ViewMode,
} from '@/types';
import {
  restaurant as initialRestaurant,
  sectors as initialSectors,
  tables as initialTables,
  reservations as initialReservations,
  generateRandomReservations,
} from '@/lib/seed-data';

// Actions
import {
  addReservation as addReservationAction,
  updateReservation as updateReservationAction,
  deleteReservation as deleteReservationAction,
  changeReservationStatus as changeReservationStatusAction,
} from './actions/reservationActions';
import {
  moveReservation as moveReservationAction,
  resizeReservation as resizeReservationAction,
} from './actions/dragDropActions';
import {
  createEmptyFilters,
  updateFilters as updateFiltersAction,
} from './actions/filterActions';

// Selectors
import {
  getReservationById as getReservationByIdSelector,
  getReservationsByTable as getReservationsByTableSelector,
  getTableById as getTableByIdSelector,
  getSectorById as getSectorByIdSelector,
  getFilteredReservations as getFilteredReservationsSelector,
} from './selectors/reservationSelectors';

// Utils
import { checkConflict as checkConflictUtil } from './utils/conflictDetection';
import {
  findBestTables,
  findNextAvailableSlots,
  type TableSuggestion,
  type TimeSlotSuggestion,
} from './utils/tableSuggestions';
import { ReservationState, FiltersState } from './types';

//#region Store
export const useReservationStore = create<ReservationState>()(
  devtools(
    (set, get) => ({
      // ========================================================================
      // Initial State
      // ========================================================================
      restaurant: initialRestaurant,
      sectors: initialSectors,
      tables: initialTables,
      reservations: initialReservations,

      // Use static date for SSR, will be updated on client mount
      selectedDate:
        typeof window === 'undefined' ? new Date('2025-01-20') : new Date(),
      viewMode: 'day',
      zoomLevel: 1,
      selectedReservationIds: [],
      collapsedSectorIds: [],

      filters: createEmptyFilters(),

      config: {
        // Generate date string - static for SSR
        date: (() => {
          const today =
            typeof window === 'undefined' ? new Date('2025-01-20') : new Date();
          return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        })(),
        startHour: 11,
        endHour: 24,
        slotMinutes: 15,
        viewMode: 'day',
      },

      // ========================================================================
      // Data Mutations
      // ========================================================================

      addReservation: (input: CreateReservationInput): boolean => {
        console.log('LLEGA', input);
        const updated = addReservationAction(get().reservations, input);
        if (updated) {
          set({ reservations: updated });
          return true;
        }
        return false;
      },

      updateReservation: (input: UpdateReservationInput) => {
        set((state) => ({
          reservations: updateReservationAction(state.reservations, input),
        }));
      },

      deleteReservation: (id: UUID) => {
        set((state) => ({
          reservations: deleteReservationAction(state.reservations, id),
          selectedReservationIds: state.selectedReservationIds.filter(
            (selectedId) => selectedId !== id
          ),
        }));
      },

      changeReservationStatus: (id: UUID, status: ReservationStatus) => {
        set((state) => ({
          reservations: changeReservationStatusAction(
            state.reservations,
            id,
            status
          ),
        }));
      },

      // ========================================================================
      // Drag & Drop
      // ========================================================================

      moveReservation: (
        id: UUID,
        newTableId: UUID,
        newStartTime: string
      ): boolean => {
        const state = get();
        const reservation = state.reservations.find((r) => r.id === id);
        const targetTable = state.tables.find((t) => t.id === newTableId);

        if (!reservation) {
          console.warn('Reservation not found:', id);
          return false;
        }

        if (!targetTable) {
          console.warn('Target table not found:', newTableId);
          return false;
        }

        // Validate party size fits in target table capacity
        if (
          reservation.partySize < targetTable.capacity.min ||
          reservation.partySize > targetTable.capacity.max
        ) {
          console.warn('Party size incompatible with table capacity:', {
            partySize: reservation.partySize,
            tableCapacity: targetTable.capacity,
          });
          return false;
        }

        const result = moveReservationAction(
          state.reservations,
          id,
          newTableId,
          newStartTime
        );

        if (result.success) {
          set({ reservations: result.reservations });
        }

        return result.success;
      },

      resizeReservation: (id: UUID, newDurationMinutes: number): boolean => {
        const result = resizeReservationAction(
          get().reservations,
          id,
          newDurationMinutes
        );

        if (result.success) {
          set({ reservations: result.reservations });
        }

        return result.success;
      },

      // ========================================================================
      // UI Actions
      // ========================================================================

      setSelectedDate: (date: Date) => {
        set({ selectedDate: date });
      },

      setViewMode: (mode: ViewMode) => {
        set({ viewMode: mode });
      },

      setZoomLevel: (level: number) => {
        set({ zoomLevel: Math.max(0.5, Math.min(2, level)) });
      },

      toggleReservationSelection: (id: UUID) => {
        set((state) => {
          const isSelected = state.selectedReservationIds.includes(id);
          return {
            selectedReservationIds: isSelected
              ? state.selectedReservationIds.filter(
                  (selectedId) => selectedId !== id
                )
              : [...state.selectedReservationIds, id],
          };
        });
      },

      clearSelection: () => {
        set({ selectedReservationIds: [] });
      },

      toggleSectorCollapse: (sectorId: UUID) => {
        set((state) => {
          const isCollapsed = state.collapsedSectorIds.includes(sectorId);
          return {
            collapsedSectorIds: isCollapsed
              ? state.collapsedSectorIds.filter((id) => id !== sectorId)
              : [...state.collapsedSectorIds, sectorId],
          };
        });
      },

      // ========================================================================
      // Filters
      // ========================================================================

      setFilters: (filters: Partial<FiltersState>) => {
        set((state) => ({
          filters: updateFiltersAction(state.filters, filters),
        }));
      },

      clearFilters: () => {
        set({ filters: createEmptyFilters() });
      },

      // ========================================================================
      // Stress Test
      // ========================================================================

      loadStressTest: (count: number = 200) => {
        const currentState = get();
        const stressReservations = generateRandomReservations(
          count,
          currentState.selectedDate,
          currentState.reservations // Pass existing reservations to avoid overlaps
        );
        set((state) => ({
          reservations: [...state.reservations, ...stressReservations],
        }));
      },

      clearStressTest: () => {
        set((state) => ({
          reservations: state.reservations.filter(
            (r) => !r.id.startsWith('RES_GEN_')
          ),
        }));
      },

      // ========================================================================
      // Selectors
      // ========================================================================

      getReservationById: (id: UUID) => {
        return getReservationByIdSelector(get().reservations, id);
      },

      getReservationsByTable: (tableId: UUID) => {
        return getReservationsByTableSelector(get().reservations, tableId);
      },

      getTableById: (tableId: UUID) => {
        return getTableByIdSelector(get().tables, tableId);
      },

      getSectorById: (sectorId: UUID) => {
        return getSectorByIdSelector(get().sectors, sectorId);
      },

      getFilteredReservations: () => {
        const { reservations, tables, filters, selectedDate } = get();
        return getFilteredReservationsSelector(
          reservations,
          tables,
          selectedDate,
          {
            sectorIds: filters.sectorIds,
            statuses: filters.statuses,
            searchQuery: filters.searchQuery,
          }
        );
      },

      checkConflict: (
        tableId: UUID,
        startTime: string,
        endTime: string,
        excludeReservationId?: UUID
      ): ConflictCheck => {
        // Filter reservations to only include those on the same date as startTime
        // This prevents false conflicts when we have reservations across multiple days
        const startDate = new Date(startTime);
        const reservationsOnDate = get().reservations.filter((res) => {
          const resDate = new Date(res.startTime);
          return (
            resDate.getUTCFullYear() === startDate.getUTCFullYear() &&
            resDate.getUTCMonth() === startDate.getUTCMonth() &&
            resDate.getUTCDate() === startDate.getUTCDate()
          );
        });

        return checkConflictUtil(
          reservationsOnDate,
          tableId,
          startTime,
          endTime,
          excludeReservationId
        );
      },

      // ========================================================================
      // Table Suggestions
      // ========================================================================

      findBestTables: (
        partySize: number,
        startTime: string,
        durationMinutes: number,
        sectorPreference?: UUID
      ): TableSuggestion[] => {
        return findBestTables(
          get().tables,
          get().reservations,
          partySize,
          startTime,
          durationMinutes,
          sectorPreference
        );
      },

      findNextAvailableSlots: (
        partySize: number,
        desiredStartTime: string,
        durationMinutes: number,
        sectorPreference?: UUID
      ): TimeSlotSuggestion[] => {
        return findNextAvailableSlots(
          get().tables,
          get().reservations,
          partySize,
          desiredStartTime,
          durationMinutes,
          sectorPreference
        );
      },

      // ========================================================================
      // Utilities
      // ========================================================================

      resetToSeedData: () => {
        set({
          restaurant: initialRestaurant,
          sectors: initialSectors,
          tables: initialTables,
          reservations: initialReservations,
          selectedReservationIds: [],
          collapsedSectorIds: [],
          filters: createEmptyFilters(),
        });
      },
    }),
    { name: 'ReservationStore' }
  )
);

//#region Selector Hooks (for optimized re-renders)
export const useReservations = () =>
  useReservationStore((state) => state.reservations);

export const useTables = () => useReservationStore((state) => state.tables);

export const useSectors = () => useReservationStore((state) => state.sectors);

export const useFilteredReservations = () =>
  useReservationStore((state) => state.getFilteredReservations());

export const useSelectedReservations = () =>
  useReservationStore((state) =>
    state.reservations.filter((res) =>
      state.selectedReservationIds.includes(res.id)
    )
  );

// Export types for table suggestions
export type {
  TableSuggestion,
  TimeSlotSuggestion,
} from './utils/tableSuggestions';
