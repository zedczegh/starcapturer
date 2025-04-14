
import React, { useState, useEffect, useRef } from 'react';

interface VisibilityObserverProps {
  onVisibilityChange: (isVisible: boolean) => void;
  children: React.ReactNode;
}

const VisibilityObserver: React.FC<VisibilityObserverProps> = ({
  onVisibilityChange,
  children
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
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
  }, [onVisibilityChange]);
  
  return <div ref={ref}>{children}</div>;
};

export default VisibilityObserver;
