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
import { ReservationState, FiltersState } from './types';
import { parseISO } from 'date-fns';

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

      selectedDate: parseISO('2025-10-15'),
      viewMode: 'day',
      zoomLevel: 1,
      selectedReservationIds: [],
      collapsedSectorIds: [],

      filters: createEmptyFilters(),

      config: {
        date: '2025-10-15',
        startHour: 11,
        endHour: 24,
        slotMinutes: 15,
        viewMode: 'day',
      },

      // ========================================================================
      // Data Mutations
      // ========================================================================

      addReservation: (input: CreateReservationInput) => {
        const updated = addReservationAction(get().reservations, input);
        if (updated) {
          set({ reservations: updated });
        }
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
        const result = moveReservationAction(
          get().reservations,
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
        const { reservations, tables, filters } = get();
        return getFilteredReservationsSelector(reservations, tables, {
          sectorIds: filters.sectorIds,
          statuses: filters.statuses,
          searchQuery: filters.searchQuery,
        });
      },

      checkConflict: (
        tableId: UUID,
        startTime: string,
        endTime: string,
        excludeReservationId?: UUID
      ): ConflictCheck => {
        return checkConflictUtil(
          get().reservations,
          tableId,
          startTime,
          endTime,
          excludeReservationId
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
