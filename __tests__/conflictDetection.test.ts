import { describe, it, expect } from 'vitest';
import {
  checkConflict,
  checkTimeOverlap,
} from '@/store/utils/conflictDetection';
import type { Reservation } from '@/types';

describe('Conflict Detection', () => {
  const mockReservations: Reservation[] = [
    {
      id: 'RES_001',
      tableId: 'TABLE_M1',
      customer: { name: 'John Doe', phone: '+1234567890' },
      partySize: 4,
      startTime: '2025-10-20T19:00:00.000Z',
      endTime: '2025-10-20T21:00:00.000Z',
      durationMinutes: 120,
      status: 'CONFIRMED',
      priority: 'STANDARD',
      source: 'web',
      createdAt: '2025-10-20T10:00:00.000Z',
      updatedAt: '2025-10-20T10:00:00.000Z',
    },
    {
      id: 'RES_002',
      tableId: 'TABLE_M1',
      customer: { name: 'Jane Smith', phone: '+1987654321' },
      partySize: 2,
      startTime: '2025-10-20T21:30:00.000Z',
      endTime: '2025-10-20T23:00:00.000Z',
      durationMinutes: 90,
      status: 'CONFIRMED',
      priority: 'STANDARD',
      source: 'web',
      createdAt: '2025-10-20T10:00:00.000Z',
      updatedAt: '2025-10-20T10:00:00.000Z',
    },
  ];

  describe('checkTimeOverlap', () => {
    it('should detect overlapping time ranges', () => {
      const overlap = checkTimeOverlap(
        '2025-10-20T19:00:00.000Z', // Start 1
        '2025-10-20T21:00:00.000Z', // End 1
        '2025-10-20T20:00:00.000Z', // Start 2 (within range 1)
        '2025-10-20T22:00:00.000Z' // End 2
      );

      expect(overlap).toBe(true);
    });

    it('should not detect non-overlapping time ranges (gap between)', () => {
      const overlap = checkTimeOverlap(
        '2025-10-20T19:00:00.000Z', // 19:00 - 21:00
        '2025-10-20T21:00:00.000Z',
        '2025-10-20T21:30:00.000Z', // 21:30 - 23:00 (30 min gap)
        '2025-10-20T23:00:00.000Z'
      );

      expect(overlap).toBe(false);
    });

    it('should not detect overlap when ranges are adjacent (end = start)', () => {
      const overlap = checkTimeOverlap(
        '2025-10-20T19:00:00.000Z', // 19:00 - 21:00
        '2025-10-20T21:00:00.000Z',
        '2025-10-20T21:00:00.000Z', // 21:00 - 22:00 (starts exactly when first ends)
        '2025-10-20T22:00:00.000Z'
      );

      expect(overlap).toBe(false);
    });

    it('should detect when one range completely contains another', () => {
      const overlap = checkTimeOverlap(
        '2025-10-20T18:00:00.000Z', // 18:00 - 23:00 (large range)
        '2025-10-20T23:00:00.000Z',
        '2025-10-20T20:00:00.000Z', // 20:00 - 21:00 (completely inside)
        '2025-10-20T21:00:00.000Z'
      );

      expect(overlap).toBe(true);
    });
  });

  describe('checkConflict', () => {
    it('should detect conflict with existing reservation on same table', () => {
      const conflict = checkConflict(
        mockReservations,
        'TABLE_M1',
        '2025-10-20T20:00:00.000Z', // Overlaps with RES_001
        '2025-10-20T22:00:00.000Z'
      );

      expect(conflict.hasConflict).toBe(true);
      expect(conflict.conflictingReservationIds).toContain('RES_001');
      expect(conflict.reason).toBe('overlap');
    });

    it('should not detect conflict on different table', () => {
      const conflict = checkConflict(
        mockReservations,
        'TABLE_M2', // Different table
        '2025-10-20T20:00:00.000Z',
        '2025-10-20T22:00:00.000Z'
      );

      expect(conflict.hasConflict).toBe(false);
      expect(conflict.conflictingReservationIds).toEqual([]);
      expect(conflict.reason).toBeUndefined();
    });

    it('should not detect conflict in available time slot on same table', () => {
      const conflict = checkConflict(
        mockReservations,
        'TABLE_M1',
        '2025-10-20T21:00:00.000Z', // Between RES_001 (ends 21:00) and RES_002 (starts 21:30)
        '2025-10-20T21:30:00.000Z'
      );

      expect(conflict.hasConflict).toBe(false);
      expect(conflict.conflictingReservationIds).toEqual([]);
    });

    it('should exclude specified reservation when checking conflicts', () => {
      // Simulate updating RES_001 - should not conflict with itself
      const conflict = checkConflict(
        mockReservations,
        'TABLE_M1',
        '2025-10-20T19:00:00.000Z', // Same time as RES_001
        '2025-10-20T21:00:00.000Z',
        'RES_001' // Exclude this reservation
      );

      expect(conflict.hasConflict).toBe(false);
    });

    it('should detect multiple conflicting reservations', () => {
      const multipleReservations: Reservation[] = [
        ...mockReservations,
        {
          id: 'RES_003',
          tableId: 'TABLE_M1',
          customer: { name: 'Bob Johnson', phone: '+1555555555' },
          partySize: 3,
          startTime: '2025-10-20T22:00:00.000Z',
          endTime: '2025-10-20T23:30:00.000Z',
          durationMinutes: 90,
          status: 'CONFIRMED',
          priority: 'STANDARD',
          source: 'web',
          createdAt: '2025-10-20T10:00:00.000Z',
          updatedAt: '2025-10-20T10:00:00.000Z',
        },
      ];

      // This time slot overlaps with RES_002 and RES_003
      const conflict = checkConflict(
        multipleReservations,
        'TABLE_M1',
        '2025-10-20T22:30:00.000Z',
        '2025-10-20T23:30:00.000Z'
      );

      expect(conflict.hasConflict).toBe(true);
      expect(conflict.conflictingReservationIds.length).toBe(2);
      expect(conflict.conflictingReservationIds).toContain('RES_002');
      expect(conflict.conflictingReservationIds).toContain('RES_003');
    });

    it('should handle edge case: reservation starting at exact same time', () => {
      const conflict = checkConflict(
        mockReservations,
        'TABLE_M1',
        '2025-10-20T19:00:00.000Z', // Exact same start as RES_001
        '2025-10-20T20:00:00.000Z'
      );

      expect(conflict.hasConflict).toBe(true);
      expect(conflict.conflictingReservationIds).toContain('RES_001');
    });
  });
});
