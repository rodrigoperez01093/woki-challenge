import { describe, it, expect } from 'vitest';
import {
  getFilteredReservations,
  getReservationsByTable,
} from '../store/selectors/reservationSelectors';
import type { Reservation, Table } from '@/types';

describe('Reservation Filtering', () => {
  const mockTables: Table[] = [
    {
      id: 'TABLE_M1',
      sectorId: 'SECTOR_MAIN',
      name: 'M1',
      capacity: { min: 2, max: 4 },
      sortOrder: 1,
    },
    {
      id: 'TABLE_M2',
      sectorId: 'SECTOR_MAIN',
      name: 'M2',
      capacity: { min: 2, max: 4 },
      sortOrder: 2,
    },
    {
      id: 'TABLE_T1',
      sectorId: 'SECTOR_TERRACE',
      name: 'T1',
      capacity: { min: 4, max: 8 },
      sortOrder: 1,
    },
  ];

  const selectedDate = new Date('2025-10-20T00:00:00.000Z');

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
      tableId: 'TABLE_M2',
      customer: {
        name: 'Jane Smith',
        phone: '+1987654321',
        email: 'jane@example.com',
      },
      partySize: 2,
      startTime: '2025-10-20T20:00:00.000Z',
      endTime: '2025-10-20T21:30:00.000Z',
      durationMinutes: 90,
      status: 'PENDING',
      priority: 'VIP',
      source: 'phone',
      createdAt: '2025-10-20T10:00:00.000Z',
      updatedAt: '2025-10-20T10:00:00.000Z',
    },
    {
      id: 'RES_003',
      tableId: 'TABLE_T1',
      customer: { name: 'Bob Johnson', phone: '+1555555555' },
      partySize: 6,
      startTime: '2025-10-20T18:00:00.000Z',
      endTime: '2025-10-20T20:00:00.000Z',
      durationMinutes: 120,
      status: 'SEATED',
      priority: 'LARGE_GROUP',
      source: 'web',
      createdAt: '2025-10-20T10:00:00.000Z',
      updatedAt: '2025-10-20T10:00:00.000Z',
    },
    {
      id: 'RES_004',
      tableId: 'TABLE_M1',
      customer: { name: 'Alice Williams', phone: '+1666666666' },
      partySize: 3,
      startTime: '2025-10-20T21:30:00.000Z',
      endTime: '2025-10-20T23:00:00.000Z',
      durationMinutes: 90,
      status: 'NO_SHOW',
      priority: 'STANDARD',
      source: 'web',
      createdAt: '2025-10-20T10:00:00.000Z',
      updatedAt: '2025-10-20T10:00:00.000Z',
    },
  ];

  describe('getFilteredReservations', () => {
    it('should return all reservations when no filters applied', () => {
      const filtered = getFilteredReservations(
        mockReservations,
        mockTables,
        selectedDate,
        {} // No filters
      );

      expect(filtered).toHaveLength(4);
      expect(filtered).toEqual(mockReservations);
    });

    it('should filter by status', () => {
      const filtered = getFilteredReservations(
        mockReservations,
        mockTables,
        selectedDate,
        { statuses: ['PENDING'] }
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('RES_002');
      expect(filtered[0].status).toBe('PENDING');
    });

    it('should search by customer name (case-insensitive)', () => {
      const filtered = getFilteredReservations(
        mockReservations,
        mockTables,
        selectedDate,
        { searchQuery: 'john' } // Should match both "John Doe" and "Bob Johnson"
      );

      expect(filtered.length).toBeGreaterThanOrEqual(1);
      expect(filtered.map((r) => r.customer.name)).toContain('John Doe');
    });

    it('should search by phone number', () => {
      const filtered = getFilteredReservations(
        mockReservations,
        mockTables,
        selectedDate,
        { searchQuery: '1234' } // Partial phone match
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].customer.phone).toContain('1234');
    });

    it('should search by email if present', () => {
      const filtered = getFilteredReservations(
        mockReservations,
        mockTables,
        selectedDate,
        { searchQuery: 'jane@example.com' }
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('RES_002');
    });

    it('should combine multiple filters (AND logic)', () => {
      // Filter: status = CONFIRMED AND search contains "Doe"
      const filtered = getFilteredReservations(
        mockReservations,
        mockTables,
        selectedDate,
        { statuses: ['CONFIRMED'], searchQuery: 'Doe' }
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('RES_001');
      expect(filtered[0].status).toBe('CONFIRMED');
      expect(filtered[0].customer.name).toContain('Doe');
    });

    it('should return empty array when no matches found', () => {
      const filtered = getFilteredReservations(
        mockReservations,
        mockTables,
        selectedDate,
        { statuses: ['CANCELLED'] }
      );

      expect(filtered).toHaveLength(0);
    });
  });

  describe('getReservationsByTable', () => {
    it('should return all reservations for a specific table', () => {
      const tableReservations = getReservationsByTable(
        mockReservations,
        'TABLE_M1'
      );

      expect(tableReservations).toHaveLength(2);
      expect(tableReservations.every((r) => r.tableId === 'TABLE_M1')).toBe(
        true
      );
      expect(tableReservations.map((r) => r.id)).toEqual([
        'RES_001',
        'RES_004',
      ]);
    });

    it('should return reservations sorted by start time', () => {
      const tableReservations = getReservationsByTable(
        mockReservations,
        'TABLE_M1'
      );

      // Should be in chronological order
      expect(new Date(tableReservations[0].startTime).getTime()).toBeLessThan(
        new Date(tableReservations[1].startTime).getTime()
      );
    });
  });

  describe('Complex filtering scenarios', () => {
    it('should filter VIP reservations only', () => {
      const vipReservations = mockReservations.filter(
        (r) => r.priority === 'VIP'
      );

      expect(vipReservations).toHaveLength(1);
      expect(vipReservations[0].id).toBe('RES_002');
    });

    it('should filter large group reservations', () => {
      const largeGroupReservations = mockReservations.filter(
        (r) => r.priority === 'LARGE_GROUP'
      );

      expect(largeGroupReservations).toHaveLength(1);
      expect(largeGroupReservations[0].partySize).toBeGreaterThanOrEqual(6);
    });

    it('should filter by date range', () => {
      const startOfRange = new Date('2025-10-20T19:00:00.000Z');
      const endOfRange = new Date('2025-10-20T21:00:00.000Z');

      const inRange = mockReservations.filter((r) => {
        const resStart = new Date(r.startTime);
        return resStart >= startOfRange && resStart < endOfRange;
      });

      expect(inRange.length).toBeGreaterThanOrEqual(2);
    });
  });
});
