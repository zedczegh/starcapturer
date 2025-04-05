
import React from 'react';
import { Loader2, Star } from 'lucide-react';
import { formatSIQSScoreForDisplay } from '@/hooks/siqs/siqsCalculationUtils';

interface SiqsScoreBadgeProps {
  score: number;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SiqsScoreBadge: React.FC<SiqsScoreBadgeProps> = ({ 
  score, 
  loading = false, 
  size = 'md',
  className = ''
}) => {
  // Size-based styling
  const sizeClasses = {
    sm: {
      badge: 'px-2 py-0.5',
      icon: 'h-3 w-3 mr-1',
      text: 'text-xs'
    },
    md: {
      badge: 'px-2.5 py-1',
      icon: 'h-3.5 w-3.5 mr-1.5',
      text: 'text-sm'
    },
    lg: {
      badge: 'px-3 py-1.5',
      icon: 'h-4 w-4 mr-1.5',
      text: 'text-base'
    }
  };
  
  const currentSize = sizeClasses[size];
  
  return (
    <div className={`flex items-center bg-yellow-500/20 text-yellow-300 ${currentSize.badge} rounded-full border border-yellow-500/40 ${className}`}>
      {loading ? (
        <Loader2 className={`${currentSize.icon} animate-spin`} />
      ) : (
        <Star className={`${currentSize.icon} text-yellow-400`} fill="#facc15" />
      )}
      <span className={`${currentSize.text} font-medium`}>
        {loading ? '...' : formatSIQSScoreForDisplay(score)}
      </span>
    </div>
  );
};

export default SiqsScoreBadge;
