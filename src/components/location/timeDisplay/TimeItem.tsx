
import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeItemProps {
  label: string;
  value: string;
  highlight?: boolean;
}

const TimeItem = ({ label, value, highlight = false }: TimeItemProps) => {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs sm:text-[11px] text-cosmic-300 font-medium">{label}</span>
      <div className={cn(
        "flex items-center gap-1 text-sm sm:text-sm",
        highlight ? "text-cosmic-50" : "text-cosmic-200"
      )}>
        <span className={cn(
          "font-mono text-base sm:text-sm",
          highlight && "font-medium"
        )}>{value}</span>
      </div>
    </div>
  );
};

export default React.memo(TimeItem);
