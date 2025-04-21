
import React from "react";
import { Star } from "lucide-react";
import { formatSiqsForDisplay, getSiqsScore } from "@/utils/siqsHelpers";

/**
 * Minimal, self-contained SIQS badge used in Collection cards.
 * Will not break if SIQS implementation changes elsewhere.
 */
interface CollectionSiqsBadgeProps {
  siqs: number | string | { score: number } | undefined | null;
  loading?: boolean;
}

const CollectionSiqsBadge: React.FC<CollectionSiqsBadgeProps> = ({ siqs, loading = false }) => {
  const value = getSiqsScore(siqs);

  if (loading) {
    return (
      <div className="flex items-center text-xs bg-cosmic-700/60 border border-cosmic-600/40 rounded-full px-2 py-0.5 text-muted-foreground">
        <Star className="w-3.5 h-3.5 mr-1 animate-pulse" />
        <span>...</span>
      </div>
    );
  }
  if (!value || value <= 0) {
    return (
      <div className="flex items-center text-xs bg-cosmic-700/60 border border-cosmic-600/40 rounded-full px-2 py-0.5 text-muted-foreground">
        <Star className="w-3.5 h-3.5 mr-1" />
        <span>N/A</span>
      </div>
    );
  }

  let color = "bg-green-500/20 text-green-400 border-green-500/40";
  if (value < 8 && value >= 6.5) color = "bg-lime-500/20 text-lime-400 border-lime-500/40";
  else if (value < 6.5 && value >= 5) color = "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
  else if (value < 5 && value >= 3.5) color = "bg-orange-500/20 text-orange-300 border-orange-500/40";
  else if (value < 3.5) color = "bg-red-500/20 text-red-300 border-red-500/40";

  return (
    <div className={`flex items-center text-xs rounded-full px-2 py-0.5 border ${color}`}>
      <Star className="w-3.5 h-3.5 mr-1" fill="#facc15" />
      <span>{formatSiqsForDisplay(value)}</span>
    </div>
  );
};

export default CollectionSiqsBadge;
