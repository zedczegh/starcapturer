import React, { useState, useEffect, useRef } from 'react';
import { Star } from 'lucide-react';
import { getSiqsScore, normalizeToSiqsScale } from '@/utils/siqsHelpers';
import { motion, AnimatePresence } from 'framer-motion';
import { formatSiqsForDisplay } from '@/utils/siqsHelpers';

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
  const [loadingState, setLoadingState] = useState(loading);
  const previousScore = useRef<number | null>(null);
  const loadingTimeoutRef = useRef<number | null>(null);
  const stableScoreRef = useRef<number | null>(null);
  
  // Convert score to number using our helper function which now properly normalizes
  const numericScore = score === null ? 0 : getSiqsScore(score);
  
  // For certified locations with no valid score, show loading state only initially
  const showLoading = loading && !stableScoreRef.current;
  
  // Update displayed score with smooth transition when real score changes
  useEffect(() => {
    // Keep track of the most recent stable score
    if (numericScore > 0) {
      stableScoreRef.current = numericScore;
    }
    
    if (showLoading && !stableScoreRef.current) {
      // For loading state, don't change displayed score but show loading indicator
      setLoadingState(true);
      
      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
      
      // Set a minimum loading time to prevent flash
      loadingTimeoutRef.current = window.setTimeout(() => {
        if (numericScore > 0) {
          setDisplayedScore(numericScore);
          setLoadingState(false);
        } else if (stableScoreRef.current) {
          // If we have a stable score, use it
          setDisplayedScore(stableScoreRef.current);
          setLoadingState(false);
        } else {
          // If we still don't have a valid score after loading, clear the displayed score
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
    
    // If score is 0 or negative and we have a previous stable score
    if (numericScore <= 0 && stableScoreRef.current && stableScoreRef.current > 0) {
      // Keep showing the last valid score for certified locations
      if (isCertified || forceCertified) {
        setDisplayedScore(stableScoreRef.current);
        setLoadingState(false);
      }
      return;
    }
    
    // If we have a valid score
    if (numericScore > 0) {
      // First time setting a score
      if (displayedScore === null) {
        setDisplayedScore(numericScore);
        previousScore.current = numericScore;
        setLoadingState(false);
        return;
      }
      
      // Avoid unnecessary transitions for small changes
      if (Math.abs((displayedScore || 0) - numericScore) < 0.2) {
        setDisplayedScore(numericScore);
        previousScore.current = numericScore;
        setLoadingState(false);
        return;
      }
      
      // Only animate significant changes and don't reset to loading
      if (Math.abs((displayedScore || 0) - numericScore) >= 0.2) {
        setIsTransitioning(true);
        
        // Store previous score for reference
        previousScore.current = displayedScore;
        
        // Quick delay for animation
        const timer = setTimeout(() => {
          setDisplayedScore(numericScore);
          setIsTransitioning(false);
        }, 300);
        
        return () => clearTimeout(timer);
      }
    }
  }, [numericScore, showLoading, displayedScore, isCertified, forceCertified]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);
  
  // Skip rendering if score is 0 (invalid) or negative and not showing loading state or not certified
  if (numericScore <= 0 && !loadingState && !forceCertified && !isCertified && !stableScoreRef.current) {
    return null;
  }
  
  // Use stable score if it exists and we're in a valid state
  const scoreToDisplay = displayedScore || (stableScoreRef.current && (isCertified || forceCertified) ? stableScoreRef.current : null);
  
  // Format score for display
  const formattedScore = formatSiqsForDisplay(scoreToDisplay);
  
  // Get appropriate color based on score value
  const getColor = () => {
    if (!scoreToDisplay || scoreToDisplay <= 0) return 'bg-cosmic-700/50 text-muted-foreground border-cosmic-600/30';
    if (scoreToDisplay >= 8) return 'bg-green-500/20 text-green-400 border-green-500/40';
    if (scoreToDisplay >= 6.5) return 'bg-lime-500/20 text-lime-400 border-lime-500/40';
    if (scoreToDisplay >= 5) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    if (scoreToDisplay >= 3.5) return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    return 'bg-red-500/20 text-red-300 border-red-500/40';
  };

  // Enhanced loading animation with smoother transition
  if (loadingState && !stableScoreRef.current) {
    return (
      <div className="flex items-center bg-cosmic-700/50 text-muted-foreground px-2 py-0.5 rounded-full border border-cosmic-600/30">
        <Star 
          className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-gray-400 mr-1`} 
          fill="#475569" 
        />
        <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
          ...
        </span>
      </div>
    );
  }
  
  // Don't render anything if there's no valid score to show
  if ((!scoreToDisplay || scoreToDisplay <= 0) && !stableScoreRef.current) {
    return null;
  }

  // Use a simpler animation approach for better Safari compatibility
  return (
    <div 
      className={`flex items-center ${getColor()} ${compact ? 'px-1.5 py-0.5' : 'px-2 py-0.5'} rounded-full border transition-opacity duration-200 ${isTransitioning ? 'opacity-60' : 'opacity-100'}`}
    >
      <Star 
        className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-yellow-400 mr-1`} 
        fill="#facc15" 
      />
      <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
        {formattedScore}
      </span>
    </div>
  );
};

export default React.memo(SiqsScoreBadge);
