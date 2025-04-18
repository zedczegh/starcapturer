
import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { motion } from 'framer-motion';
import { formatSiqsForDisplay } from '@/utils/unifiedSiqsDisplay';

interface SiqsScoreBadgeProps {
  score: number | string | { score: number; isViable: boolean } | any;
  loading?: boolean;
  compact?: boolean;
  isCertified?: boolean;
  forceCertified?: boolean;
  confidenceScore?: number;
}

const SiqsScoreBadge: React.FC<SiqsScoreBadgeProps> = ({ 
  score, 
  loading = false,
  compact = false,
  isCertified = false,
  forceCertified = false,
  confidenceScore = 10
}) => {
  // State for managing smooth transitions
  const [displayedScore, setDisplayedScore] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Convert score to number using our helper function
  const numericScore = getSiqsScore(score);
  
  // For certified locations with no valid score, always show loading state
  const showLoading = loading || (isCertified && numericScore <= 0) || forceCertified;
  
  // Update displayed score with smooth transition when real score changes
  useEffect(() => {
    if (showLoading) {
      setDisplayedScore(null);
      return;
    }
    
    if (numericScore <= 0) {
      setDisplayedScore(null);
      return;
    }
    
    // Avoid unnecessary transitions for small changes
    if (displayedScore !== null && Math.abs(displayedScore - numericScore) < 0.2) {
      setDisplayedScore(numericScore);
      return;
    }
    
    // Smooth transition for larger changes
    if (displayedScore !== null && Math.abs(displayedScore - numericScore) >= 0.2) {
      setIsTransitioning(true);
      setTimeout(() => {
        setDisplayedScore(numericScore);
        setIsTransitioning(false);
      }, 300);
    } else {
      setDisplayedScore(numericScore);
    }
  }, [numericScore, showLoading, displayedScore]);
  
  // Skip rendering if score is 0 (invalid) or negative and not showing loading state
  // No default scores for non-certified locations either
  if (numericScore <= 0 && !showLoading && !forceCertified && !isCertified) {
    return null;
  }
  
  // Display actual score only - no default scores
  const formattedScore = formatSiqsForDisplay(displayedScore);
  
  // Get appropriate color based on score value
  const getColor = () => {
    if (!displayedScore || displayedScore <= 0) return 'bg-cosmic-700/50 text-muted-foreground border-cosmic-600/30';
    if (displayedScore >= 8) return 'bg-green-500/20 text-green-400 border-green-500/40';
    if (displayedScore >= 6.5) return 'bg-lime-500/20 text-lime-400 border-lime-500/40';
    if (displayedScore >= 5) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    if (displayedScore >= 3.5) return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    return 'bg-red-500/20 text-red-300 border-red-500/40';
  };

  // Enhanced loading animation with smoother transition
  if (showLoading) {
    return (
      <motion.div 
        className="flex items-center bg-cosmic-700/50 text-muted-foreground px-2 py-0.5 rounded-full border border-cosmic-600/30"
        layout
        animate={{ opacity: [0.6, 0.8, 0.6] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      >
        <Star 
          className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-gray-400 mr-1`} 
          fill="#475569" 
        />
        <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
          ...
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`flex items-center ${getColor()} ${compact ? 'px-1.5 py-0.5' : 'px-2 py-0.5'} rounded-full border`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isTransitioning ? 0.5 : 1 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <Star 
        className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-yellow-400 mr-1`} 
        fill="#facc15" 
      />
      <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
        {formattedScore}
      </span>
    </motion.div>
  );
};

export default React.memo(SiqsScoreBadge);
