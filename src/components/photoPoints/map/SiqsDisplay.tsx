
import React from 'react';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';

interface SiqsDisplayProps {
  realTimeSiqs: number | null;
  loading: boolean;
}

/**
 * Component to display SIQS score
 */
const SiqsDisplay: React.FC<SiqsDisplayProps> = ({ realTimeSiqs, loading }) => {
  if (realTimeSiqs === null) return null;
  
  return (
    <div className="bg-cosmic-800/90 rounded-md p-1.5 shadow-md flex items-center justify-center border border-cosmic-700/30">
      <SiqsScoreBadge score={realTimeSiqs} loading={loading} />
    </div>
  );
};

export default SiqsDisplay;
