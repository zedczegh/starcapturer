
import React, { memo, useMemo } from "react";
import EmptyFactors from "./factors/EmptyFactors";
import FactorItem from "./factors/FactorItem";
import { normalizeFactorScores } from "@/lib/siqs/utils";

interface SIQSFactorsListProps {
  factors?: Array<{
    name: string;
    score: number;
    description: string;
  }>;
}

const SIQSFactorsList: React.FC<SIQSFactorsListProps> = ({ factors = [] }) => {
  // Ensure all factors are normalized to 0-10 scale for consistent display
  const normalizedFactors = useMemo(() => {
    return normalizeFactorScores(factors);
  }, [factors]);
  
  if (!normalizedFactors || normalizedFactors.length === 0) {
    return <EmptyFactors />;
  }
  
  // Special handling for cloud cover - ensure 0% cloud cover always shows score 10.0
  const finalFactors = normalizedFactors.map(factor => {
    if (factor.name === "Cloud Cover" || factor.name === "云层覆盖") {
      // If description mentions 0%, ensure score is 10
      if (factor.description.includes("0%")) {
        return { ...factor, score: 10 };
      }
    }
    return factor;
  });
  
  return (
    <div className="space-y-4 mt-2">
      {finalFactors.map((factor, index) => (
        <FactorItem 
          key={`factor-${factor.name}-${index}`}
          factor={factor}
          index={index}
        />
      ))}
    </div>
  );
};

export default memo(SIQSFactorsList);
