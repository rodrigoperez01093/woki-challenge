'use client';

import { Fragment, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  downloadCSVTemplate,
  getCSVTemplateInstructions,
} from '@/lib/utils/csvTemplateGenerator';
import {
  parseCSV,
  readCSVFile,
  type CSVParseResult,
} from '@/lib/utils/csvParser';
import {
  assignTablesInBatch,
  createReservationsFromAssignments,
  type BatchAssignmentResult,
} from '@/lib/utils/batchTableAssignment';
import { useReservationStore } from '@/store/useReservationStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BatchSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'upload' | 'review' | 'confirm' | 'success';

export default function BatchSchedulingModal({
  isOpen,
  onClose,
}: BatchSchedulingModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [assignmentResult, setAssignmentResult] =
    useState<BatchAssignmentResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tables = useReservationStore((state) => state.tables);
  const sectors = useReservationStore((state) => state.sectors);
  const reservations = useReservationStore((state) => state.reservations);
  const replaceAllReservations = useReservationStore(
    (state) => state.replaceAllReservations
  );

  const handleDownloadTemplate = (includeExamples: boolean) => {
    downloadCSVTemplate(includeExamples);
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const csvContent = await readCSVFile(file);
      const result = parseCSV(csvContent);
      setParseResult(result);

      if (result.success && result.data.length > 0) {
        // Create sector name to ID map
        const sectorMap = new Map(sectors.map((s) => [s.name, s.id]));

        // Automatically assign tables
        const assignments = assignTablesInBatch(
          result.data,
          tables,
          reservations,
          sectorMap
        );
        setAssignmentResult(assignments);
        setStep('review');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error al procesar el archivo. Por favor intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!assignmentResult) return;

    setIsProcessing(true);

    try {
      const newReservations = createReservationsFromAssignments(
        assignmentResult.assignments
      );

      console.log('Replacing all reservations with:', newReservations);

      // Replace all existing reservations with the imported ones
      replaceAllReservations(newReservations);

      setStep('success');
    } catch (error) {
      console.error('Error importing reservations:', error);
      alert('Error al importar las reservas. Por favor intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setStep('upload');
    setParseResult(null);
    setAssignmentResult(null);
    setSelectedFile(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
        <div className="mx-auto mb-4 text-6xl">📄</div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          Importar reservas desde CSV
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          Sube un archivo CSV con las reservas a importar
        </p>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isProcessing ? 'Procesando...' : 'Seleccionar archivo CSV'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {selectedFile && (
            <p className="text-sm text-gray-600">
              Archivo: <span className="font-medium">{selectedFile.name}</span>
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-6">
        <h4 className="mb-3 font-semibold text-gray-900">Descargar template</h4>
        <p className="mb-4 text-sm text-gray-600">
          Descarga una plantilla CSV para facilitar la importación
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => handleDownloadTemplate(true)}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Con ejemplos
          </button>
          <button
            onClick={() => handleDownloadTemplate(false)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Solo encabezados
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 p-4">
        <h4 className="mb-2 text-sm font-semibold text-blue-900">
          Instrucciones
        </h4>
        <div className="whitespace-pre-line text-xs text-blue-800">
          {getCSVTemplateInstructions()}
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => {
    if (!parseResult || !assignmentResult) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
          <div>
            <h3 className="font-semibold text-gray-900">
              Resultado del análisis
            </h3>
            <p className="text-sm text-gray-600">
              {assignmentResult.successCount} asignaciones exitosas,{' '}
              {assignmentResult.failureCount} fallidas
            </p>
          </div>
        </div>

        {parseResult.errors.length > 0 && (
          <div className="rounded-lg bg-red-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-red-900">
              Errores de validación ({parseResult.errors.length})
            </h4>
            <div className="max-h-40 space-y-1 overflow-y-auto text-xs text-red-800">
              {parseResult.errors.map((error, idx) => (
                <div key={idx}>
                  Fila {error.row}
                  {error.field && ` - ${error.field}`}: {error.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {parseResult.warnings.length > 0 && (
          <div className="rounded-lg bg-yellow-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-yellow-900">
              Advertencias ({parseResult.warnings.length})
            </h4>
            <div className="max-h-40 space-y-1 overflow-y-auto text-xs text-yellow-800">
              {parseResult.warnings.map((warning, idx) => (
                <div key={idx}>
                  Fila {warning.row}
                  {warning.field && ` - ${warning.field}`}: {warning.message}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                    Cliente
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                    Fecha/Hora
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                    Personas
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                    Mesa asignada
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {assignmentResult.assignments.map((assignment, idx) => (
                  <tr
                    key={idx}
                    className={
                      assignment.assignedTable
                        ? 'hover:bg-gray-50'
                        : 'bg-red-50 hover:bg-red-100'
                    }
                  >
                    <td className="px-3 py-2 text-gray-900">
                      {assignment.reservation.customerName}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {(() => {
                        // Parse date manually to avoid timezone issues
                        const [year, month, day] =
                          assignment.reservation.date.split('-');
                        const localDate = new Date(
                          parseInt(year),
                          parseInt(month) - 1,
                          parseInt(day)
                        );
                        return format(localDate, 'dd/MM/yyyy', { locale: es });
                      })()}{' '}
                      {assignment.reservation.startTime}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {assignment.reservation.partySize}
                    </td>
                    <td className="px-3 py-2">
                      {assignment.assignedTable ? (
                        <span className="font-medium text-emerald-600">
                          {assignment.assignedTable.name}
                        </span>
                      ) : (
                        <span className="text-xs text-red-600">
                          Sin asignar
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {assignment.assignedTable ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                          ✓ OK
                        </span>
                      ) : (
                        <span
                          className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800"
                          title={assignment.reason}
                        >
                          ✗ Error
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {assignmentResult.failureCount > 0 && (
          <div className="rounded-lg bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Algunas reservas no pudieron ser asignadas. Puedes continuar e
              importar solo las exitosas, o corregir el archivo y volver a
              intentar.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderSuccessStep = () => (
    <div className="space-y-4 py-8 text-center">
      <div className="mx-auto text-8xl">✅</div>
      <h3 className="text-2xl font-bold text-gray-900">
        ¡Importación exitosa!
      </h3>
      <p className="text-gray-600">
        Se han importado {assignmentResult?.successCount || 0} reservas
        correctamente.
      </p>
      {assignmentResult && assignmentResult.failureCount > 0 && (
        <p className="text-sm text-yellow-600">
          {assignmentResult.failureCount} reservas no pudieron ser asignadas.
        </p>
      )}
    </div>
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="mb-6 text-2xl font-bold leading-6 text-gray-900"
                >
                  {step === 'upload' && 'Importación masiva de reservas'}
                  {step === 'review' && 'Revisar asignaciones'}
                  {step === 'success' && '¡Importación completada!'}
                </Dialog.Title>

                <div className="mb-6">
                  {step === 'upload' && renderUploadStep()}
                  {step === 'review' && renderReviewStep()}
                  {step === 'success' && renderSuccessStep()}
                </div>

                <div className="flex justify-end gap-3">
                  {step === 'upload' && (
                    <button
                      onClick={handleClose}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  )}

                  {step === 'review' && (
                    <>
                      <button
                        onClick={() => {
                          setStep('upload');
                          setParseResult(null);
                          setAssignmentResult(null);
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Volver
                      </button>
                      {assignmentResult &&
                        assignmentResult.successCount > 0 && (
                          <button
                            onClick={handleConfirmImport}
                            disabled={isProcessing}
                            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-400"
                          >
                            {isProcessing
                              ? 'Importando...'
                              : `Importar ${assignmentResult.successCount} reservas`}
                          </button>
                        )}
                    </>
                  )}

                  {step === 'success' && (
                    <button
                      onClick={handleClose}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Cerrar
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
