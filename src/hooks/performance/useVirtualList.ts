import { useState, useMemo, useCallback } from 'react';

interface UseVirtualListOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

/**
 * Virtual list hook for performance optimization with large datasets
 */
export function useVirtualList<T>(
  items: T[],
  options: UseVirtualListOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const totalHeight = items.length * itemHeight;

  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(start + visibleItemCount + overscan, items.length);
    const adjustedStart = Math.max(0, start - overscan);
    
    return {
      startIndex: adjustedStart,
      endIndex: end,
      visibleItems: items.slice(adjustedStart, end)
    };
  }, [items, scrollTop, itemHeight, visibleItemCount, overscan]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const offsetY = startIndex * itemHeight;

  return {
    totalHeight,
    visibleItems,
    startIndex,
    endIndex,
    offsetY,
    handleScroll
  };
}

/**
 * Simple intersection observer hook for lazy loading
 */
export function useIntersectionObserver(
  callback: (isIntersecting: boolean) => void,
  options: IntersectionObserverInit = {}
) {
  const [element, setElement] = useState<Element | null>(null);

  const observer = useMemo(() => {
    if (!element || !('IntersectionObserver' in window)) return null;
    
    return new IntersectionObserver(([entry]) => {
      callback(entry.isIntersecting);
    }, {
      threshold: 0.1,
      ...options
    });
  }, [element, callback, options]);

  // Set up observer
  useMemo(() => {
    if (observer && element) {
      observer.observe(element);
      return () => observer.unobserve(element);
    }
  }, [observer, element]);

  return setElement;
}