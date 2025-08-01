import React, { memo, useMemo, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from './enhanced-loading';

// Optimized wrapper for heavy components
export const OptimizedComponent = memo(({ 
  children, 
  loading = false, 
  className = "",
  ...props 
}: {
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
  [key: string]: any;
}) => {
  const memoizedChildren = useMemo(() => children, [children]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
      {...props}
    >
      {memoizedChildren}
    </motion.div>
  );
});

OptimizedComponent.displayName = 'OptimizedComponent';

// Lazy loading wrapper with error boundary
export const LazyComponentWrapper = ({ 
  importFunction, 
  fallback = <LoadingSpinner size="lg" />,
  errorFallback = <div>Error loading component</div>
}: {
  importFunction: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}) => {
  const LazyComponent = lazy(importFunction);

  return (
    <Suspense fallback={fallback}>
      <LazyComponent />
    </Suspense>
  );
};

// Performance optimized list component
export const VirtualizedList = memo(({ 
  items, 
  renderItem, 
  itemHeight = 60,
  containerHeight = 400,
  className = ""
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length);

  const visibleItems = useMemo(() => 
    items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div 
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ 
          transform: `translateY(${startIndex * itemHeight}px)`,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0
        }}>
          {visibleItems.map((item, index) => 
            renderItem(item, startIndex + index)
          )}
        </div>
      </div>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

// Intersection observer hook for lazy loading
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
};

// Optimized image component with lazy loading
export const OptimizedImage = memo(({ 
  src, 
  alt, 
  className = "",
  width,
  height,
  loading = "lazy",
  ...props 
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  [key: string]: any;
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = () => setIsLoaded(true);
  const handleError = () => setHasError(true);

  if (hasError) {
    return (
      <div className={`bg-cosmic-800/40 flex items-center justify-center ${className}`}>
        <span className="text-cosmic-400">Image unavailable</span>
      </div>
    );
  }

  return (
    <motion.img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={loading}
      onLoad={handleLoad}
      onError={handleError}
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoaded ? 1 : 0.7 }}
      transition={{ duration: 0.3 }}
      {...props}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';