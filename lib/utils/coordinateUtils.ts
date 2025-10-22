import {
  SLOT_WIDTH,
  SLOT_DURATION,
  START_HOUR,
  TOTAL_SLOTS,
} from '@/lib/constants';
import type { SlotIndex } from '@/types';

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
 * Converts width in pixels to duration in minutes
 *
 * @param pixels - Width in pixels
 * @returns Duration in minutes (rounded to nearest slot)
 *
 * @example
 * widthToDuration(360) // Returns 90 minutes
 */
export function widthToDuration(pixels: number): number {
  const slots = Math.round(pixels / SLOT_WIDTH);
  return slots * SLOT_DURATION;
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
 * Gets slot index from a time
 *
 * @param time - Date object
 * @param baseDate - Base date for the timeline
 * @returns Slot index (0-based)
 *
 * @example
 * getSlotIndexFromTime(new Date('2025-10-15T20:00:00')) // Returns 36
 */
export function getSlotIndexFromTime(time: Date, baseDate?: Date): SlotIndex {
  const base = baseDate || new Date(time);
  base.setHours(START_HOUR, 0, 0, 0);

  const minutesFromStart = (time.getTime() - base.getTime()) / (1000 * 60);
  return Math.floor(minutesFromStart / SLOT_DURATION);
}

/**
 * Gets time from a slot index
 *
 * @param slotIndex - Slot index (0-based)
 * @param baseDate - Base date for the timeline
 * @returns Date object for that slot
 *
 * @example
 * getTimeFromSlotIndex(36, new Date('2025-10-15')) // Returns Date for 20:00
 */
export function getTimeFromSlotIndex(
  slotIndex: SlotIndex,
  baseDate: Date
): Date {
  const minutes = slotIndex * SLOT_DURATION;
  const result = new Date(baseDate);
  result.setHours(START_HOUR, 0, 0, 0);
  result.setMinutes(result.getMinutes() + minutes);

  return result;
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

/**
 * Gets the slot index at a specific X position
 *
 * @param x - X position in pixels
 * @returns Slot index
 */
export function getSlotIndexFromX(x: number): SlotIndex {
  return Math.floor(x / SLOT_WIDTH);
}

/**
 * Gets X position from slot index
 *
 * @param slotIndex - Slot index
 * @returns X position in pixels
 */
export function getXFromSlotIndex(slotIndex: SlotIndex): number {
  return slotIndex * SLOT_WIDTH;
}

/**
 * Calculates overlap between two time ranges in pixels
 *
 * @param start1X - Start X of first range
 * @param width1 - Width of first range
 * @param start2X - Start X of second range
 * @param width2 - Width of second range
 * @returns Overlap width in pixels (0 if no overlap)
 */
export function calculateOverlap(
  start1X: number,
  width1: number,
  start2X: number,
  width2: number
): number {
  const end1X = start1X + width1;
  const end2X = start2X + width2;

  const overlapStart = Math.max(start1X, start2X);
  const overlapEnd = Math.min(end1X, end2X);

  return Math.max(0, overlapEnd - overlapStart);
}
