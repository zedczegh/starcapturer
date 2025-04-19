import React, { useState, useEffect, useRef } from 'react';
import { Star } from 'lucide-react';
import { getSiqsScore, formatSiqsForDisplay } from '@/utils/siqsHelpers';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [displayedScore, setDisplayedScore] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadingState, setLoadingState] = useState(loading);
  const previousScore = useRef<number | null>(null);
  const loadingTimeoutRef = useRef<number | null>(null);
  const stableScoreRef = useRef<number | null>(null);
  
  const numericScore = getSiqsScore(score);
  
  const showLoading = loading || (isCertified && numericScore <= 0 && !forceCertified);
  
  useEffect(() => {
    if (numericScore > 0) {
      stableScoreRef.current = numericScore;
    }
    
    if (showLoading) {
      setLoadingState(true);
      
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
      
      loadingTimeoutRef.current = window.setTimeout(() => {
        if (numericScore > 0) {
          setDisplayedScore(numericScore);
          setLoadingState(false);
        } else if (forceCertified) {
          setDisplayedScore(5.0);
          setLoadingState(false);
        } else {
          setDisplayedScore(null);
          setLoadingState(false);
        }
        loadingTimeoutRef.current = null;
      }, 600);
      
      return () => {
        if (loadingTimeoutRef.current) {
          window.clearTimeout(loadingTimeoutRef.current);
        }
      };
    }
    
    if (numericScore <= 0) {
      if (forceCertified) {
        setDisplayedScore(5.0);
      } else if (stableScoreRef.current && stableScoreRef.current > 0 && isCertified) {
        setDisplayedScore(stableScoreRef.current);
      } else {
        setDisplayedScore(null);
      }
      setLoadingState(false);
      return;
    }
    
    if (displayedScore === null) {
      setDisplayedScore(numericScore);
      previousScore.current = numericScore;
      setLoadingState(false);
      return;
    }
    
    if (Math.abs((displayedScore || 0) - numericScore) < 0.2) {
      setDisplayedScore(numericScore);
      previousScore.current = numericScore;
      setLoadingState(false);
      return;
    }
    
    if (Math.abs((displayedScore || 0) - numericScore) >= 0.2) {
      setIsTransitioning(true);
      
      previousScore.current = displayedScore;
      
      const timer = setTimeout(() => {
        setDisplayedScore(numericScore);
        setIsTransitioning(false);
        setLoadingState(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
    
    setLoadingState(false);
  }, [numericScore, showLoading, displayedScore, isCertified, forceCertified]);
  
  useEffect(() => {
    if (loading && !loadingState) {
      setLoadingState(true);
      if (!isCertified && !forceCertified) {
        setDisplayedScore(null);
      }
    }
  }, [loading, isCertified, forceCertified]);
  
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);
  
  if (numericScore <= 0 && !loadingState && !forceCertified && !isCertified) {
    return null;
  }
  
  const scoreToDisplay = displayedScore || (forceCertified ? 5.0 : null);
  const formattedScore = formatSiqsForDisplay(scoreToDisplay);
  
  const getColor = () => {
    if (!scoreToDisplay || scoreToDisplay <= 0) return 'bg-cosmic-700/50 text-muted-foreground border-cosmic-600/30';
    if (scoreToDisplay >= 8) return 'bg-green-500/20 text-green-400 border-green-500/40';
    if (scoreToDisplay >= 6.5) return 'bg-lime-500/20 text-lime-400 border-lime-500/40';
    if (scoreToDisplay >= 5) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    if (scoreToDisplay >= 3.5) return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    return 'bg-red-500/20 text-red-300 border-red-500/40';
  };

  if (loadingState) {
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
  
  if ((!scoreToDisplay || scoreToDisplay <= 0) && (forceCertified || isCertified)) {
    return (
      <motion.div 
        className={`flex items-center bg-cosmic-700/50 text-muted-foreground ${compact ? 'px-1.5 py-0.5' : 'px-2 py-0.5'} rounded-full border border-cosmic-600/30`}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        layout
      >
        <Star 
          className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-gray-400 mr-1`} 
          fill="#475569" 
        />
        <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
          5.0
        </span>
      </motion.div>
    );
  }
  
  if (!scoreToDisplay || scoreToDisplay <= 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div 
        className={`flex items-center ${getColor()} ${compact ? 'px-1.5 py-0.5' : 'px-2 py-0.5'} rounded-full border`}
        initial={{ opacity: 0.6 }}
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
    </AnimatePresence>
  );
};

export default React.memo(SiqsScoreBadge);
