
import React, { ReactNode, useRef, useEffect, useState } from 'react';

interface ContentVisibilityWrapperProps {
  visible: boolean;
  children: ReactNode;
  containerRef?: React.RefObject<HTMLDivElement>;
  dataAttributes?: Record<string, string>;
}

const ContentVisibilityWrapper: React.FC<ContentVisibilityWrapperProps> = ({
  visible,
  children,
  containerRef: externalContainerRef,
  dataAttributes = {}
}) => {
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = externalContainerRef || internalContainerRef;
  const [mounted, setMounted] = useState(false);
  
  // Mark as mounted on first render
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div 
      className={`transition-all duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`} 
      ref={containerRef}
      {...Object.entries(dataAttributes).reduce((acc, [key, value]) => {
        acc[`data-${key}`] = value;
        return acc;
      }, {} as Record<string, string>)}
      data-content-mounted={mounted ? "true" : "false"}
    >
      {children}
    </div>
  );
};

export default ContentVisibilityWrapper;
