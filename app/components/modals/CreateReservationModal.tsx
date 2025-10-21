'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useReservationStore } from '@/store/useReservationStore';
import type { CreateReservationInput, UUID } from '@/types';
import {
  MIN_RESERVATION_DURATION,
  MAX_RESERVATION_DURATION,
  DEFAULT_RESERVATION_DURATION,
} from '@/lib/constants';
import { createISODateTime, formatDate } from '@/lib/utils/dateUtils';

interface CreateReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledData?: {
    tableId?: UUID;
    startTime?: Date;
    durationMinutes?: number;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    partySize?: number;
    status?: 'PENDING' | 'CONFIRMED';
    priority?: 'STANDARD' | 'VIP' | 'LARGE_GROUP';
    notes?: string;
  };
}

export default function CreateReservationModal({
  isOpen,
  onClose,
  prefilledData,
}: CreateReservationModalProps) {
  const selectedDate = useReservationStore((state) => state.selectedDate);
  const tables = useReservationStore((state) => state.tables);
  const sectors = useReservationStore((state) => state.sectors);
  const addReservation = useReservationStore((state) => state.addReservation);

  const initialFormState = {
    tableId: prefilledData?.tableId || '',
    customerName: prefilledData?.customerName || '',
    customerPhone: prefilledData?.customerPhone || '',
    customerEmail: prefilledData?.customerEmail || '',
    partySize: prefilledData?.partySize || 2,
    startHour: prefilledData?.startTime?.getHours() || 20,
    startMinute: prefilledData?.startTime?.getMinutes() || 0,
    durationMinutes:
      prefilledData?.durationMinutes || DEFAULT_RESERVATION_DURATION,
    status: prefilledData?.status || ('CONFIRMED' as const),
    priority: prefilledData?.priority || ('STANDARD' as const),
    notes: prefilledData?.notes || '',
    source: 'web' as const,
  };
  // Form state
  const [formData, setFormData] = useState({
    ...initialFormState,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when modal opens with prefilled data
  useEffect(() => {
    if (isOpen) {
      setFormData({
        tableId: prefilledData?.tableId || '',
        customerName: prefilledData?.customerName || '',
        customerPhone: prefilledData?.customerPhone || '',
        customerEmail: prefilledData?.customerEmail || '',
        partySize: prefilledData?.partySize || 2,
        startHour: prefilledData?.startTime?.getHours() || 20,
        startMinute: prefilledData?.startTime?.getMinutes() || 0,
        durationMinutes:
          prefilledData?.durationMinutes || DEFAULT_RESERVATION_DURATION,
        status: prefilledData?.status || 'CONFIRMED',
        priority: prefilledData?.priority || 'STANDARD',
        notes: prefilledData?.notes || '',
        source: 'web',
      });
      setErrors({});
    }
  }, [isOpen, prefilledData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.tableId) {
      newErrors.tableId = 'Debes seleccionar una mesa';
    }
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'El nombre es obligatorio';
    }
    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'El teléfono es obligatorio';
    }
    if (formData.partySize < 1) {
      newErrors.partySize = 'Debe haber al menos 1 persona';
    }
    if (
      formData.durationMinutes < MIN_RESERVATION_DURATION ||
      formData.durationMinutes > MAX_RESERVATION_DURATION
    ) {
      newErrors.durationMinutes = `La duración debe estar entre ${MIN_RESERVATION_DURATION} y ${MAX_RESERVATION_DURATION} minutos`;
    }

    // Check capacity
    if (formData.tableId) {
      const table = tables.find((t) => t.id === formData.tableId);
      if (table) {
        if (
          formData.partySize < table.capacity.min ||
          formData.partySize > table.capacity.max
        ) {
          newErrors.partySize = `Esta mesa acepta entre ${table.capacity.min} y ${table.capacity.max} personas`;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Create reservation
    const startTimeISO = createISODateTime(
      selectedDate,
      formData.startHour,
      formData.startMinute
    );

    const input: CreateReservationInput = {
      tableId: formData.tableId,
      customer: {
        name: formData.customerName,
        phone: formData.customerPhone,
        email: formData.customerEmail || undefined,
      },
      partySize: formData.partySize,
      startTime: startTimeISO,
      durationMinutes: formData.durationMinutes,
      status: formData.status,
      priority: formData.priority,
      notes: formData.notes || undefined,
      source: formData.source,
    };

    const success = addReservation(input);

    if (!success) {
      setErrors({
        tableId:
          'Esta mesa ya tiene una reserva en ese horario. Por favor, selecciona otra mesa u horario.',
      });
      return;
    }

    setFormData({ ...initialFormState });
    setErrors({});
    onClose();
  };

  const selectedTable = tables.find((t) => t.id === formData.tableId);

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-2 md:p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-4 text-black shadow-xl md:p-6">
              <Dialog.Title className="mb-3 text-xl font-bold text-gray-900 md:mb-4 md:text-2xl">
                Nueva Reserva
              </Dialog.Title>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Date Display */}
                <div className="rounded-md bg-blue-50 p-3 text-sm font-medium text-blue-900">
                  📅 {formatDate(selectedDate)}
                </div>

                {/* Table Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mesa *
                  </label>
                  <select
                    value={formData.tableId}
                    onChange={(e) =>
                      setFormData({ ...formData, tableId: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar mesa...</option>
                    {sectors.map((sector) => (
                      <optgroup key={sector.id} label={sector.name}>
                        {tables
                          .filter((t) => t.sectorId === sector.id)
                          .map((table) => (
                            <option key={table.id} value={table.id}>
                              {table.name} ({table.capacity.min}-
                              {table.capacity.max} personas)
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                  {errors.tableId && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.tableId}
                    </p>
                  )}
                </div>

                {/* Customer Info */}
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Nombre del cliente *
                    </label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerName: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.customerName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.customerName}
                      </p>
                    )}
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerPhone: e.target.value,
                        })
                      }
                      placeholder="+54 9 11 5555-1234"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.customerPhone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.customerPhone}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customerEmail: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Party Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número de comensales *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.partySize}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        partySize: parseInt(e.target.value) || 1,
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {selectedTable && (
                    <p className="mt-1 text-xs text-gray-500">
                      Capacidad de la mesa: {selectedTable.capacity.min}-
                      {selectedTable.capacity.max} personas
                    </p>
                  )}
                  {errors.partySize && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.partySize}
                    </p>
                  )}
                </div>

                {/* Time and Duration */}
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Hora
                    </label>
                    <input
                      type="number"
                      min="11"
                      max="23"
                      value={formData.startHour}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          startHour: parseInt(e.target.value) || 20,
                        })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Minutos
                    </label>
                    <select
                      value={formData.startMinute}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          startMinute: parseInt(e.target.value),
                        })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="0">00</option>
                      <option value="15">15</option>
                      <option value="30">30</option>
                      <option value="45">45</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Duración (min)
                    </label>
                    <select
                      value={formData.durationMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          durationMinutes: parseInt(e.target.value),
                        })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="90">90 min</option>
                      <option value="120">120 min</option>
                      <option value="150">150 min</option>
                      <option value="180">180 min</option>
                    </select>
                  </div>
                </div>

                {/* Status and Priority */}
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Estado
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as any, // eslint-disable-line
                        })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="PENDING">Pendiente</option>
                      <option value="CONFIRMED">Confirmado</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Prioridad
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: e.target.value as any, // eslint-disable-line
                        })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="STANDARD">Estándar</option>
                      <option value="VIP">VIP</option>
                      <option value="LARGE_GROUP">Grupo Grande</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Alergias, preferencias, ocasión especial..."
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setErrors({});
                      onClose();
                    }}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Crear Reserva
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
