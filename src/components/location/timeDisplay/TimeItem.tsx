
import React from 'react';
import { cn } from '@/lib/utils';

interface TimeItemProps {
  label: string;
  value: string;
  highlight?: boolean;
}

// Optimized with memoization to prevent unnecessary re-renders
const TimeItem = ({ label, value, highlight = false }: TimeItemProps) => {
  // Use useMemo for computed class names to optimize performance
  const containerClasses = React.useMemo(() => 
    "flex flex-col gap-0.5",
    []
  );
  
  const textClasses = React.useMemo(() => 
    cn(
      "flex items-center gap-1 text-sm",
      highlight ? "text-cosmic-50" : "text-cosmic-200"
    ),
    [highlight]
  );
  
  const valueClasses = React.useMemo(() => 
    cn(
      "font-mono",
      highlight && "font-medium"
    ),
    [highlight]
  );

  return (
    <div className={containerClasses}>
      <span className="text-[11px] text-cosmic-300 font-medium">{label}</span>
      <div className={textClasses}>
        <span className={valueClasses}>{value}</span>
      </div>
    </div>
  );
};

export default React.memo(TimeItem);
