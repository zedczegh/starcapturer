
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
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-green-300';
    if (score >= 40) return 'text-yellow-300';
    if (score >= 20) return 'text-orange-300';
    return 'text-red-400';
  };
  
  const getScoreClass = (score: number) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-average';
    if (score >= 20) return 'score-poor';
    return 'score-bad';
  };
  
  const scoreComponent = (
    <div className="mb-6 p-4 glass-card hover:shadow-lg transition-all cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">
          {t("Estimated SIQS Score", "预估SIQS评分")}
        </h3>
        <div className="flex items-center">
          <span className={`text-2xl font-bold ${getScoreColor(siqsScore)}`}>
            {(siqsScore / 10).toFixed(1)}
          </span>
          <span className="text-lg text-muted-foreground">/10</span>
        </div>
      </div>
      <div className="w-full h-3 bg-cosmic-800/50 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getScoreClass(siqsScore)}`} 
          style={{ width: `${siqsScore}%`, transition: 'width 0.5s ease-in-out' }}
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
      
      {/* Visual indicator that this is clickable */}
      <div className="w-full flex justify-center mt-1">
        <span className="inline-block w-2 h-2 rounded-full bg-primary/80 animate-pulse"></span>
      </div>
    </div>
  );

  return locationId ? (
    <Link to={`/location/${locationId}`} className="block">
      {scoreComponent}
    </Link>
  ) : (
    scoreComponent
  );
};

export default SIQSScore;
