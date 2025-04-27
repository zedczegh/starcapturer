import React, { useState, useEffect, useRef } from 'react';
import { Star } from 'lucide-react';
import { getSiqsScore, normalizeToSiqsScale } from '@/utils/siqsHelpers';
import ScoreBadgeContainer from '@/components/siqs/score/ScoreBadgeContainer';
import { formatSiqsForDisplay } from '@/utils/siqsHelpers';
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
  forceCertified = false
}) => {
  const [displayedScore, setDisplayedScore] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadingState, setLoadingState] = useState(loading);
  const stableScoreRef = useRef<number | null>(null);
  const loadingTimeoutRef = useRef<number | null>(null);
  const loadingRetryCountRef = useRef(0);
  
  const numericScore = score === null ? 0 : getSiqsScore(score);
  const showLoading = loading && !stableScoreRef.current && loadingRetryCountRef.current < 3;

  const clearTimeouts = () => {
    if (loadingTimeoutRef.current !== null) {
      window.clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (numericScore > 0) {
      stableScoreRef.current = numericScore;
    }
    
    if (showLoading) {
      setLoadingState(true);
      clearTimeouts();
      
      loadingTimeoutRef.current = window.setTimeout(() => {
        loadingRetryCountRef.current += 1;
        
        if (numericScore > 0) {
          setDisplayedScore(numericScore);
          setLoadingState(false);
        } else if (stableScoreRef.current) {
          setDisplayedScore(stableScoreRef.current);
          setLoadingState(false);
        } else {
          if (loadingRetryCountRef.current >= 3) {
            setDisplayedScore(null);
            setLoadingState(false);
          } else {
            setLoadingState(true);
          }
        }
      }, 800);
      
      return clearTimeouts;
    }

    if (numericScore > 0 || (isCertified || forceCertified)) {
      if (displayedScore === null || Math.abs((displayedScore || 0) - numericScore) >= 0.2) {
        setIsTransitioning(true);
        const transitionTimer = setTimeout(() => {
          setDisplayedScore(numericScore);
          setIsTransitioning(false);
        }, 300);
        
        return () => clearTimeout(transitionTimer);
      } else if (displayedScore !== numericScore) {
        setDisplayedScore(numericScore);
      }
    }
  }, [numericScore, showLoading, displayedScore, isCertified, forceCertified]);

  useEffect(() => {
    return clearTimeouts;
  }, []);

  if ((numericScore <= 0 && !loadingState && !forceCertified && !isCertified && !stableScoreRef.current) || 
      (!displayedScore && !loadingState)) {
    return null;
  }

  if (loadingState && !stableScoreRef.current) {
    return (
      <motion.div 
        className="flex items-center bg-cosmic-700/50 text-muted-foreground px-2 py-0.5 rounded-full border border-cosmic-600/30"
        layout
        animate={{ opacity: [0.6, 0.8, 0.6] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      >
        <Star className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-gray-400 mr-1`} fill="#475569" />
        <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>...</span>
      </motion.div>
    );
  }

  const scoreToDisplay = displayedScore || (stableScoreRef.current && (isCertified || forceCertified) ? stableScoreRef.current : null);
  if (!scoreToDisplay) return null;

  const formattedScore = formatSiqsForDisplay(scoreToDisplay);

  return (
    <ScoreBadgeContainer score={scoreToDisplay} isTransitioning={isTransitioning}>
      <Star 
        className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-yellow-400 mr-1`} 
        fill="#facc15" 
      />
      <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
        {formattedScore}
      </span>
    </ScoreBadgeContainer>
  );
};

export default React.memo(SiqsScoreBadge);
