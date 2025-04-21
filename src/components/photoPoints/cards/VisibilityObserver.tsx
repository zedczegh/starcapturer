
import React, { useState, useEffect, useRef } from 'react';

interface VisibilityObserverProps {
  onVisibilityChange: (isVisible: boolean) => void;
  children: React.ReactNode;
  forceVisible?: boolean; // Added optional forceVisible prop
}

const VisibilityObserver: React.FC<VisibilityObserverProps> = ({
  onVisibilityChange,
  children,
  forceVisible = false
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  
  // Handle forced visibility
  useEffect(() => {
    if (forceVisible) {
      onVisibilityChange(true);
    }
  }, [forceVisible, onVisibilityChange]);
  
  useEffect(() => {
    if (forceVisible) return; // Skip observer if visibility is forced
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onVisibilityChange(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [onVisibilityChange, forceVisible]);
  
  return <div ref={ref}>{children}</div>;
};

export default VisibilityObserver;
