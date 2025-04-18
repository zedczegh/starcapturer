
import React from 'react';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { motion } from 'framer-motion';

interface SiqsDisplayProps {
  realTimeSiqs: number | null;
  loading: boolean;
}

/**
 * Component to display SIQS score with smooth transitions to prevent flickering
 */
const SiqsDisplay: React.FC<SiqsDisplayProps> = ({ realTimeSiqs, loading }) => {
  // Don't render if no score available
  if (realTimeSiqs === null || realTimeSiqs === 0) return null;
  
  return (
    <motion.div 
      className="bg-cosmic-800/90 rounded-md p-1.5 shadow-md flex items-center justify-center border border-cosmic-700/30"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <SiqsScoreBadge score={realTimeSiqs} loading={loading} />
    </motion.div>
  );
};

export default SiqsDisplay;
