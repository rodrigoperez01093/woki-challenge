import { format, parseISO, isSameDay as dateFnsIsSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ISODateTime } from '@/types';

/**
 * Formats a date to time string (HH:mm)
 *
 * @param date - Date object or ISO string
 * @returns Formatted time string
 *
 * @example
 * formatTime(new Date('2025-10-15T20:30:00')) // Returns "20:30"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;

  // Validate the date object
  if (!d || isNaN(d.getTime())) {
    console.error('Invalid date provided to formatTime:', date);
    return '--:--';
  }

  return format(d, 'HH:mm');
}

/**
 * Formats a date to short date string
 *
 * @param date - Date object or ISO string
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date('2025-10-15')) // Returns "15 Oct, 2025"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM, yyyy', { locale: es });
}

/**
 * Formats a date to long date string
 *
 * @param date - Date object or ISO string
 * @returns Formatted date string
 *
 * @example
 * formatDateLong(new Date('2025-10-15')) // Returns "Miércoles 15 Octubre, 2025"
 */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "EEEE dd 'de' MMMM, yyyy", { locale: es });
}

/**
 * Formats a date to short numeric format
 *
 * @param date - Date object or ISO string
 * @returns Formatted date string
 *
 * @example
 * formatDateShort(new Date('2025-10-15')) // Returns "15/10/2025"
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy');
}

/**
 * Gets the current time
 *
 * @returns Current Date object
 */
export function getCurrentTime(): Date {
  return new Date();
}

/**
 * Checks if two dates are the same day
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns true if same day, false otherwise
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return dateFnsIsSameDay(d1, d2);
}

/**
 * Formats time range
 *
 * @param start - Start time
 * @param end - End time
 * @returns Formatted range string
 *
 * @example
 * formatTimeRange("2025-10-15T20:00:00", "2025-10-15T21:30:00")
 * // Returns "20:00 - 21:30"
 */
export function formatTimeRange(
  start: Date | string,
  end: Date | string
): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Creates an ISO datetime string from date and time components
 *
 * @param date - Date object or ISO date string
 * @param hours - Hours (0-23)
 * @param minutes - Minutes (0-59)
 * @param timezone - Timezone offset (e.g., "-03:00")
 * @returns ISO datetime string
 */
export function createISODateTime(
  date: Date | string,
  hours: number,
  minutes: number,
  timezone: string = '-03:00'
): ISODateTime {
  const d = typeof date === 'string' ? parseISO(date) : date;
  d.setHours(hours, minutes, 0, 0);
  return `${format(d, "yyyy-MM-dd'T'HH:mm:ss")}${timezone}`;
}
