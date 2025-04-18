
import React from 'react';
import { Star } from 'lucide-react';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { motion } from 'framer-motion';

interface SiqsScoreBadgeProps {
  score: number | string | { score: number; isViable: boolean } | any;
  loading?: boolean;
  compact?: boolean;
  isCertified?: boolean;
  forceCertified?: boolean; // Added this prop to support forcing certified status
  showPlaceholder?: boolean; // New prop to control whether to show placeholder scores
}

const SiqsScoreBadge: React.FC<SiqsScoreBadgeProps> = ({ 
  score, 
  loading = false,
  compact = false,
  isCertified = false,
  forceCertified = false,
  showPlaceholder = true
}) => {
  // Convert score to number using our helper function
  const numericScore = getSiqsScore(score);
  
  // Skip rendering if score is 0 (invalid) and not certified or if we don't want to show placeholder
  if ((numericScore <= 0 && !loading && !isCertified && !forceCertified) || 
      (numericScore <= 0 && !showPlaceholder && !loading)) {
    return null;
  }
  
  // For certified locations with no score or when forceCertified is true, provide a default good score
  // But only if showPlaceholder is true
  const displayScore = numericScore > 0 ? numericScore.toFixed(1) : (showPlaceholder ? "6.5" : "0.0");
  
  // Get appropriate color based on score value
  const getColor = () => {
    const scoreToUse = numericScore > 0 ? numericScore : (showPlaceholder && (isCertified || forceCertified) ? 6.5 : 0);
    
    if (scoreToUse >= 8) return 'bg-green-500/20 text-green-400 border-green-500/40';
    if (scoreToUse >= 6.5) return 'bg-lime-500/20 text-lime-400 border-lime-500/40';
    if (scoreToUse >= 5) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    if (scoreToUse >= 3.5) return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    return 'bg-red-500/20 text-red-300 border-red-500/40';
  };

  if (loading) {
    return (
      <motion.div 
        className="flex items-center bg-cosmic-700/50 text-muted-foreground px-2 py-0.5 rounded-full border border-cosmic-600/30"
        layout
        animate={{ opacity: [0.6, 0.8, 0.6] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        <div className="h-3.5 w-12 bg-cosmic-600/50 rounded-full"></div>
      </motion.div>
    );
  }
  
  // If no real score and showPlaceholder is false, return null
  if (numericScore <= 0 && !showPlaceholder) {
    return null;
  }

  return (
    <motion.div 
      className={`flex items-center ${getColor()} ${compact ? 'px-1.5 py-0.5' : 'px-2 py-0.5'} rounded-full border`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <Star 
        className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-yellow-400 mr-1`} 
        fill="#facc15" 
      />
      <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
        {displayScore}
      </span>
    </motion.div>
  );
};

export default SiqsScoreBadge;
