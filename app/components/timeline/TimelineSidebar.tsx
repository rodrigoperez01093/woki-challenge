'use client';

import { forwardRef } from 'react';
import { useReservationStore } from '@/store/useReservationStore';
import { ROW_HEIGHT } from '@/lib/constants';
import SectorGroup from './SectorGroup';

/**
 * Sidebar showing table list grouped by sectors
 */
const TimelineSidebar = forwardRef<HTMLDivElement>((_props, ref) => {
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
      ref={ref}
      className="w-[100px] shrink-0 overflow-y-hidden border-r-2 border-gray-200 bg-gray-50 md:w-[220px]"
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
});

TimelineSidebar.displayName = 'TimelineSidebar';

export default TimelineSidebar;
