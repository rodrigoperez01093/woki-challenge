import { describe, it, expect, beforeEach } from 'vitest';
import { addReservation } from '@/store/actions/reservationActions';
import type { Reservation, CreateReservationInput } from '@/types';

describe('Reservation Creation', () => {
  let mockReservations: Reservation[];

  beforeEach(() => {
    mockReservations = [
      {
        id: 'RES_001',
        tableId: 'TABLE_M1',
        customer: {
          name: 'John Doe',
          phone: '+1234567890',
          email: 'john@example.com',
        },
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
    ];
  });

  it('should successfully create a new reservation with valid data', () => {
    const newReservation: CreateReservationInput = {
      tableId: 'TABLE_M2',
      customer: {
        name: 'Jane Smith',
        phone: '+1987654321',
        email: 'jane@example.com',
      },
      partySize: 2,
      startTime: '2025-10-20T20:00:00.000Z',
      durationMinutes: 90,
      status: 'PENDING',
      priority: 'VIP',
      source: 'phone',
    };

    const result = addReservation(mockReservations, newReservation);

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);
    expect(result?.[1]).toMatchObject({
      tableId: 'TABLE_M2',
      customer: {
        name: 'Jane Smith',
        phone: '+1987654321',
        email: 'jane@example.com',
      },
      partySize: 2,
      durationMinutes: 90,
      status: 'PENDING',
      priority: 'VIP',
    });
    expect(result?.[1].id).toMatch(/^RES_/);
  });

  it('should reject reservation with conflicting time slot', () => {
    const conflictingReservation: CreateReservationInput = {
      tableId: 'TABLE_M1', // Same table
      customer: {
        name: 'Conflicting Customer',
        phone: '+1111111111',
      },
      partySize: 2,
      startTime: '2025-10-20T20:00:00.000Z', // Overlaps with existing reservation
      durationMinutes: 60,
      status: 'CONFIRMED',
      priority: 'STANDARD',
      source: 'web',
    };

    const result = addReservation(mockReservations, conflictingReservation);

    expect(result).toBeNull(); // Should return null on conflict
  });

  it('should create reservation on same table with non-overlapping time', () => {
    const validReservation: CreateReservationInput = {
      tableId: 'TABLE_M1', // Same table as existing
      customer: {
        name: 'Valid Customer',
        phone: '+2222222222',
      },
      partySize: 3,
      startTime: '2025-10-20T21:00:00.000Z', // Starts when existing ends
      durationMinutes: 60,
      status: 'CONFIRMED',
      priority: 'STANDARD',
      source: 'web',
    };

    const result = addReservation(mockReservations, validReservation);

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);
  });

  it('should generate unique IDs for multiple reservations', () => {
    const reservation1: CreateReservationInput = {
      tableId: 'TABLE_M2',
      customer: { name: 'Customer 1', phone: '+1111' },
      partySize: 2,
      startTime: '2025-10-20T18:00:00.000Z',
      durationMinutes: 60,
      status: 'CONFIRMED',
      priority: 'STANDARD',
      source: 'web',
    };

    const reservation2: CreateReservationInput = {
      tableId: 'TABLE_M3',
      customer: { name: 'Customer 2', phone: '+2222' },
      partySize: 3,
      startTime: '2025-10-20T18:00:00.000Z',
      durationMinutes: 60,
      status: 'CONFIRMED',
      priority: 'STANDARD',
      source: 'web',
    };

    const result1 = addReservation(mockReservations, reservation1);
    const result2 = result1 ? addReservation(result1, reservation2) : null;

    expect(result2).not.toBeNull();
    expect(result2?.length).toBe(3);
    expect(result2?.[1].id).not.toBe(result2?.[2].id);
  });
});
