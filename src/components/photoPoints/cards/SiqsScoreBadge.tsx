
import React from 'react';
import { Loader2, Star } from 'lucide-react';
import { formatSIQSScoreForDisplay } from '@/hooks/siqs/siqsCalculationUtils';

interface SiqsScoreBadgeProps {
  score: number;
  loading?: boolean;
}

const SiqsScoreBadge: React.FC<SiqsScoreBadgeProps> = ({ score, loading = false }) => {
  return (
    <div className="flex items-center bg-yellow-500/20 text-yellow-300 px-2.5 py-1 rounded-full border border-yellow-500/40">
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
      ) : (
        <Star className="h-3.5 w-3.5 mr-1.5 text-yellow-400" fill="#facc15" />
      )}
      <span className="text-sm font-medium">
        {loading ? '...' : formatSIQSScoreForDisplay(score)}
      </span>
    </div>
  );
};

export default SiqsScoreBadge;
