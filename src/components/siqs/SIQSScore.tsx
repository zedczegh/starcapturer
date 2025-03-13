
import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { getRecommendationMessage } from "../SIQSSummary";

interface SIQSScoreProps {
  siqsScore: number;
  locationId?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

const SIQSScore: React.FC<SIQSScoreProps> = ({ 
  siqsScore, 
  locationId,
  latitude,
  longitude,
  locationName
}) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  
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
  
  const handleClick = useCallback(() => {
    if (locationId) {
      navigate(`/location/${locationId}`);
    } else if (latitude && longitude && locationName) {
      // Create a timestamp-based ID for this location
      const generatedId = `${locationName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      
      // Navigate immediately to reduce perceived latency
      navigate(`/location/${generatedId}`, {
        state: {
          id: generatedId,
          name: locationName,
          latitude: latitude,
          longitude: longitude,
          // We'll let the location page fetch the rest of the data
        }
      });
    } else {
      // Fallback to SIQS Now using Beijing data
      navigate(`/location/beijing-${Date.now()}`, {
        state: {
          id: `beijing-${Date.now()}`,
          name: "Beijing",
          latitude: 39.9042,
          longitude: 116.4074,
        }
      });
    }
  }, [navigate, locationId, latitude, longitude, locationName]);
  
  const scoreComponent = (
    <div 
      className="mb-6 p-4 glass-card hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]" 
      onClick={handleClick}
    >
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

  return scoreComponent;
};

export default React.memo(SIQSScore);
