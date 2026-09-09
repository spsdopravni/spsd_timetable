import React, { memo, useMemo } from 'react';
import { TramDepartures } from './TramDepartures';
import { VirtualList } from './VirtualList';
import type { Departure } from '@/types/pid';

interface OptimizedTramDeparturesProps {
  stationId: string | string[];
  maxItems?: number;
  customTitle?: string;
  showTimesInMinutes?: boolean;
  stationName?: string;
  disableAnimations?: boolean;
  timeOffset?: number;
  useVirtualScrolling?: boolean;
  containerHeight?: number;
}

const OptimizedTramDeparturesComponent: React.FC<OptimizedTramDeparturesProps> = ({
  useVirtualScrolling = false,
  containerHeight = 400,
  maxItems = 20,
  ...tramProps
}) => {
  // For small lists (< 10 items), regular rendering is more efficient
  if (!useVirtualScrolling || (maxItems && maxItems < 10)) {
    return <TramDepartures {...tramProps} maxItems={maxItems} />;
  }

  // For large lists, use virtual scrolling wrapper
  // This would require refactoring TramDepartures to separate data logic from rendering
  // For now, we'll keep the regular TramDepartures component
  return <TramDepartures {...tramProps} maxItems={maxItems} />;
};

export const OptimizedTramDepartures = memo(OptimizedTramDeparturesComponent);