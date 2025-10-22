import {
  SLOT_WIDTH,
  SLOT_DURATION,
  START_HOUR,
  TOTAL_SLOTS,
} from '@/lib/constants';

/**
 * Converts a time (Date) to X position in pixels
 *
 * @param time - Date object
 * @param baseDate - Base date for the timeline (defaults to start of day)
 * @returns X position in pixels from the start of the timeline
 *
 * @example
 * timeToX(new Date('2025-10-15T20:00:00')) // Returns 1080 (18 slots × 60px)
 */
export function timeToX(time: Date, baseDate?: Date): number {
  const base = new Date(baseDate || time);
  base.setHours(START_HOUR, 0, 0, 0);

  const minutesFromStart = (time.getTime() - base.getTime()) / (1000 * 60);
  const slotIndex = minutesFromStart / SLOT_DURATION;

  return slotIndex * SLOT_WIDTH;
}

/**
 * Converts X position in pixels to time (Date)
 *
 * @param x - X position in pixels
 * @param baseDate - Base date for the timeline
 * @returns Date object representing the time at that position
 *
 * @example
 * xToTime(1080, new Date('2025-10-15')) // Returns Date for 20:00
 */
export function xToTime(x: number, baseDate: Date): Date {
  const slotIndex = Math.round(x / SLOT_WIDTH);
  const minutes = slotIndex * SLOT_DURATION;

  const result = new Date(baseDate);
  result.setHours(START_HOUR, 0, 0, 0);
  result.setMinutes(result.getMinutes() + minutes);

  return result;
}

/**
 * Converts duration in minutes to width in pixels
 *
 * @param minutes - Duration in minutes
 * @returns Width in pixels
 *
 * @example
 * durationToWidth(90) // Returns 360 (6 slots × 60px)
 */
export function durationToWidth(minutes: number): number {
  const slots = minutes / SLOT_DURATION;
  return slots * SLOT_WIDTH;
}

/**
 * Snaps X position to the nearest time slot
 *
 * @param x - X position in pixels
 * @returns Snapped X position
 *
 * @example
 * snapToSlot(1095) // Returns 1080 (nearest slot)
 */
export function snapToSlot(x: number): number {
  const slotIndex = Math.round(x / SLOT_WIDTH);
  return slotIndex * SLOT_WIDTH;
}

/**
 * Checks if a position is within the timeline bounds
 * Allows reservations to extend one slot beyond the visible grid
 * to enable reservations ending at midnight (00:00)
 *
 * @param x - X position in pixels
 * @returns true if within bounds, false otherwise
 */
export function isWithinTimelineBounds(x: number): boolean {
  // Allow one extra slot beyond TOTAL_SLOTS to permit reservations ending at 00:00
  return x >= 0 && x <= (TOTAL_SLOTS + 1) * SLOT_WIDTH;
}

/**
 * Clamps a position to timeline bounds
 * Allows reservations to extend one slot beyond the visible grid
 *
 * @param x - X position in pixels
 * @returns Clamped position
 */
export function clampToTimelineBounds(x: number): number {
  // Allow one extra slot beyond TOTAL_SLOTS to permit reservations ending at 00:00
  return Math.max(0, Math.min(x, (TOTAL_SLOTS + 1) * SLOT_WIDTH));
}
