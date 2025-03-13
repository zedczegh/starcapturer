
import React, { useCallback, useMemo } from "react";
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
  
  // Memoize these values to prevent recalculations
  const scoreColor = useMemo(() => getScoreColor(siqsScore), [siqsScore]);
  const scoreClass = useMemo(() => getScoreClass(siqsScore), [siqsScore]);
  const recommendation = useMemo(() => getRecommendationMessage(siqsScore / 10, language), [siqsScore, language]);
  
  // Pre-generate the locationData object for faster navigation
  const preparedLocationData = useMemo(() => {
    if (!latitude || !longitude || !locationName) return null;
    
    const generatedId = `${locationName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    return {
      id: generatedId,
      name: locationName,
      latitude: latitude,
      longitude: longitude,
      timestamp: new Date().toISOString()
    };
  }, [latitude, longitude, locationName]);
  
  const handleClick = useCallback(() => {
    if (locationId) {
      navigate(`/location/${locationId}`);
      return;
    }
    
    if (preparedLocationData) {
      navigate(`/location/${preparedLocationData.id}`, {
        state: preparedLocationData
      });
      return;
    }
    
    // Fallback to Beijing data with unique ID
    const fallbackId = `beijing-${Date.now()}`;
    navigate(`/location/${fallbackId}`, {
      state: {
        id: fallbackId,
        name: "Beijing",
        latitude: 39.9042,
        longitude: 116.4074
      }
    });
  }, [navigate, locationId, preparedLocationData]);
  
  return (
    <div 
      className="mb-6 p-4 glass-card hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]" 
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">
          {t("Estimated SIQS Score", "预估SIQS评分")}
        </h3>
        <div className="flex items-center">
          <span className={`text-2xl font-bold ${scoreColor}`}>
            {(siqsScore / 10).toFixed(1)}
          </span>
          <span className="text-lg text-muted-foreground">/10</span>
        </div>
      </div>
      <div className="w-full h-3 bg-cosmic-800/50 rounded-full overflow-hidden">
        <div 
          className={`h-full ${scoreClass}`} 
          style={{ width: `${siqsScore}%`, transition: 'width 0.5s ease-in-out' }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>{t("Poor", "差")}</span>
        <span>{t("Average", "一般")}</span>
        <span>{t("Excellent", "优秀")}</span>
      </div>
      
      <p className="text-sm mt-3 font-medium italic text-center">
        "{recommendation}"
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
};

// Helper functions to determine visual styling
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

export default React.memo(SIQSScore);
