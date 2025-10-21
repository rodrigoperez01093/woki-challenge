import {
  format,
  parseISO,
  addMinutes as dateFnsAddMinutes,
  differenceInMinutes,
  isSameDay as dateFnsIsSameDay,
  startOfDay,
  endOfDay,
  isWithinInterval,
  addDays,
  subDays,
} from 'date-fns';
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
 * Formats a date to datetime string
 *
 * @param date - Date object or ISO string
 * @returns Formatted datetime string
 *
 * @example
 * formatDateTime(new Date('2025-10-15T20:30:00')) // Returns "15 Oct, 2025 20:30"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM, yyyy HH:mm', { locale: es });
}

/**
 * Parses an ISO datetime string to Date object
 *
 * @param isoString - ISO datetime string
 * @returns Date object
 *
 * @example
 * parseISODateTime("2025-10-15T20:00:00-03:00") // Returns Date object
 */
export function parseISODateTime(isoString: ISODateTime): Date {
  return parseISO(isoString);
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
 * Adds minutes to a date
 *
 * @param date - Date object or ISO string
 * @param minutes - Minutes to add
 * @returns New Date object
 *
 * @example
 * addMinutes(new Date('2025-10-15T20:00:00'), 90) // Returns Date for 21:30
 */
export function addMinutes(date: Date | string, minutes: number): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return dateFnsAddMinutes(d, minutes);
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
 * Gets the difference in minutes between two dates
 *
 * @param start - Start date
 * @param end - End date
 * @returns Difference in minutes
 *
 * @example
 * getMinutesBetween(new Date('2025-10-15T20:00:00'), new Date('2025-10-15T21:30:00'))
 * // Returns 90
 */
export function getMinutesBetween(
  start: Date | string,
  end: Date | string
): number {
  const s = typeof start === 'string' ? parseISO(start) : start;
  const e = typeof end === 'string' ? parseISO(end) : end;
  return differenceInMinutes(e, s);
}

/**
 * Gets start of day
 *
 * @param date - Date object
 * @returns Date at 00:00:00
 */
export function getStartOfDay(date: Date): Date {
  return startOfDay(date);
}

/**
 * Gets end of day
 *
 * @param date - Date object
 * @returns Date at 23:59:59
 */
export function getEndOfDay(date: Date): Date {
  return endOfDay(date);
}

/**
 * Checks if a time is within a time range
 *
 * @param time - Time to check
 * @param start - Range start
 * @param end - Range end
 * @returns true if within range, false otherwise
 */
export function isTimeWithinRange(
  time: Date | string,
  start: Date | string,
  end: Date | string
): boolean {
  const t = typeof time === 'string' ? parseISO(time) : time;
  const s = typeof start === 'string' ? parseISO(start) : start;
  const e = typeof end === 'string' ? parseISO(end) : end;

  return isWithinInterval(t, { start: s, end: e });
}

/**
 * Adds days to a date
 *
 * @param date - Date object
 * @param days - Days to add (can be negative)
 * @returns New Date object
 */
export function addDaysToDate(date: Date, days: number): Date {
  return days >= 0 ? addDays(date, days) : subDays(date, Math.abs(days));
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
 * Converts ISO datetime to ISO date string (YYYY-MM-DD)
 *
 * @param isoDateTime - ISO datetime string
 * @returns ISO date string
 *
 * @example
 * toISODateString("2025-10-15T20:00:00-03:00") // Returns "2025-10-15"
 */
export function toISODateString(isoDateTime: ISODateTime | Date): string {
  const date =
    typeof isoDateTime === 'string' ? parseISO(isoDateTime) : isoDateTime;
  return format(date, 'yyyy-MM-dd');
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
