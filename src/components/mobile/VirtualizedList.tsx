import React, { useMemo } from 'react';
import { useVirtualScroll } from '../../hooks/useVirtualScroll';

interface VirtualizedListProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

export function VirtualizedList({ 
  items, 
  itemHeight, 
  containerHeight,
  renderItem,
  className = '',
  overscan = 5
}: VirtualizedListProps) {
  const { visibleItems, totalHeight, onScroll } = useVirtualScroll({
    itemHeight,
    containerHeight,
    overscan,
    items
  });

  const containerStyle = useMemo(() => ({
    height: containerHeight,
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch'
  }), [containerHeight]);

  const contentStyle = useMemo(() => ({
    height: totalHeight,
    position: 'relative' as const
  }), [totalHeight]);

  return (
    <div 
      className={`${className}`}
      style={containerStyle}
      onScroll={onScroll}
    >
      <div style={contentStyle}>
        {visibleItems.map(({ item, index, offsetY }) => (
          <div
            key={item.id || index}
            style={{
              position: 'absolute',
              top: offsetY,
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
}