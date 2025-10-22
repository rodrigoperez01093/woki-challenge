import type { Priority } from '@/types';

export interface ParsedReservation {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  partySize: number;
  date: string;
  startTime: string;
  durationMinutes: number;
  specialRequests?: string;
  priority: Priority;
  preferredSector?: string;
}

export interface CSVParseResult {
  success: boolean;
  data: ParsedReservation[];
  errors: CSVParseError[];
  warnings: CSVParseWarning[];
}

export interface CSVParseError {
  row: number;
  field?: string;
  message: string;
}

export interface CSVParseWarning {
  row: number;
  field?: string;
  message: string;
}

const VALID_PRIORITIES: Priority[] = ['STANDARD', 'VIP', 'LARGE_GROUP'];
const VALID_SECTORS = ['TERRAZA', 'INTERIOR', 'BAR', 'PRIVADO'];

function parseCSVText(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of field
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (char === '\n' && !insideQuotes) {
      // End of row
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else if (char === '\r') {
      // Skip carriage return
      continue;
    } else {
      currentField += char;
    }
  }

  // Add last field and row if exists
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  // Allow various formats: +54 11 1234-5678, 011-1234-5678, etc.
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
}

function isValidDate(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function isValidTime(timeStr: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(timeStr);
}

function parseReservationRow(
  row: string[],
  rowIndex: number
): {
  reservation?: ParsedReservation;
  errors: CSVParseError[];
  warnings: CSVParseWarning[];
} {
  const errors: CSVParseError[] = [];
  const warnings: CSVParseWarning[] = [];

  // columns
  const [
    customerName,
    customerPhone,
    customerEmail,
    partySizeStr,
    date,
    startTime,
    durationMinutesStr,
    specialRequests,
    priorityStr,
    preferredSector,
  ] = row;

  // Validate fields
  if (!customerName) {
    errors.push({
      row: rowIndex,
      field: 'customerName',
      message: 'El nombre del cliente es obligatorio',
    });
  }

  if (!customerPhone) {
    errors.push({
      row: rowIndex,
      field: 'customerPhone',
      message: 'El teléfono es obligatorio',
    });
  } else if (!isValidPhone(customerPhone)) {
    errors.push({
      row: rowIndex,
      field: 'customerPhone',
      message: 'Formato de teléfono inválido',
    });
  }

  if (!customerEmail) {
    errors.push({
      row: rowIndex,
      field: 'customerEmail',
      message: 'El email es obligatorio',
    });
  } else if (!isValidEmail(customerEmail)) {
    errors.push({
      row: rowIndex,
      field: 'customerEmail',
      message: 'Formato de email inválido',
    });
  }

  const partySize = parseInt(partySizeStr);
  if (!partySizeStr || isNaN(partySize)) {
    errors.push({
      row: rowIndex,
      field: 'partySize',
      message: 'El tamaño del grupo debe ser un número',
    });
  } else if (partySize < 1 || partySize > 20) {
    errors.push({
      row: rowIndex,
      field: 'partySize',
      message: 'El tamaño del grupo debe estar entre 1 y 20',
    });
  }

  if (!date) {
    errors.push({
      row: rowIndex,
      field: 'date',
      message: 'La fecha es obligatoria',
    });
  } else if (!isValidDate(date)) {
    errors.push({
      row: rowIndex,
      field: 'date',
      message: 'Formato de fecha inválido (usar YYYY-MM-DD)',
    });
  } else {
    // Parse date manually to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const reservationDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (reservationDate < today) {
      warnings.push({
        row: rowIndex,
        field: 'date',
        message: 'La fecha es en el pasado',
      });
    }
  }

  if (!startTime) {
    errors.push({
      row: rowIndex,
      field: 'startTime',
      message: 'La hora de inicio es obligatoria',
    });
  } else if (!isValidTime(startTime)) {
    errors.push({
      row: rowIndex,
      field: 'startTime',
      message: 'Formato de hora inválido (usar HH:MM)',
    });
  }

  const durationMinutes = parseInt(durationMinutesStr);
  if (!durationMinutesStr || isNaN(durationMinutes)) {
    errors.push({
      row: rowIndex,
      field: 'durationMinutes',
      message: 'La duración debe ser un número',
    });
  } else if (durationMinutes < 30 || durationMinutes > 240) {
    errors.push({
      row: rowIndex,
      field: 'durationMinutes',
      message: 'La duración debe estar entre 30 y 240 minutos',
    });
  }

  let priority: Priority = 'STANDARD';
  if (priorityStr) {
    const upperPriority = priorityStr.toUpperCase() as Priority;
    if (!VALID_PRIORITIES.includes(upperPriority)) {
      warnings.push({
        row: rowIndex,
        field: 'priority',
        message: `Prioridad inválida "${priorityStr}", usando STANDARD`,
      });
    } else {
      priority = upperPriority;
    }
  }

  if (
    preferredSector &&
    !VALID_SECTORS.includes(preferredSector.toUpperCase())
  ) {
    warnings.push({
      row: rowIndex,
      field: 'preferredSector',
      message: `Sector inválido "${preferredSector}", se ignorará`,
    });
  }

  if (errors.length > 0) {
    return { errors, warnings };
  }

  // Create parsed reservation
  const reservation: ParsedReservation = {
    customerName,
    customerPhone,
    customerEmail,
    partySize,
    date,
    startTime,
    durationMinutes,
    specialRequests: specialRequests || undefined,
    priority,
    preferredSector: preferredSector?.toUpperCase() || undefined,
  };

  return { reservation, errors, warnings };
}

export function parseCSV(csvContent: string): CSVParseResult {
  const rows = parseCSVText(csvContent);

  if (rows.length === 0) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, message: 'El archivo CSV está vacío' }],
      warnings: [],
    };
  }

  const dataRows = rows.slice(1);

  if (dataRows.length === 0) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, message: 'No hay datos en el archivo CSV' }],
      warnings: [],
    };
  }

  const parsedReservations: ParsedReservation[] = [];
  const allErrors: CSVParseError[] = [];
  const allWarnings: CSVParseWarning[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because we skip header and arrays are 0-indexed
    const { reservation, errors, warnings } = parseReservationRow(
      row,
      rowNumber
    );

    if (reservation) {
      parsedReservations.push(reservation);
    }

    allErrors.push(...errors);
    allWarnings.push(...warnings);
  });

  return {
    success: allErrors.length === 0,
    data: parsedReservations,
    errors: allErrors,
    warnings: allWarnings,
  };
}

export async function readCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsText(file);
  });
}
