
import React, { memo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getRecommendationMessage } from "./utils/scoreUtils";

interface RecommendationMessageProps {
  score: number;
  isViable: boolean;
}

const RecommendationMessage: React.FC<RecommendationMessageProps> = ({ score, isViable }) => {
  const { language, t } = useLanguage();
  const recommendation = getRecommendationMessage(score, language);
  
  return (
    <div className="flex-1 flex flex-col gap-2 text-center md:text-left">
      <h3 className="text-lg font-medium">
        {isViable 
          ? t("Conditions Summary", "条件总结") 
          : t("Not Recommended", "不推荐")}
      </h3>
      <p className="text-sm text-muted-foreground">
        {recommendation}
      </p>
    </div>
  );
};

export default memo(RecommendationMessage);
