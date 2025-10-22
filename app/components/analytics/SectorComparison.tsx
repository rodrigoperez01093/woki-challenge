'use client';

import { useMemo } from 'react';
import { useReservationStore } from '@/store/useReservationStore';
import {
  calculateSectorMetrics,
  getOccupancyColor,
  formatPercentage,
} from '@/store/utils/sectorAnalytics';

export default function SectorComparison() {
  const sectors = useReservationStore((state) => state.sectors);
  const tables = useReservationStore((state) => state.tables);
  const selectedDate = useReservationStore((state) => state.selectedDate);
  const allReservations = useReservationStore((state) => state.reservations);

  // Get ALL reservations for the selected date (no filters applied)
  // This ensures metrics show the complete picture regardless of toolbar filters
  const reservations = useMemo(() => {
    return allReservations.filter((res) => {
      const resDate = new Date(res.startTime);
      return (
        resDate.getFullYear() === selectedDate.getFullYear() &&
        resDate.getMonth() === selectedDate.getMonth() &&
        resDate.getDate() === selectedDate.getDate()
      );
    });
  }, [allReservations, selectedDate]);

  // Calculate metrics for each sector
  const sectorMetrics = useMemo(
    () => calculateSectorMetrics(sectors, tables, reservations, selectedDate),
    [sectors, tables, reservations, selectedDate]
  );

  // Calculate totals
  const totals = useMemo(() => {
    return {
      capacity: sectorMetrics.reduce((sum, s) => sum + s.totalCapacity, 0),
      occupied: sectorMetrics.reduce((sum, s) => sum + s.occupiedSeats, 0),
      // Use direct count of reservations to avoid any calculation discrepancies
      reservations: reservations.length,
    };
  }, [sectorMetrics, reservations]);

  const overallOccupancy =
    totals.capacity > 0 ? (totals.occupied / totals.capacity) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header with overall stats */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Comparación de Sectores
        </h3>

        {/* Overall metrics */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">Ocupación Pico</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {formatPercentage(overallOccupancy)}
            </div>
            <div className="mt-0.5 text-[10px] text-gray-400">
              Momento de mayor ocupación
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">Asientos en Pico</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {totals.occupied}/{totals.capacity}
            </div>
            <div className="mt-0.5 text-[10px] text-gray-400">
              Máximo simultáneo
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">Total Reservas</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {totals.reservations}
            </div>
            <div className="mt-0.5 text-[10px] text-gray-400">
              Durante todo el día
            </div>
          </div>
        </div>
      </div>

      {/* Sector comparison cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sectorMetrics.map((sector) => {
          const color = getOccupancyColor(sector.occupancyRate);
          const occupancyBarWidth = Math.min(100, sector.occupancyRate);

          return (
            <div
              key={sector.sectorId}
              className={`rounded-lg border-2 ${color.border} ${color.bg} p-4 transition-all hover:shadow-md`}
            >
              {/* Sector name and occupancy */}
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {sector.sectorName}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {sector.totalTables} mesa
                    {sector.totalTables !== 1 ? 's' : ''}
                  </p>
                </div>
                <div
                  className={`rounded-full px-3 py-1 text-sm font-bold ${color.text}`}
                >
                  {formatPercentage(sector.occupancyRate)}
                </div>
              </div>

              {/* Peak indicator */}
              {sector.occupancyRate > 0 && (
                <div className="mb-2 text-xs text-gray-500">
                  Ocupación pico del día
                </div>
              )}

              {/* Occupancy bar */}
              <div className="mb-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all ${
                      sector.occupancyRate >= 90
                        ? 'bg-red-500'
                        : sector.occupancyRate >= 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${occupancyBarWidth}%` }}
                  />
                </div>
              </div>

              {/* Metrics grid */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pico ocupación:</span>
                  <span className="font-medium text-gray-900">
                    {sector.occupiedSeats}/{sector.totalCapacity} asientos
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total reservas:</span>
                  <span className="font-medium text-gray-900">
                    {sector.totalReservations}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Promedio grupo:</span>
                  <span className="font-medium text-gray-900">
                    {sector.averagePartySize.toFixed(1)} personas
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sectorMetrics.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-2 flex items-center gap-2 font-semibold text-blue-900">
            Información
          </h4>
          <ul className="space-y-1 text-sm text-blue-800">
            {(() => {
              const sorted = [...sectorMetrics].sort(
                (a, b) => b.occupancyRate - a.occupancyRate
              );
              const highest = sorted[0];
              const lowest = sorted[sorted.length - 1];

              return (
                <>
                  <li>
                    • <strong>{highest.sectorName}</strong> tiene la mayor
                    ocupación ({formatPercentage(highest.occupancyRate)})
                  </li>
                  {lowest.sectorId !== highest.sectorId && (
                    <li>
                      • <strong>{lowest.sectorName}</strong> tiene
                      disponibilidad (
                      {formatPercentage(100 - lowest.occupancyRate)} libre)
                    </li>
                  )}
                  {sectorMetrics.some((s) => s.occupancyRate >= 90) && (
                    <li className="text-red-700">
                      ⚠️ Algunos sectores están cerca del límite de capacidad
                    </li>
                  )}
                  {sectorMetrics.every((s) => s.occupancyRate < 50) && (
                    <li className="text-green-700">
                      ✓ Buena disponibilidad en todos los sectores
                    </li>
                  )}
                </>
              );
            })()}
          </ul>
        </div>
      )}
    </div>
  );
}
