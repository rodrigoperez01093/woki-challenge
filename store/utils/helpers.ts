import type { UUID } from '@/types';

/**
 * Generates a unique ID for a new reservation
 * Format: RES_<timestamp>_<random>
 */
export function generateId(): UUID {
  return `RES_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculates end time based on start time and duration
 * @param startTime - ISO datetime string
 * @param durationMinutes - Duration in minutes
 * @returns ISO datetime string for end time
 */
export function calculateEndTime(
  startTime: string,
  durationMinutes: number
): string {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return end.toISOString();
}

/**
 * Gets current timestamp as ISO string
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Validates if duration is within allowed range
 * Min: 30 minutes, Max: 4 hours (240 minutes)
 */
export function isValidDuration(minutes: number): boolean {
  return minutes >= 30 && minutes <= 240;
}
