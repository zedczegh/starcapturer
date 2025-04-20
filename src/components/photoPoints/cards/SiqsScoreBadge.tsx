
import React, { useState, useEffect, useRef } from 'react';
import { Star } from 'lucide-react';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { motion } from 'framer-motion';

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
  const scoreRef = useRef<number | null>(null);
  const [displayedScore, setDisplayedScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(loading);
  const previousScoreRef = useRef<number | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  
  // Ensure smooth transition from loading to score display
  useEffect(() => {
    if (loading !== isLoading) {
      // If transitioning from loading to not loading, delay a bit
      if (isLoading && !loading) {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
        loadingTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setIsLoading(false);
          }
        }, 300);
      } else {
        setIsLoading(loading);
      }
    }
    
    return () => {
      mountedRef.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading]);
  
  useEffect(() => {
    const numericScore = getSiqsScore(score);
    
    // Debug score changes
    if (previousScoreRef.current !== numericScore && numericScore > 0) {
      console.log(`SiqsScoreBadge: Score changed from ${previousScoreRef.current} to ${numericScore}`);
    }
    
    // Only update if score is valid and either:
    // 1. First time setting a score, or
    // 2. Significant change (to prevent flickering)
    if (numericScore > 0 && 
        (previousScoreRef.current === null || 
         Math.abs((previousScoreRef.current || 0) - numericScore) >= 0.1)) {
      
      scoreRef.current = numericScore;
      previousScoreRef.current = numericScore;
      setDisplayedScore(numericScore);
    }
  }, [score]);

  if (isLoading) {
    return (
      <motion.div 
        className="flex items-center bg-cosmic-700/50 text-muted-foreground px-2 py-0.5 rounded-full border border-cosmic-600/30"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: [0.6, 0.8, 0.6] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      >
        <Star 
          className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-gray-400 mr-1`} 
          fill="#475569" 
        />
        <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>...</span>
      </motion.div>
    );
  }

  // If we have no valid score but component is certified, show loading
  if ((!displayedScore || displayedScore <= 0) && isCertified) {
    return (
      <motion.div 
        className="flex items-center bg-cosmic-700/50 text-muted-foreground px-2 py-0.5 rounded-full border border-cosmic-600/30"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: [0.6, 0.8, 0.6] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      >
        <Star 
          className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-gray-400 mr-1`} 
          fill="#475569" 
        />
        <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>...</span>
      </motion.div>
    );
  }

  // Don't render if no score and not certified
  if (!displayedScore || displayedScore <= 0) return null;

  const getColor = () => {
    if (displayedScore >= 8) return 'bg-green-500/20 text-green-400 border-green-500/40';
    if (displayedScore >= 6.5) return 'bg-lime-500/20 text-lime-400 border-lime-500/40';
    if (displayedScore >= 5) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    if (displayedScore >= 3.5) return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    return 'bg-red-500/20 text-red-300 border-red-500/40';
  };

  return (
    <motion.div 
      className={`flex items-center ${getColor()} ${compact ? 'px-1.5 py-0.5' : 'px-2 py-0.5'} rounded-full border`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Star 
        className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-yellow-400 mr-1`} 
        fill="#facc15" 
      />
      <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
        {displayedScore.toFixed(1)}
      </span>
    </motion.div>
  );
};

export default React.memo(SiqsScoreBadge);
