'use client';

import { useReservationStore } from '@/store/useReservationStore';
import { SIDEBAR_WIDTH, ROW_HEIGHT } from '@/lib/constants';
import SectorGroup from './SectorGroup';

/**
 * Sidebar showing table list grouped by sectors
 */
export default function TimelineSidebar() {
  const sectors = useReservationStore((state) => state.sectors);
  const tables = useReservationStore((state) => state.tables);
  const collapsedSectorIds = useReservationStore(
    (state) => state.collapsedSectorIds
  );
  const toggleSectorCollapse = useReservationStore(
    (state) => state.toggleSectorCollapse
  );

  return (
    <div
      className="shrink-0 overflow-y-auto border-r-2 border-gray-200 bg-gray-50"
      style={{ width: `${SIDEBAR_WIDTH}px` }}
    >
      {sectors.map((sector) => {
        const sectorTables = tables.filter((t) => t.sectorId === sector.id);
        const isCollapsed = collapsedSectorIds.includes(sector.id);

        return (
          <SectorGroup
            key={sector.id}
            sector={sector}
            tables={sectorTables}
            isCollapsed={isCollapsed}
            onToggle={() => toggleSectorCollapse(sector.id)}
            rowHeight={ROW_HEIGHT}
          />
        );
      })}
    </div>
  );
}
