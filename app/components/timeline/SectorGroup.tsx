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
      {/* Sector header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 border-b border-gray-200 bg-gray-100 px-4 py-3 text-left text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
      >
        <div
          className="h-3 w-3 shrink-0 rounded-sm"
          style={{ backgroundColor: sector.color }}
        />
        <span className="flex-1">{sector.name}</span>
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
              className="flex flex-col justify-center border-b border-gray-200 bg-white px-4 transition-colors hover:bg-gray-50"
              style={{ height: `${rowHeight}px` }}
            >
              <div className="font-medium text-gray-900">{table.name}</div>
              <div className="text-xs text-gray-500">
                👥 {table.capacity.min}
                {table.capacity.min !== table.capacity.max &&
                  `-${table.capacity.max}`}{' '}
                personas
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
