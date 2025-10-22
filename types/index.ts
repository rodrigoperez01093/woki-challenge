// ============================================================================
//#region Base Types
// ============================================================================

export type UUID = string;
export type ISODateTime = string; // e.g., "2025-10-15T20:00:00-03:00"
export type Minutes = number;
export type SlotIndex = number; // 0-based, each slot = 15min

// ============================================================================
//#region Enums
// ============================================================================

export type ReservationStatus =
  | 'PENDING' // Awaiting confirmation
  | 'CONFIRMED' // Confirmed, not yet seated
  | 'SEATED' // Currently at the table
  | 'FINISHED' // Completed
  | 'NO_SHOW' // Didn't arrive
  | 'CANCELLED'; // Cancelled

export type Priority = 'STANDARD' | 'VIP' | 'LARGE_GROUP';

export type ReservationSource =
  | 'phone'
  | 'web'
  | 'walkin'
  | 'app'
  | 'BATCH_IMPORT';

export type ViewMode = 'day' | '3-day' | 'week';

export type ConflictReason =
  | 'overlap'
  | 'capacity_exceeded'
  | 'outside_service_hours';

// ============================================================================
//#region Domain Models
// ============================================================================

export interface Sector {
  id: UUID;
  name: string;
  color: string; // hex color
  sortOrder: number;
}

export interface Table {
  id: UUID;
  sectorId: UUID;
  name: string;
  capacity: {
    min: number;
    max: number;
  };
  sortOrder: number; // for Y-axis ordering
}

export interface Customer {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface Reservation {
  id: UUID;
  tableId: UUID;
  customer: Customer;
  partySize: number;
  startTime: ISODateTime;
  endTime: ISODateTime;
  durationMinutes: Minutes;
  status: ReservationStatus;
  priority: Priority;
  notes?: string;
  source?: ReservationSource;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface TimelineConfig {
  date: string; // "2025-10-15"
  startHour: number; // 11
  endHour: number; // 24 (or 0 for midnight)
  slotMinutes: Minutes; // 15
  viewMode: ViewMode;
}

export interface ConflictCheck {
  hasConflict: boolean;
  conflictingReservationIds: UUID[];
  reason?: ConflictReason;
}

export interface ServiceHours {
  start: string; // "12:00"
  end: string; // "16:00"
}

export interface Restaurant {
  id: UUID;
  name: string;
  timezone: string; // "America/Argentina/Buenos_Aires"
  serviceHours: ServiceHours[];
}

// ============================================================================
//#region UI State Types
// ============================================================================

export interface TimelineState {
  config: TimelineConfig;
  selectedDate: Date;
  zoomLevel: number; // 0.5, 0.75, 1, 1.25, 1.5
  filters: {
    sectorIds: UUID[];
    statuses: ReservationStatus[];
    searchQuery: string;
  };
  collapsedSectorIds: UUID[];
}

export interface DragState {
  isDragging: boolean;
  dragType: 'create' | 'move' | 'resize-left' | 'resize-right' | null;
  reservationId?: UUID;
  startPosition?: { x: number; y: number };
  currentPosition?: { x: number; y: number };
  originalReservation?: Reservation;
  previewReservation?: Partial<Reservation>;
}

// ============================================================================
//#region Seed Data Type
// ============================================================================

export interface SeedData {
  date: string;
  restaurant: Restaurant;
  sectors: Sector[];
  tables: Table[];
  reservations: Reservation[];
}

// ============================================================================
//#region Helper Types for Forms
// ============================================================================

export interface CreateReservationInput {
  tableId: UUID;
  customer: Customer;
  partySize: number;
  startTime: ISODateTime;
  durationMinutes: Minutes;
  status?: ReservationStatus;
  priority?: Priority;
  notes?: string;
  source?: ReservationSource;
}

export interface UpdateReservationInput {
  id: UUID;
  tableId?: UUID;
  customer?: Partial<Customer>;
  partySize?: number;
  startTime?: ISODateTime;
  durationMinutes?: Minutes;
  status?: ReservationStatus;
  priority?: Priority;
  notes?: string;
}

// ============================================================================
//#region Grid Coordinate Types
// ============================================================================

export interface GridPosition {
  x: number; // pixels
  y: number; // pixels
  slotIndex: SlotIndex;
  tableId: UUID;
}

export interface TimeSlot {
  index: SlotIndex;
  time: Date;
  label: string; // "20:00"
  isHour: boolean;
  isHalfHour: boolean;
}

// ============================================================================
// Type Guards
// ============================================================================
