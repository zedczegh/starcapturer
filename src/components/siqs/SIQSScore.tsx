
import React, { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { getScoreColorClass } from "./utils/scoreUtils";
import { Separator } from "@/components/ui/separator";

interface ScoreBadgeProps {
  score: number;
  label?: string;
}

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, label }) => {
  const colorClass = getScoreColorClass(score);
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`text-3xl md:text-4xl font-bold ${colorClass}`}>
        {score.toFixed(1)}
      </div>
          {label && (
            <Separator className="mb-3" />
          )}
          {label && (
            <Badge 
              variant="outline" 
              className={`font-semibold ${colorClass}`}
            >
              {label}
            </Badge>
          )}
    </div>
  );
};

export default memo(ScoreBadge);
