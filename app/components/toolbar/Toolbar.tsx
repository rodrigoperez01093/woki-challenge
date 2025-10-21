'use client';

import { useState } from 'react';
import DateNavigator from './DateNavigator';
import FilterControls from './FilterControls';
import ZoomControls from './ZoomControls';
import CreateReservationModal from '../modals/CreateReservationModal';
import ConfirmModal from '../modals/ConfirmModal';
import { useReservationStore } from '@/store/useReservationStore';

export default function Toolbar() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { loadStressTest, clearStressTest, reservations } =
    useReservationStore();

  const hasStressTestData = reservations.some((r) =>
    r.id.startsWith('RES_GEN_')
  );

  const handleStressTest = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmStressTest = () => {
    if (hasStressTestData) {
      clearStressTest();
    } else {
      loadStressTest(200);
    }
  };

  return (
    <>
      {/* Mobile Layout - Header with Hamburger */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-3 shadow-sm md:hidden">
        {/* Hamburger Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="rounded-md p-2 text-gray-700 hover:bg-gray-100 active:bg-gray-200"
          aria-label="Abrir menú"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Date Navigator */}
        <div className="flex-1 px-2">
          <DateNavigator />
        </div>

        {/* Quick New Reservation Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 active:bg-blue-800"
          aria-label="Nueva reserva"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Sidebar Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 animate-fade-in bg-black/50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 w-[85vw] max-w-sm animate-slide-in-left bg-white shadow-xl md:hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h2 className="text-lg font-bold text-gray-900">Menú</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 active:bg-gray-200"
                aria-label="Cerrar menú"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Menu Content */}
            <div className="h-[calc(100vh-73px)] overflow-y-auto p-4">
              <div className="space-y-6">
                {/* Actions Section */}
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Acciones
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setIsCreateModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg bg-blue-600 px-4 py-3 text-left font-medium text-white hover:bg-blue-700 active:bg-blue-800"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Nueva Reserva
                    </button>

                    <button
                      onClick={() => {
                        handleStressTest();
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-medium text-white ${
                        hasStressTestData
                          ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                          : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
                      }`}
                    >
                      <span className="text-xl">
                        {hasStressTestData ? '🗑️' : '⚡'}
                      </span>
                      {hasStressTestData ? 'Limpiar Test' : 'Stress Test'}
                    </button>
                  </div>
                </div>

                {/* Filters Section */}
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Filtros
                  </h3>
                  <div className="space-y-2">
                    <FilterControls />
                  </div>
                </div>

                {/* Zoom Section */}
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Zoom
                  </h3>
                  <ZoomControls />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Desktop Layout */}
      <div className="hidden items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm md:flex">
        {/* New Reservation Button */}
        <button
          title="Crear nueva reserva"
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
        <DateNavigator />
        <div className="h-6 w-px bg-gray-300" />
        <FilterControls />
        <div className="flex-1" />
        <ActiveFiltersIndicator />
        <ZoomControls />
      </div>
      <CreateReservationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Stress Test Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmStressTest}
        title={
          hasStressTestData ? 'Eliminar Datos de Test' : 'Cargar Stress Test'
        }
        message={
          hasStressTestData
            ? '¿Desea eliminar los datos de stress test? Esto removerá todas las reservas generadas.'
            : '¿Desea cargar 200 reservas de stress test?'
        }
        confirmText={hasStressTestData ? 'Eliminar' : 'Cargar'}
        cancelText="Cancelar"
        type={hasStressTestData ? 'danger' : 'info'}
      />
    </>
  );
}

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
