
import React, { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { getScoreColorClass } from "./utils/scoreUtils";

interface ScoreBadgeProps {
  score: number;
  label: string;
}

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, label }) => {
  const colorClass = getScoreColorClass(score);
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`text-3xl md:text-4xl font-bold ${colorClass}`}>
        {score.toFixed(1)}
      </div>
      <Badge variant="outline" className={`mt-1 ${colorClass} border-current`}>
        {label}
      </Badge>
    </div>
  );
};

export default memo(ScoreBadge);
