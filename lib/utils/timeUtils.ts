/**
 * Checks if two time ranges overlap
 *
 * @param start1 - Start time of first range (ISO string or Date)
 * @param end1 - End time of first range (ISO string or Date)
 * @param start2 - Start time of second range (ISO string or Date)
 * @param end2 - End time of second range (ISO string or Date)
 * @returns true if ranges overlap, false otherwise
 *
 * @example
 * checkTimeOverlap('2025-10-15T20:00:00', '2025-10-15T21:30:00',
 *                  '2025-10-15T21:00:00', '2025-10-15T22:30:00')
 * // Returns: true (overlaps from 21:00 to 21:30)
 *
 * Logic: Two ranges [s1, e1] and [s2, e2] overlap if:
 * s1 < e2 AND s2 < e1
 */
export function checkTimeOverlap(
  start1: string | Date,
  end1: string | Date,
  start2: string | Date,
  end2: string | Date
): boolean {
  const s1 =
    typeof start1 === 'string' ? new Date(start1).getTime() : start1.getTime();
  const e1 =
    typeof end1 === 'string' ? new Date(end1).getTime() : end1.getTime();
  const s2 =
    typeof start2 === 'string' ? new Date(start2).getTime() : start2.getTime();
  const e2 =
    typeof end2 === 'string' ? new Date(end2).getTime() : end2.getTime();

  return s1 < e2 && s2 < e1;
}
