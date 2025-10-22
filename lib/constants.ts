import type { ReservationStatus, Priority } from '@/types';

// ============================================================================
//#region Timeline Grid Configuration
// ============================================================================
export const SLOT_WIDTH = 60;
export const SLOT_DURATION = 15;
export const ROW_HEIGHT = 70;
export const START_HOUR = 11;
export const END_HOUR = 24;
export const TOTAL_HOURS = END_HOUR - START_HOUR; // 13 hours
// Total number of time slots (15-min increments)
export const TOTAL_SLOTS = (TOTAL_HOURS * 60) / SLOT_DURATION; // 52 slots
export const GRID_WIDTH = TOTAL_SLOTS * SLOT_WIDTH;
export const RESERVATION_VERTICAL_GAP = 8;

// ============================================================================
//#region Reservation Constraints
// ============================================================================
export const DEFAULT_RESERVATION_DURATION = 90;
export const MIN_RESERVATION_DURATION = 30;
export const MAX_RESERVATION_DURATION = 240; // 4 hours

// ============================================================================
//#region Colors by Status
// ============================================================================
export const STATUS_COLORS: Record<
  ReservationStatus,
  {
    bg: string;
    bgHover: string;
    border: string;
    text: string;
  }
> = {
  PENDING: {
    bg: 'bg-yellow-400',
    bgHover: 'hover:bg-yellow-500',
    border: 'border-yellow-500',
    text: 'text-yellow-900',
  },
  CONFIRMED: {
    bg: 'bg-blue-500',
    bgHover: 'hover:bg-blue-600',
    border: 'border-blue-600',
    text: 'text-white',
  },
  SEATED: {
    bg: 'bg-green-500',
    bgHover: 'hover:bg-green-600',
    border: 'border-green-600',
    text: 'text-white',
  },
  FINISHED: {
    bg: 'bg-gray-400',
    bgHover: 'hover:bg-gray-500',
    border: 'border-gray-500',
    text: 'text-gray-700',
  },
  NO_SHOW: {
    bg: 'bg-red-500',
    bgHover: 'hover:bg-red-600',
    border: 'border-red-600',
    text: 'text-white',
  },
  CANCELLED: {
    bg: 'bg-gray-300',
    bgHover: 'hover:bg-gray-400',
    border: 'border-gray-400',
    text: 'text-gray-600',
  },
};

// ============================================================================
//#region  Priority Styles
// ============================================================================
export const PRIORITY_STYLES: Record<
  Priority,
  {
    badge: string;
    border: string;
  }
> = {
  STANDARD: {
    badge: '',
    border: '',
  },
  VIP: {
    badge: 'bg-yellow-400 text-yellow-900',
    border: 'border-2 border-yellow-400',
  },
  LARGE_GROUP: {
    badge: 'bg-purple-400 text-purple-900',
    border: 'border-2 border-purple-400',
  },
};

// ============================================================================
//region Zoom Levels
// ============================================================================
export const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5] as const;

// ============================================================================
//#region Current Time Indicator
// ============================================================================
export const CURRENT_TIME_COLOR = '#ef4444'; // red-500
export const CURRENT_TIME_LINE_WIDTH = 2;
export const CURRENT_TIME_MARKER_SIZE = 12;

// ============================================================================
//#region Grid Lines
// ============================================================================
export const GRID_LINE_COLORS = {
  LIGHT: '#f9fafb', // gray-50 - every 15 min
  MEDIUM: '#f3f4f6', // gray-100 - every 30 min
  HEAVY: '#e5e7eb', // gray-200 - every hour
  BORDER: '#d1d5db', // gray-300 - main borders
} as const;

// ============================================================================
//#region Sidebar
// ============================================================================
export const HEADER_HEIGHT = 50;

// ============================================================================
//region Status Display Names
// ============================================================================
export const STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  SEATED: 'Sentado',
  FINISHED: 'Finalizado',
  NO_SHOW: 'No Show',
  CANCELLED: 'Cancelado',
};

// ============================================================================
//#region Priority Display Names
// ============================================================================
export const PRIORITY_LABELS: Record<Priority, string> = {
  STANDARD: 'Estándar',
  VIP: 'VIP',
  LARGE_GROUP: 'Grupo Grande',
};

// ============================================================================
//#region z-index Layers
// ============================================================================
export const Z_INDEX = {
  BASE: 0,
  GRID: 1,
  RESERVATION: 10,
  RESERVATION_HOVER: 20,
  RESERVATION_DRAGGING: 30,
  CURRENT_TIME_LINE: 100,
  MODAL: 1000,
  TOOLTIP: 2000,
} as const;
