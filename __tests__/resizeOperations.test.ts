import { describe, it, expect, beforeEach } from 'vitest';
import { resizeReservation } from '@/store/actions/dragDropActions';
import type { Reservation } from '@/types';

describe('Resize Operations', () => {
  let mockReservations: Reservation[];

  beforeEach(() => {
    mockReservations = [
      {
        id: 'RES_001',
        tableId: 'TABLE_M1',
        customer: { name: 'John Doe', phone: '+1234567890' },
        partySize: 4,
        startTime: '2025-10-20T12:00:00.000Z',
        endTime: '2025-10-20T14:00:00.000Z',
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
        startTime: '2025-10-20T17:00:00.000Z',
        endTime: '2025-10-20T18:30:00.000Z',
        durationMinutes: 90,
        status: 'CONFIRMED',
        priority: 'STANDARD',
        source: 'web',
        createdAt: '2025-10-20T10:00:00.000Z',
        updatedAt: '2025-10-20T10:00:00.000Z',
      },
    ];
  });

  describe('Basic resize operations', () => {
    it('should successfully extend reservation duration', () => {
      const result = resizeReservation(
        mockReservations,
        'RES_001',
        150 // Extend from 120 to 150 minutes
      );

      expect(result.success).toBe(true);
      expect(result.reservations).toHaveLength(2);

      const resized = result.reservations.find((r) => r.id === 'RES_001');
      expect(resized?.durationMinutes).toBe(150);
      expect(resized?.startTime).toBe('2025-10-20T12:00:00.000Z'); // Start time unchanged
      expect(resized?.endTime).toBe('2025-10-20T14:30:00.000Z'); // End time updated
    });

    it('should successfully reduce reservation duration', () => {
      const result = resizeReservation(
        mockReservations,
        'RES_001',
        90 // Reduce from 120 to 90 minutes
      );

      expect(result.success).toBe(true);

      const resized = result.reservations.find((r) => r.id === 'RES_001');
      expect(resized?.durationMinutes).toBe(90);
      expect(resized?.startTime).toBe('2025-10-20T12:00:00.000Z');
      expect(resized?.endTime).toBe('2025-10-20T13:30:00.000Z'); // 90 min after start
    });

    it('should reject resize below minimum duration (30 min)', () => {
      const result = resizeReservation(
        mockReservations,
        'RES_001',
        15 // Below MIN_RESERVATION_DURATION
      );

      expect(result.success).toBe(false);
      expect(result.reservations).toEqual(mockReservations); // Unchanged
    });

    it('should reject resize above maximum duration (240 min)', () => {
      const result = resizeReservation(
        mockReservations,
        'RES_001',
        300 // Above MAX_RESERVATION_DURATION
      );

      expect(result.success).toBe(false);
      expect(result.reservations).toEqual(mockReservations);
    });

    it('should accept resize at minimum duration boundary (30 min)', () => {
      const result = resizeReservation(mockReservations, 'RES_001', 30);

      expect(result.success).toBe(true);

      const resized = result.reservations.find((r) => r.id === 'RES_001');
      expect(resized?.durationMinutes).toBe(30);
      expect(resized?.endTime).toBe('2025-10-20T12:30:00.000Z');
    });

    it('should accept resize at maximum duration boundary (240 min)', () => {
      const result = resizeReservation(mockReservations, 'RES_001', 240);

      expect(result.success).toBe(true);

      const resized = result.reservations.find((r) => r.id === 'RES_001');
      expect(resized?.durationMinutes).toBe(240);
      expect(resized?.endTime).toBe('2025-10-20T16:00:00.000Z'); // 4 hours after 12:00
    });
  });

  describe('Conflict detection during resize', () => {
    it('should reject resize that would overlap with next reservation', () => {
      // RES_002 is at different table, need to create one on same table
      const reservationsWithConflict: Reservation[] = [
        mockReservations[0],
        {
          ...mockReservations[1],
          startTime: '2025-10-20T14:30:00.000Z',
          endTime: '2025-10-20T16:00:00.000Z',
        },
      ];

      const result = resizeReservation(
        reservationsWithConflict,
        'RES_001',
        180 // 12:00 + 180 min = 15:00 (overlaps with 14:30-16:00)
      );

      expect(result.success).toBe(false);
      expect(result.reservations).toEqual(reservationsWithConflict);
    });

    it('should allow resize up to (but not overlapping) next reservation', () => {
      // Create RES_002 starting right after max extension
      const reservationsAdjacent: Reservation[] = [
        mockReservations[0],
        {
          ...mockReservations[1],
          startTime: '2025-10-20T14:30:00.000Z',
          endTime: '2025-10-20T16:00:00.000Z',
        },
      ];

      // Resize RES_001 to end exactly when RES_002 starts (14:30)
      // 12:00 to 14:30 = 150 minutes
      const result = resizeReservation(reservationsAdjacent, 'RES_001', 150);

      expect(result.success).toBe(true);

      const resized = result.reservations.find((r) => r.id === 'RES_001');
      expect(resized?.endTime).toBe('2025-10-20T14:30:00.000Z'); // Exactly when RES_002 starts
    });

    it('should allow reduce without conflict check', () => {
      // Reducing duration should never cause conflict
      const result = resizeReservation(mockReservations, 'RES_001', 60);

      expect(result.success).toBe(true);

      const resized = result.reservations.find((r) => r.id === 'RES_001');
      expect(resized?.durationMinutes).toBe(60);
    });
  });

  describe('Complex resize scenarios', () => {
    it('should handle resize with multiple reservations on same table', () => {
      const complexReservations: Reservation[] = [
        mockReservations[0], // RES_001: 12:00-14:00 on TABLE_M1
        {
          id: 'RES_002',
          tableId: 'TABLE_M1',
          customer: { name: 'Jane Smith', phone: '+1987654321' },
          partySize: 2,
          startTime: '2025-10-20T15:00:00.000Z',
          endTime: '2025-10-20T16:30:00.000Z',
          durationMinutes: 90,
          status: 'CONFIRMED',
          priority: 'STANDARD',
          source: 'web',
          createdAt: '2025-10-20T10:00:00.000Z',
          updatedAt: '2025-10-20T10:00:00.000Z',
        },
        {
          id: 'RES_003',
          tableId: 'TABLE_M1',
          customer: { name: 'Bob Johnson', phone: '+1555555555' },
          partySize: 3,
          startTime: '2025-10-20T17:00:00.000Z',
          endTime: '2025-10-20T18:30:00.000Z',
          durationMinutes: 90,
          status: 'CONFIRMED',
          priority: 'STANDARD',
          source: 'web',
          createdAt: '2025-10-20T10:00:00.000Z',
          updatedAt: '2025-10-20T10:00:00.000Z',
        },
      ];

      // Try to resize RES_002 to overlap with RES_003
      const result = resizeReservation(
        complexReservations,
        'RES_002',
        150 // 15:00 + 150min = 17:30 (overlaps with RES_003 at 17:00)
      );

      expect(result.success).toBe(false);
    });

    it('should preserve all properties except duration and endTime', () => {
      const result = resizeReservation(mockReservations, 'RES_001', 60);

      const resized = result.reservations.find((r) => r.id === 'RES_001');

      // Changed properties
      expect(resized?.durationMinutes).toBe(60);
      expect(resized?.endTime).toBe('2025-10-20T13:00:00.000Z');

      // Unchanged properties
      expect(resized?.tableId).toBe('TABLE_M1');
      expect(resized?.startTime).toBe('2025-10-20T12:00:00.000Z');
      expect(resized?.customer).toEqual({
        name: 'John Doe',
        phone: '+1234567890',
      });
      expect(resized?.partySize).toBe(4);
      expect(resized?.status).toBe('CONFIRMED');
      expect(resized?.priority).toBe('STANDARD');
    });

    it('should handle resize to same duration (no-op)', () => {
      const result = resizeReservation(
        mockReservations,
        'RES_001',
        120 // Same as current
      );

      expect(result.success).toBe(true);

      const resized = result.reservations.find((r) => r.id === 'RES_001');
      expect(resized?.durationMinutes).toBe(120);
      expect(resized?.endTime).toBe('2025-10-20T14:00:00.000Z');
    });

    it('should correctly handle resize in 15-minute increments', () => {
      // Test that resize works with standard 15-min slots
      const durations = [30, 45, 60, 75, 90, 105, 120];

      durations.forEach((duration) => {
        const result = resizeReservation(mockReservations, 'RES_001', duration);
        expect(result.success).toBe(true);

        const resized = result.reservations.find((r) => r.id === 'RES_001');
        expect(resized?.durationMinutes).toBe(duration);
      });
    });

    it('should handle edge case: resize to exact conflict boundary', () => {
      // Create adjacent reservation for boundary test
      const adjacentReservations: Reservation[] = [
        mockReservations[0],
        {
          ...mockReservations[1],
          startTime: '2025-10-20T14:30:00.000Z',
          endTime: '2025-10-20T16:00:00.000Z',
        },
      ];

      // RES_002 starts at 14:30
      // Resize RES_001 to 150 min (12:00 + 150 = 14:30)
      const result = resizeReservation(adjacentReservations, 'RES_001', 150);

      expect(result.success).toBe(true); // Should succeed (ends exactly when next starts)

      const resized = result.reservations.find((r) => r.id === 'RES_001');
      expect(resized?.endTime).toBe('2025-10-20T14:30:00.000Z');
    });
  });

  describe('Duration validation', () => {
    it('should reject invalid duration types', () => {
      const invalidDurations = [-30, 0, 25, 250, 500];

      invalidDurations.forEach((duration) => {
        const result = resizeReservation(mockReservations, 'RES_001', duration);
        expect(result.success).toBe(false);
      });
    });

    it('should accept all valid durations within range', () => {
      const validDurations = [30, 60, 90, 120, 150, 180, 210, 240];

      validDurations.forEach((duration) => {
        const result = resizeReservation(mockReservations, 'RES_001', duration);
        expect(result.success).toBe(true);
      });
    });
  });
});
