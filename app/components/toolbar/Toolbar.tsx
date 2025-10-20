'use client';

import DateNavigator from './DateNavigator';
import FilterControls from './FilterControls';
import ZoomControls from './ZoomControls';

/**
 * Main toolbar with all controls
 */
export default function Toolbar() {
  return (
    <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
      {/* New Reservation Button */}
      <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
        + Nueva Reserva
      </button>

      {/* Date Navigator */}
      <DateNavigator />

      {/* Divider */}
      <div className="h-6 w-px bg-gray-300" />

      {/* Filters */}
      <FilterControls />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Active filters indicator */}
      <ActiveFiltersIndicator />

      {/* Zoom Controls */}
      <ZoomControls />
    </div>
  );
}

/**
 * Shows active filters count
 */
function ActiveFiltersIndicator() {
  // TODO: Get from store
  const activeFilterCount = 0;

  if (activeFilterCount === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
      <span>{activeFilterCount} filtros activos</span>
      <button className="hover:text-blue-900">×</button>
    </div>
  );
}
