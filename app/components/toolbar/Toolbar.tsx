'use client';

import { useState } from 'react';
import DateNavigator from './DateNavigator';
import FilterControls from './FilterControls';
import ZoomControls from './ZoomControls';
import CreateReservationModal from '../modals/CreateReservationModal';
import { useReservationStore } from '@/store/useReservationStore';

export default function Toolbar() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { loadStressTest, clearStressTest, reservations } =
    useReservationStore();

  const hasStressTestData = reservations.some((r) =>
    r.id.startsWith('RES_GEN_')
  );

  const handleStressTest = () => {
    if (hasStressTestData) {
      if (
        confirm(
          '¿Deseas eliminar los datos de stress test? Esto removerá todas las reservas generadas.'
        )
      ) {
        clearStressTest();
      }
    } else {
      if (
        confirm(
          '¿Cargar 200 reservas de stress test? Esto puede afectar el rendimiento.'
        )
      ) {
        loadStressTest(200);
      }
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        {/* New Reservation Button */}
        <button
          title="Crear nueva reserva (Ctrl + N)"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-95"
          onClick={() => setIsCreateModalOpen(true)}
        >
          + Nueva Reserva
        </button>

        {/* Stress Test Button */}
        <button
          title={
            hasStressTestData
              ? 'Eliminar datos de stress test'
              : 'Cargar 200 reservas para stress test'
          }
          className={`rounded-md px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:shadow-md active:scale-95 ${
            hasStressTestData
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
          onClick={handleStressTest}
        >
          {hasStressTestData ? '🗑️ Clear Test' : '⚡ Stress Test'}
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

      {/* Create Reservation Modal */}
      <CreateReservationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
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
