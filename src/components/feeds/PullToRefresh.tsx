import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  refreshing?: boolean;
  threshold?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  refreshing = false,
  threshold = 80,
  className
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const pullDistance = useMotionValue(0);
  
  const rotateValue = useTransform(pullDistance, [0, threshold], [0, 360]);
  const opacity = useTransform(pullDistance, [0, threshold], [0, 1]);
  const scale = useTransform(pullDistance, [0, threshold], [0.5, 1]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || window.scrollY > 0) return;

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    // Apply elastic resistance
    const elasticDistance = Math.min(distance * 0.5, threshold * 1.5);
    pullDistance.set(elasticDistance);
  }, [isPulling, threshold, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    const distance = pullDistance.get();
    
    if (distance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    pullDistance.set(0);
    setIsPulling(false);
    startY.current = 0;
    currentY.current = 0;
  }, [isPulling, threshold, onRefresh, isRefreshing, pullDistance]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsRefreshing(false);
      pullDistance.set(0);
    }
  }, [refreshing, pullDistance]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10"
        style={{
          y: pullDistance,
          opacity,
          pointerEvents: 'none'
        }}
      >
        <motion.div
          className="bg-cosmic-800/90 backdrop-blur-sm rounded-full p-3 shadow-lg border border-primary/20"
          style={{ scale, rotate: rotateValue }}
        >
          {isRefreshing || refreshing ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5 text-primary" />
          )}
        </motion.div>
      </motion.div>

      {/* Content with transform */}
      <motion.div style={{ y: pullDistance }}>
        {children}
      </motion.div>
    </div>
  );
};
