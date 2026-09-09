import React, { useState, useEffect, useRef, useMemo, memo, ReactNode } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
}

const VirtualListComponent = <T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = ''
}: VirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate which items should be visible
  const visibleRange = useMemo(() => {
    const containerHeightValue = containerHeight;
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeightValue / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, end + overscan)
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Calculate the total height and visible items
  const totalHeight = items.length * itemHeight;
  const visibleItems = useMemo(() => {
    const visible = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      visible.push({
        index: i,
        item: items[i],
        offsetTop: i * itemHeight
      });
    }
    return visible;
  }, [items, visibleRange, itemHeight]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height: containerHeight,
        overflowY: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ index, item, offsetTop }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: offsetTop,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export const VirtualList = memo(VirtualListComponent) as typeof VirtualListComponent;