import { describe, it, expect, beforeEach } from 'vitest';
import { moveReservation } from '@/store/actions/dragDropActions';
import type { Reservation } from '@/types';

describe('Drag & Drop Operations', () => {
  let mockReservations: Reservation[];

  beforeEach(() => {
    mockReservations = [
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
        tableId: 'TABLE_M2',
        customer: { name: 'Jane Smith', phone: '+1987654321' },
        partySize: 2,
        startTime: '2025-10-20T20:00:00.000Z',
        endTime: '2025-10-20T21:30:00.000Z',
        durationMinutes: 90,
        status: 'CONFIRMED',
        priority: 'STANDARD',
        source: 'web',
        createdAt: '2025-10-20T10:00:00.000Z',
        updatedAt: '2025-10-20T10:00:00.000Z',
      },
    ];
  });

  it('should successfully move reservation to different table at same time', () => {
    const result = moveReservation(
      mockReservations,
      'RES_001',
      'TABLE_M3', // Different table
      '2025-10-20T19:00:00.000Z' // Same time
    );

    expect(result.success).toBe(true);
    expect(result.reservations).toHaveLength(2);

    const movedReservation = result.reservations.find(
      (r) => r.id === 'RES_001'
    );
    expect(movedReservation?.tableId).toBe('TABLE_M3');
    expect(movedReservation?.startTime).toBe('2025-10-20T19:00:00.000Z');
    expect(movedReservation?.durationMinutes).toBe(120); // Duration unchanged
  });

  it('should successfully move reservation to different time on same table', () => {
    const result = moveReservation(
      mockReservations,
      'RES_001',
      'TABLE_M1', // Same table
      '2025-10-20T21:30:00.000Z' // Different time (after original)
    );

    expect(result.success).toBe(true);

    const movedReservation = result.reservations.find(
      (r) => r.id === 'RES_001'
    );
    expect(movedReservation?.startTime).toBe('2025-10-20T21:30:00.000Z');
    expect(movedReservation?.endTime).toBe('2025-10-20T23:30:00.000Z'); // 2 hours later
  });

  it('should fail to move reservation to conflicting time slot', () => {
    // Try to move RES_001 to overlap with RES_002
    const result = moveReservation(
      mockReservations,
      'RES_001',
      'TABLE_M2', // Same table as RES_002
      '2025-10-20T20:00:00.000Z' // Same time as RES_002
    );

    expect(result.success).toBe(false);
    expect(result.reservations).toEqual(mockReservations); // Unchanged
  });

  it('should successfully move reservation to adjacent time slot (no gap)', () => {
    // Move RES_001 to end exactly when RES_002 starts
    const result = moveReservation(
      mockReservations,
      'RES_001',
      'TABLE_M2',
      '2025-10-20T18:00:00.000Z' // Ends at 20:00, RES_002 starts at 20:00
    );

    expect(result.success).toBe(true);

    const movedReservation = result.reservations.find(
      (r) => r.id === 'RES_001'
    );
    expect(movedReservation?.tableId).toBe('TABLE_M2');
    expect(movedReservation?.endTime).toBe('2025-10-20T20:00:00.000Z');
  });

  it('should return failure for non-existent reservation', () => {
    const result = moveReservation(
      mockReservations,
      'RES_NONEXISTENT',
      'TABLE_M1',
      '2025-10-20T19:00:00.000Z'
    );

    expect(result.success).toBe(false);
    expect(result.reservations).toEqual(mockReservations);
  });

  it('should preserve all reservation properties except table and time', () => {
    const result = moveReservation(
      mockReservations,
      'RES_001',
      'TABLE_M3',
      '2025-10-20T22:00:00.000Z'
    );

    expect(result.success).toBe(true);

    const movedReservation = result.reservations.find(
      (r) => r.id === 'RES_001'
    );

    // These should change
    expect(movedReservation?.tableId).toBe('TABLE_M3');
    expect(movedReservation?.startTime).toBe('2025-10-20T22:00:00.000Z');

    // These should remain unchanged
    expect(movedReservation?.customer).toEqual({
      name: 'John Doe',
      phone: '+1234567890',
    });
    expect(movedReservation?.partySize).toBe(4);
    expect(movedReservation?.durationMinutes).toBe(120);
    expect(movedReservation?.status).toBe('CONFIRMED');
    expect(movedReservation?.priority).toBe('STANDARD');
  });

  it('should correctly calculate new end time after move', () => {
    const result = moveReservation(
      mockReservations,
      'RES_002', // 90 minute reservation
      'TABLE_M1',
      '2025-10-20T17:00:00.000Z'
    );

    expect(result.success).toBe(true);

    const movedReservation = result.reservations.find(
      (r) => r.id === 'RES_002'
    );

    expect(movedReservation?.startTime).toBe('2025-10-20T17:00:00.000Z');
    expect(movedReservation?.endTime).toBe('2025-10-20T18:30:00.000Z'); // +90 minutes
  });

  it('should allow moving to same table and time (no-op move)', () => {
    const result = moveReservation(
      mockReservations,
      'RES_001',
      'TABLE_M1', // Same table
      '2025-10-20T19:00:00.000Z' // Same time
    );

    expect(result.success).toBe(true);

    const reservation = result.reservations.find((r) => r.id === 'RES_001');
    expect(reservation?.tableId).toBe('TABLE_M1');
    expect(reservation?.startTime).toBe('2025-10-20T19:00:00.000Z');
  });
});
