import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getRecommendationMessage } from "../SIQSSummary";
import { Link } from "react-router-dom";

interface SIQSScoreProps {
  siqsScore: number;
  locationId?: string;
}

const SIQSScore: React.FC<SIQSScoreProps> = ({ siqsScore, locationId }) => {
  const { language, t } = useLanguage();
  
  const scoreComponent = (
    <div className="mb-6 p-4 glass-card hover:shadow-lg transition-all cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">
          {t("Estimated SIQS Score", "预估SIQS评分")}
        </h3>
        <div className="flex items-center">
          <span className={`text-2xl font-bold ${
            siqsScore >= 80 ? 'text-green-400' : 
            siqsScore >= 60 ? 'text-green-300' : 
            siqsScore >= 40 ? 'text-yellow-300' : 
            siqsScore >= 20 ? 'text-orange-300' : 'text-red-400'
          }`}>{(siqsScore / 10).toFixed(1)}</span>
          <span className="text-lg text-muted-foreground">/10</span>
        </div>
      </div>
      <div className="w-full h-3 bg-cosmic-800/50 rounded-full overflow-hidden">
        <div 
          className={`h-full ${
            siqsScore >= 80 ? 'score-excellent' : 
            siqsScore >= 60 ? 'score-good' : 
            siqsScore >= 40 ? 'score-average' : 
            siqsScore >= 20 ? 'score-poor' : 'score-bad'}`} 
          style={{ width: `${siqsScore}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>{t("Poor", "差")}</span>
        <span>{t("Average", "一般")}</span>
        <span>{t("Excellent", "优秀")}</span>
      </div>
      
      <p className="text-sm mt-3 font-medium italic text-center">
        "{getRecommendationMessage(siqsScore / 10, language)}"
      </p>
      
      <p className="text-xs text-muted-foreground mt-3">
        {language === 'en' 
          ? "Click for detailed analysis with forecast data" 
          : "点击获取基于预测数据的详细分析"}
      </p>
    </div>
  );

  return locationId ? (
    <Link to={`/location/${locationId}`}>
      {scoreComponent}
    </Link>
  ) : (
    scoreComponent
  );
};

export default SIQSScore;
