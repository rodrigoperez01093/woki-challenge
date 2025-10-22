'use client';

import type { Sector, Table } from '@/types';

interface SectorGroupProps {
  sector: Sector;
  tables: Table[];
  isCollapsed: boolean;
  onToggle: () => void;
  rowHeight: number;
}

/**
 * Sector group with collapsible table list
 */
export default function SectorGroup({
  sector,
  tables,
  isCollapsed,
  onToggle,
  rowHeight,
}: SectorGroupProps) {
  return (
    <div className="border-b border-gray-200">
      {/* Sector header - fixed height to match ROW_HEIGHT */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-1 border-b border-gray-200 bg-gray-100 px-2 text-left text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200 md:gap-2 md:px-4 md:text-sm"
        style={{ height: `${rowHeight}px` }}
      >
        <div
          className="h-2 w-2 shrink-0 rounded-sm md:h-3 md:w-3"
          style={{ backgroundColor: sector.color }}
        />
        <span className="flex-1 truncate">{sector.name}</span>
        <span className="text-xs text-gray-500">
          {isCollapsed ? '▶' : '▼'}
        </span>
      </button>

      {/* Table list */}
      {!isCollapsed && (
        <div>
          {tables.map((table) => (
            <div
              key={table.id}
              className="flex flex-col justify-center border-b border-gray-200 bg-white px-2 transition-colors hover:bg-gray-50 md:px-4"
              style={{ height: `${rowHeight}px` }}
            >
              <div className="truncate text-xs font-medium text-gray-900 md:text-sm">
                {table.name}
              </div>
              <div className="hidden text-xs text-gray-500 md:block">
                👥 {table.capacity.min}
                {table.capacity.min !== table.capacity.max &&
                  `-${table.capacity.max}`}{' '}
                personas
              </div>
              <div className="text-xs text-gray-500 md:hidden">
                👥 {table.capacity.min}
                {table.capacity.min !== table.capacity.max &&
                  `-${table.capacity.max}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
