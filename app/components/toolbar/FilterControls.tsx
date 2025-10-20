'use client';

import { useState, useEffect } from 'react';
import { useReservationStore } from '@/store/useReservationStore';
import { STATUS_LABELS } from '@/lib/constants';
import type { ReservationStatus } from '@/types';

/**
 * Filter controls for sectors, status, and search
 */
export default function FilterControls() {
  return (
    <div className="flex items-center gap-2">
      <SectorFilter />
      <StatusFilter />
      <SearchFilter />
    </div>
  );
}

/**
 * Sector filter dropdown
 */
function SectorFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const sectors = useReservationStore((state) => state.sectors);
  const filters = useReservationStore((state) => state.filters);
  const setFilters = useReservationStore((state) => state.setFilters);

  const toggleSector = (sectorId: string) => {
    const currentSectors = filters.sectorIds;
    const newSectors = currentSectors.includes(sectorId)
      ? currentSectors.filter((id) => id !== sectorId)
      : [...currentSectors, sectorId];

    setFilters({ sectorIds: newSectors });
  };

  const selectedCount = filters.sectorIds.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        <span>Sectores</span>
        {selectedCount > 0 && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
            {selectedCount}
          </span>
        )}
        <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-md border border-gray-200 bg-white shadow-lg">
            <div className="max-h-64 overflow-y-auto p-2">
              {sectors.map((sector) => (
                <label
                  key={sector.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={filters.sectorIds.includes(sector.id)}
                    onChange={() => toggleSector(sector.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: sector.color }}
                  />
                  <span className="flex-1 text-sm text-gray-700">
                    {sector.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Status filter dropdown
 */
function StatusFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const filters = useReservationStore((state) => state.filters);
  const setFilters = useReservationStore((state) => state.setFilters);

  const statuses: ReservationStatus[] = [
    'PENDING',
    'CONFIRMED',
    'SEATED',
    'FINISHED',
    'NO_SHOW',
    'CANCELLED',
  ];

  const toggleStatus = (status: ReservationStatus) => {
    const currentStatuses = filters.statuses;
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    setFilters({ statuses: newStatuses });
  };

  const selectedCount = filters.statuses.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        <span>Estados</span>
        {selectedCount > 0 && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
            {selectedCount}
          </span>
        )}
        <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-md border border-gray-200 bg-white shadow-lg">
            <div className="max-h-64 overflow-y-auto p-2">
              {statuses.map((status) => (
                <label
                  key={status}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={filters.statuses.includes(status)}
                    onChange={() => toggleStatus(status)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="flex-1 text-sm text-gray-700">
                    {STATUS_LABELS[status]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Search input
 */
function SearchFilter() {
  const filters = useReservationStore((state) => state.filters);
  const setFilters = useReservationStore((state) => state.setFilters);
  const [localValue, setLocalValue] = useState(filters.searchQuery);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters({ searchQuery: localValue });
    }, 300);

    return () => clearTimeout(timeout);
  }, [localValue, setFilters]);

  return (
    <input
      type="search"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      placeholder="🔍 Buscar cliente..."
      className="w-56 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  );
}
