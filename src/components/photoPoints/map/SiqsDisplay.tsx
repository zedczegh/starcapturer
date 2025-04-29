
import React from 'react';
import { getSiqsClass } from './MarkerUtils';

interface SiqsDisplayProps {
  siqs: number;
  showLabel?: boolean;
  className?: string;
}

const SiqsDisplay: React.FC<SiqsDisplayProps> = ({ siqs, showLabel = false, className = '' }) => {
  const siqsClass = getSiqsClass(siqs);
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`h-3 w-3 rounded-full bg-${siqsClass === 'excellent' ? 'green' : siqsClass === 'good' ? 'blue' : siqsClass === 'fair' ? 'yellow' : 'red'}-500`}></div>
      <span className="text-sm">
        {showLabel ? 'SIQS: ' : ''}{siqs > 0 ? siqs.toFixed(1) : 'N/A'}
      </span>
    </div>
  );
};

export default SiqsDisplay;
