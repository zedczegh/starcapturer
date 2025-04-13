
import React from 'react';
import { formatDistanceDisplay } from '@/utils/formatters';

interface DistanceDisplayProps {
  distance: number | null;
  compact?: boolean;
}

const DistanceDisplay: React.FC<DistanceDisplayProps> = ({ distance, compact = false }) => {
  if (distance === null) return null;
  
  return (
    <p className={`text-muted-foreground mt-0.5 ${compact ? 'text-2xs' : 'text-xs'}`}>
      {formatDistanceDisplay(distance)}
    </p>
  );
};

export default DistanceDisplay;
