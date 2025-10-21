'use client';

import { useState, useEffect } from 'react';
import {
  useReservationStore,
  type TableSuggestion,
  type TimeSlotSuggestion,
} from '@/store/useReservationStore';
import { formatTimeDifference } from '@/store/utils/tableSuggestions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TableSuggestionsProps {
  partySize: number;
  startTime: Date;
  durationMinutes: number;
  onSelectTable: (tableId: string) => void;
  onSelectTimeSlot: (startTime: Date, tableId: string) => void;
  selectedTableId?: string;
}

export default function TableSuggestions({
  partySize,
  startTime,
  durationMinutes,
  onSelectTable,
  onSelectTimeSlot,
  selectedTableId,
}: TableSuggestionsProps) {
  const findBestTables = useReservationStore((state) => state.findBestTables);
  const findNextAvailableSlots = useReservationStore(
    (state) => state.findNextAvailableSlots
  );
  const sectors = useReservationStore((state) => state.sectors);

  const [suggestions, setSuggestions] = useState<TableSuggestion[]>([]);
  const [alternativeSlots, setAlternativeSlots] = useState<
    TimeSlotSuggestion[]
  >([]);
  const [showAlternatives, setShowAlternatives] = useState(false);

  // Update suggestions when inputs change
  useEffect(() => {
    if (partySize > 0 && startTime && durationMinutes > 0) {
      const startTimeISO = startTime.toISOString();
      const tableSuggestions = findBestTables(
        partySize,
        startTimeISO,
        durationMinutes
      );
      setSuggestions(tableSuggestions);

      // Check if there are no available tables at this time
      const hasAvailableTables = tableSuggestions.some((s) => s.isAvailable);
      if (!hasAvailableTables) {
        // Auto-show alternatives if no tables available
        const slots = findNextAvailableSlots(
          partySize,
          startTimeISO,
          durationMinutes
        );
        setAlternativeSlots(slots);
        setShowAlternatives(true);
      } else {
        setShowAlternatives(false);
      }
    }
  }, [
    partySize,
    startTime,
    durationMinutes,
    findBestTables,
    findNextAvailableSlots,
  ]);

  const handleFindAlternatives = () => {
    const startTimeISO = startTime.toISOString();
    const slots = findNextAvailableSlots(
      partySize,
      startTimeISO,
      durationMinutes
    );
    setAlternativeSlots(slots);
    setShowAlternatives(true);
  };

  const availableSuggestions = suggestions.filter((s) => s.isAvailable);
  const unavailableSuggestions = suggestions.filter((s) => !s.isAvailable);

  const getSectorName = (sectorId: string) => {
    return sectors.find((s) => s.id === sectorId)?.name || 'Desconocido';
  };

  if (partySize < 1) {
    return (
      <div className="text-sm text-gray-500">
        Ingresa el número de comensales para ver sugerencias de mesas
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {availableSuggestions.length > 0 ? (
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-700">
            Mesas disponibles ({availableSuggestions.length})
          </h4>
          <div className="space-y-2">
            {availableSuggestions.slice(0, 5).map((suggestion) => (
              <button
                key={suggestion.table.id}
                type="button"
                onClick={() => onSelectTable(suggestion.table.id)}
                className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                  selectedTableId === suggestion.table.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {suggestion.table.name}
                      <span className="ml-2 text-xs text-gray-500">
                        ({getSectorName(suggestion.table.sectorId)})
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {suggestion.reason}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Capacidad: {suggestion.table.capacity.min}-
                      {suggestion.table.capacity.max} personas
                    </div>
                  </div>
                  <div className="ml-3 flex flex-col items-end">
                    <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      {Math.round(suggestion.score)}% ideal
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center">
            <span className="text-2xl">⚠️</span>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-yellow-900">
                No hay mesas disponibles en este horario
              </p>
              <p className="mt-1 text-xs text-yellow-700">
                Intenta buscar horarios alternativos
              </p>
            </div>
          </div>
        </div>
      )}

      {availableSuggestions.length > 0 && !showAlternatives && (
        <button
          type="button"
          onClick={handleFindAlternatives}
          className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
        >
          🔍 Buscar horarios alternativos
        </button>
      )}

      {showAlternatives && alternativeSlots.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Horarios alternativos
            </h4>
            <button
              type="button"
              onClick={() => setShowAlternatives(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Ocultar
            </button>
          </div>
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {alternativeSlots.slice(0, 10).map((slot, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-medium text-gray-900">
                    {format(slot.startTime, "HH:mm 'hs'", { locale: es })}
                  </div>
                  <div className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                    {formatTimeDifference(startTime, slot.startTime)}
                  </div>
                </div>
                <div className="space-y-1">
                  {slot.suggestions.slice(0, 3).map((suggestion) => (
                    <button
                      key={suggestion.table.id}
                      type="button"
                      onClick={() =>
                        onSelectTimeSlot(slot.startTime, suggestion.table.id)
                      }
                      className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-left text-xs transition-colors hover:border-blue-400 hover:bg-blue-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {suggestion.table.name}
                        </span>
                        <span className="text-gray-500">
                          {suggestion.table.capacity.min}-
                          {suggestion.table.capacity.max} pax
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {unavailableSuggestions.length > 0 && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">
            Ver mesas no disponibles ({unavailableSuggestions.length})
          </summary>
          <div className="mt-2 space-y-1">
            {unavailableSuggestions.slice(0, 5).map((suggestion) => (
              <div
                key={suggestion.table.id}
                className="rounded border border-gray-200 bg-gray-50 p-2 opacity-60"
              >
                <div className="font-medium text-gray-700">
                  {suggestion.table.name}
                </div>
                <div className="text-gray-500">
                  {suggestion.score === 0
                    ? 'Capacidad incompatible'
                    : 'Ocupada'}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
