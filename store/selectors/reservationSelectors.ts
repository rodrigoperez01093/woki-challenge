import type {
  Reservation,
  Table,
  Sector,
  UUID,
  ReservationStatus,
} from '@/types';

// ============================================================================
// Basic Selectors
// ============================================================================

export function getReservationById(
  reservations: Reservation[],
  id: UUID
): Reservation | undefined {
  return reservations.find((res) => res.id === id);
}

export function getReservationsByTable(
  reservations: Reservation[],
  tableId: UUID
): Reservation[] {
  return reservations.filter((res) => res.tableId === tableId);
}

export function getTableById(
  tables: Table[],
  tableId: UUID
): Table | undefined {
  return tables.find((table) => table.id === tableId);
}

export function getSectorById(
  sectors: Sector[],
  sectorId: UUID
): Sector | undefined {
  return sectors.find((sector) => sector.id === sectorId);
}

export function getTablesBySector(tables: Table[], sectorId: UUID): Table[] {
  return tables.filter((table) => table.sectorId === sectorId);
}

// ============================================================================
// Filtered Selectors
// ============================================================================

interface FilterOptions {
  sectorIds?: UUID[];
  statuses?: ReservationStatus[];
  searchQuery?: string;
}

/**
 * Gets filtered reservations based on multiple criteria
 *
 * @param reservations - All reservations
 * @param tables - All tables (needed for sector filtering)
 * @param options - Filter options
 * @returns Filtered reservations array
 */
export function getFilteredReservations(
  reservations: Reservation[],
  tables: Table[],
  selectedDate: Date,
  options: FilterOptions = {}
): Reservation[] {
  let filtered = [...reservations];

  // Filter by selected date (same day)
  filtered = filtered.filter((res) => {
    const resDate = new Date(res.startTime);
    return (
      resDate.getFullYear() === selectedDate.getFullYear() &&
      resDate.getMonth() === selectedDate.getMonth() &&
      resDate.getDate() === selectedDate.getDate()
    );
  });

  // Filter by sectors
  if (options.sectorIds && options.sectorIds.length > 0) {
    const tableIds = tables
      .filter((t) => options.sectorIds!.includes(t.sectorId))
      .map((t) => t.id);
    filtered = filtered.filter((res) => tableIds.includes(res.tableId));
  }

  // Filter by status
  if (options.statuses && options.statuses.length > 0) {
    filtered = filtered.filter((res) => options.statuses!.includes(res.status));
  }

  // Filter by search query (name, phone, email)
  if (options.searchQuery && options.searchQuery.trim() !== '') {
    const query = options.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (res) =>
        res.customer.name.toLowerCase().includes(query) ||
        res.customer.phone.includes(query) ||
        res.customer.email?.toLowerCase().includes(query)
    );
  }

  return filtered;
}

/**
 * Gets reservations that are currently selected
 */
export function getSelectedReservations(
  reservations: Reservation[],
  selectedIds: UUID[]
): Reservation[] {
  return reservations.filter((res) => selectedIds.includes(res.id));
}

/**
 * Gets visible tables (excluding collapsed sectors)
 */
export function getVisibleTables(
  tables: Table[],
  collapsedSectorIds: UUID[]
): Table[] {
  return tables.filter((table) => !collapsedSectorIds.includes(table.sectorId));
}

// ============================================================================
// Computed Selectors
// ============================================================================

/**
 * Gets reservations grouped by table
 * Returns a Map for O(1) lookups
 */
export function getReservationsByTableMap(
  reservations: Reservation[]
): Map<UUID, Reservation[]> {
  const map = new Map<UUID, Reservation[]>();

  reservations.forEach((res) => {
    const existing = map.get(res.tableId) || [];
    map.set(res.tableId, [...existing, res]);
  });

  return map;
}

/**
 * Gets tables grouped by sector
 * Returns a Map for O(1) lookups
 */
export function getTablesBySectorMap(tables: Table[]): Map<UUID, Table[]> {
  const map = new Map<UUID, Table[]>();

  tables.forEach((table) => {
    const existing = map.get(table.sectorId) || [];
    map.set(table.sectorId, [...existing, table]);
  });

  return map;
}

/**
 * Gets reservation count by status
 */
export function getReservationCountByStatus(
  reservations: Reservation[]
): Record<ReservationStatus, number> {
  const counts: Record<ReservationStatus, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    SEATED: 0,
    FINISHED: 0,
    NO_SHOW: 0,
    CANCELLED: 0,
  };

  reservations.forEach((res) => {
    counts[res.status]++;
  });

  return counts;
}
