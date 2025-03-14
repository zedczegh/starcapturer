
import React, { useCallback, useMemo, memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { getRecommendationMessage, getScoreColorClass } from "./utils/scoreUtils";
import { prefetchSIQSDetails } from "@/lib/queryPrefetcher";
import { v4 as uuidv4 } from "uuid";

interface SIQSScoreProps {
  siqsScore: number;
  locationId?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

// Score class cache
const scoreClassCache: Record<number, string> = {};

const getScoreClass = (score: number): string => {
  // Round to nearest integer for caching
  const roundedScore = Math.round(score);
  
  if (scoreClassCache[roundedScore] !== undefined) {
    return scoreClassCache[roundedScore];
  }
  
  let result = 'score-bad';
  if (score >= 80) result = 'score-excellent';
  else if (score >= 60) result = 'score-good';
  else if (score >= 40) result = 'score-average';
  else if (score >= 20) result = 'score-poor';
  
  scoreClassCache[roundedScore] = result;
  return result;
};

const SIQSScore: React.FC<SIQSScoreProps> = ({ 
  siqsScore, 
  locationId,
  latitude,
  longitude,
  locationName
}) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isPrefetching, setIsPrefetching] = useState(false);
  
  // Memoize calculations to prevent unnecessary re-renders
  const { scoreColor, scoreClass, recommendation, scoreOn10Scale } = useMemo(() => ({
    scoreColor: getScoreColorClass(siqsScore / 10),
    scoreClass: getScoreClass(siqsScore),
    recommendation: getRecommendationMessage(siqsScore / 10, language),
    scoreOn10Scale: siqsScore / 10
  }), [siqsScore, language]);
  
  // Generate a uuid for location ID instead of using name to avoid inconsistencies
  const preparedLocationData = useMemo(() => {
    if (!latitude || !longitude) return null;
    
    // Use UUID for more reliable IDs that don't depend on location names
    const generatedId = uuidv4();
    return {
      id: generatedId,
      name: locationName || t("Current Location", "当前位置"),
      latitude: latitude,
      longitude: longitude,
      timestamp: new Date().toISOString()
    };
  }, [latitude, longitude, locationName, t]);
  
  // Prefetch data when user hovers over the card
  const handleMouseEnter = useCallback(() => {
    if ((latitude && longitude) && !isPrefetching) {
      setIsPrefetching(true);
      prefetchSIQSDetails(queryClient, latitude, longitude);
    }
  }, [latitude, longitude, queryClient, isPrefetching]);
  
  const handleClick = useCallback(() => {
    // Use existing ID if provided
    if (locationId) {
      navigate(`/location/${locationId}`);
      return;
    }
    
    // Use prepared data if available
    if (preparedLocationData) {
      // Prefetch one last time before navigation
      if (latitude && longitude) {
        prefetchSIQSDetails(queryClient, latitude, longitude);
      }
      
      // Always use the state approach for consistent navigation
      navigate(`/location/${preparedLocationData.id}`, {
        state: preparedLocationData
      });
      return;
    }
    
    // Fallback with UUID for reliability
    const fallbackId = uuidv4();
    navigate(`/location/${fallbackId}`, {
      state: {
        id: fallbackId,
        name: "Beijing",
        latitude: 39.9042,
        longitude: 116.4074,
        timestamp: new Date().toISOString()
      }
    });
  }, [navigate, locationId, preparedLocationData, latitude, longitude, queryClient]);
  
  return (
    <div 
      className="mb-6 p-4 glass-card hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]" 
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      data-testid="siqs-score-card"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">
          {t("Estimated SIQS Score", "预估SIQS评分")}
        </h3>
        <div className="flex items-center">
          <span className={`text-2xl font-bold ${scoreColor}`}>
            {scoreOn10Scale.toFixed(1)}
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
      
      {/* Enhanced call-to-action button with preload indication */}
      <div className="mt-4 text-center">
        <button 
          className="text-sm px-4 py-2 bg-[#8B5CF6]/80 hover:bg-[#8B5CF6] text-white font-medium rounded-lg 
                    transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 
                    border border-[#9b87f5]/30 animate-pulse hover:animate-none"
          onClick={handleClick}
          data-testid="siqs-details-button"
        >
          {language === 'en' 
            ? "Click for more details about the current SIQS" 
            : "点击获取更多关于当前SIQS的详细信息"}
        </button>
      </div>
    </div>
  );
};

export default memo(SIQSScore);
