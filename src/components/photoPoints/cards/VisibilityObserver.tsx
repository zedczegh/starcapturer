
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

  useEffect(() => {
    // If forceVisible is true, just call onVisibilityChange with true
    if (forceVisible) {
      onVisibilityChange(true);
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
