
import React, { useEffect, useRef, useState } from 'react';

export interface VisibilityObserverProps {
  children: React.ReactNode;
  onVisibilityChange: (isVisible: boolean) => void;
  forceVisible?: boolean;
}

const VisibilityObserver: React.FC<VisibilityObserverProps> = ({ 
  children, 
  onVisibilityChange,
  forceVisible = false
}) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  // Force visibility if needed
  useEffect(() => {
    if (forceVisible) {
      console.log('VisibilityObserver: Forcing visibility to true');
      onVisibilityChange(true);
    }
  }, [forceVisible, onVisibilityChange]);

  // Standard visibility observer
  useEffect(() => {
    // Skip if forceVisible is set
    if (forceVisible) {
      return;
    }

    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      onVisibilityChange(entry.isIntersecting);
    }, options);

    const currentElement = elementRef.current;
    if (currentElement) {
      observerRef.current.observe(currentElement);
    }

    return () => {
      if (currentElement && observerRef.current) {
        observerRef.current.unobserve(currentElement);
      }
    };
  }, [onVisibilityChange, forceVisible]);

  return <div ref={elementRef}>{children}</div>;
};

export default VisibilityObserver;
