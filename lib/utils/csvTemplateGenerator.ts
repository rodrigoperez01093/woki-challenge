export interface CSVTemplateRow {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  partySize: string;
  date: string;
  startTime: string;
  durationMinutes: string;
  specialRequests: string;
  priority: string;
  preferredSector: string;
}

const CSV_HEADERS = [
  'customerName',
  'customerPhone',
  'customerEmail',
  'partySize',
  'date',
  'startTime',
  'durationMinutes',
  'specialRequests',
  'priority',
  'preferredSector',
] as const;

/**
 * Generates example rows with current date
 */
function getExampleRows(): CSVTemplateRow[] {
  // Create date at midnight local time to avoid timezone issues
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return [
    {
      customerName: 'Juan Pérez',
      customerPhone: '+54 11 1234-5678',
      customerEmail: 'juan.perez@example.com',
      partySize: '4',
      date: dateStr,
      startTime: '20:00',
      durationMinutes: '120',
      specialRequests: 'Ventana si es posible',
      priority: 'STANDARD',
      preferredSector: 'TERRAZA',
    },
    {
      customerName: 'María González',
      customerPhone: '+54 11 8765-4321',
      customerEmail: 'maria.gonzalez@example.com',
      partySize: '2',
      date: dateStr,
      startTime: '19:30',
      durationMinutes: '90',
      specialRequests: 'Aniversario',
      priority: 'VIP',
      preferredSector: 'INTERIOR',
    },
    {
      customerName: 'Carlos Rodríguez',
      customerPhone: '+54 11 5555-6666',
      customerEmail: 'carlos.rodriguez@example.com',
      partySize: '8',
      date: dateStr,
      startTime: '21:00',
      durationMinutes: '150',
      specialRequests: 'Cumpleaños, necesitamos espacio',
      priority: 'LARGE_GROUP',
      preferredSector: 'BAR',
    },
  ];
}

function escapeCSVField(value: string): string {
  // If field contains comma, newline, or quotes, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function objectsToCSV(rows: CSVTemplateRow[]): string {
  const headerRow = CSV_HEADERS.join(',');
  const dataRows = rows.map((row) => {
    return CSV_HEADERS.map((header) => escapeCSVField(row[header])).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

export function generateCSVTemplate(includeExamples: boolean = true): string {
  if (includeExamples) {
    return objectsToCSV(getExampleRows());
  }

  // Return just headers
  return CSV_HEADERS.join(',');
}

export function downloadCSVTemplate(includeExamples: boolean = true): void {
  const csv = generateCSVTemplate(includeExamples);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  // Format date in local timezone to avoid timezone offset issues
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `reservations-template-${dateStr}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

export function getCSVTemplateInstructions(): string {
  return `
Instrucciones para importar reservas en lote:

1. Descarga el template CSV con ejemplos
2. Completa los datos de las reservas siguiendo el formato:
   - customerName: Nombre completo del cliente
   - customerPhone: Teléfono (formato: +54 11 1234-5678)
   - customerEmail: Email del cliente
   - partySize: Número de comensales (1-20)
   - date: Fecha (formato: YYYY-MM-DD)
   - startTime: Hora de inicio (formato: HH:MM)
   - durationMinutes: Duración en minutos (30-240)
   - specialRequests: Peticiones especiales (opcional)
   - priority: STANDARD, VIP, o LARGE_GROUP
   - preferredSector: TERRAZA, INTERIOR, BAR, o PRIVADO (opcional)

3. Sube el archivo CSV
4. El sistema asignará automáticamente las mesas más adecuadas
5. Revisa y confirma las asignaciones propuestas

Notas:
- Las mesas se asignan priorizando el tamaño de grupo
- Se consideran las preferencias de sector cuando sea posible
- Se evitan conflictos de horario automáticamente
- Si no hay mesa disponible para alguna reserva, se marcará como pendiente
  `.trim();
}
