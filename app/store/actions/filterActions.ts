import type { UUID, ReservationStatus } from '@/app/types';
import type { FiltersState } from '@/app/store/types';
/**
 * Creates initial/empty filters
 */
export function createEmptyFilters(): FiltersState {
  return {
    sectorIds: [],
    statuses: [],
    searchQuery: '',
  };
}

/**
 * Updates filters by merging with existing filters
 *
 * @param currentFilters - Current filters state
 * @param updates - Partial filters to update
 * @returns Updated filters
 */
export function updateFilters(
  currentFilters: FiltersState,
  updates: Partial<FiltersState>
): FiltersState {
  return {
    ...currentFilters,
    ...updates,
  };
}

/**
 * Toggles a sector ID in the filter
 *
 * @param currentSectorIds - Current sector IDs array
 * @param sectorId - Sector ID to toggle
 * @returns Updated sector IDs array
 */
export function toggleSectorFilter(
  currentSectorIds: UUID[],
  sectorId: UUID
): UUID[] {
  const isSelected = currentSectorIds.includes(sectorId);

  if (isSelected) {
    return currentSectorIds.filter((id) => id !== sectorId);
  } else {
    return [...currentSectorIds, sectorId];
  }
}

/**
 * Toggles a status in the filter
 *
 * @param currentStatuses - Current statuses array
 * @param status - Status to toggle
 * @returns Updated statuses array
 */
export function toggleStatusFilter(
  currentStatuses: ReservationStatus[],
  status: ReservationStatus
): ReservationStatus[] {
  const isSelected = currentStatuses.includes(status);

  if (isSelected) {
    return currentStatuses.filter((s) => s !== status);
  } else {
    return [...currentStatuses, status];
  }
}

/**
 * Checks if any filters are active
 */
export function hasActiveFilters(filters: FiltersState): boolean {
  return (
    filters.sectorIds.length > 0 ||
    filters.statuses.length > 0 ||
    filters.searchQuery.trim() !== ''
  );
}

/**
 * Gets count of active filters
 */
export function getActiveFilterCount(filters: FiltersState): number {
  let count = 0;
  if (filters.sectorIds.length > 0) count++;
  if (filters.statuses.length > 0) count++;
  if (filters.searchQuery.trim() !== '') count++;
  return count;
}
