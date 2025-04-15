
import React from 'react';
import { MapTooltip as TooltipComponent } from '@/components/ui/tooltip';

export interface MapTooltipProps {
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const MapTooltip: React.FC<MapTooltipProps> = ({
  children,
  className,
  side = 'top',
}) => {
  return (
    <TooltipComponent
      className={className}
      side={side}
      avoidCollisions={true}
    >
      {children}
    </TooltipComponent>
  );
};

export default MapTooltip;
