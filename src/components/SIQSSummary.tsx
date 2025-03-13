
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import SIQSSummaryScore, { getRecommendationMessage } from "./siqs/SIQSSummaryScore";
import SIQSFactorsList from "./siqs/SIQSFactorsList";

// Export this for other components to use
export { getRecommendationMessage } from "./siqs/SIQSSummaryScore";

interface SIQSSummaryProps {
  siqsData: {
    score: number;
    isViable: boolean;
    factors?: Array<{
      name: string;
      score: number;
      description: string;
    }>;
  };
}

const SIQSSummary: React.FC<SIQSSummaryProps> = ({ siqsData }) => {
  const { t } = useLanguage();
  
  if (!siqsData) {
    return null;
  }
  
  return (
    <Card className="shadow-md border-cosmic-700/30 hover:border-cosmic-600/60 transition-all duration-300">
      <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
        <h2 className="text-xl font-semibold text-gradient-blue">
          {t("SIQS Analysis", "SIQS分析")}
        </h2>
      </CardHeader>
      <CardContent className="p-4">
        <SIQSSummaryScore 
          score={siqsData.score}
          isViable={siqsData.isViable}
          factors={siqsData.factors}
        />
        
        <h3 className="font-medium mb-2 mt-4 text-gradient-blue">
          {t("Contributing Factors", "贡献因素")}
        </h3>
        
        <SIQSFactorsList factors={siqsData.factors} />
      </CardContent>
    </Card>
  );
};

export default React.memo(SIQSSummary);
