
import React from 'react';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface WeatherPropertyProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tooltip?: string;
}

const WeatherProperty: React.FC<WeatherPropertyProps> = ({
  icon,
  label,
  value,
  tooltip
}) => {
  const content = (
    <div className="flex justify-between items-center mb-0.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="text-xs font-medium">{value}</div>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="cursor-help">{content}</div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

export default WeatherProperty;
