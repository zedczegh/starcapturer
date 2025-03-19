
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Compass, Navigation, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDistanceBetweenCoordinates } from "@/utils/geoUtils";
import { SharedAstroSpot } from "@/types/weather";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { calculateMoonPhase } from "@/utils/siqsValidation";
import { motion } from "framer-motion";

interface RecommendedPhotoPointsProps {
  onSelectPoint: (location: { name: string; latitude: number; longitude: number }) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

/**
 * Displays recommended astro-photography locations for users to choose from
 */
const RecommendedPhotoPoints: React.FC<RecommendedPhotoPointsProps> = ({
  onSelectPoint,
  userLocation
}) => {
  const { t, language } = useLanguage();
  const [visibleCount, setVisibleCount] = useState(3);
  
  // Create recommended point list with SIQS scores
  const recommendedPoints: SharedAstroSpot[] = useMemo(() => {
    const moonPhase = calculateMoonPhase();
    
    const points = [
      {
        id: "borrego-springs",
        name: "Borrego Springs",
        chineseName: "博雷戈温泉",
        latitude: 33.2558,
        longitude: -116.3753,
        bortleScale: 2,
        siqs: calculateSIQS({
          cloudCover: 10,
          bortleScale: 2,
          seeingConditions: 2,
          windSpeed: 5,
          humidity: 30,
          moonPhase
        }),
        isViable: true,
        distance: 0,
        timestamp: new Date().toISOString()
      },
      {
        id: "joshua-tree",
        name: "Joshua Tree National Park",
        chineseName: "约书亚树国家公园",
        latitude: 33.8734,
        longitude: -115.9010,
        bortleScale: 1,
        siqs: calculateSIQS({
          cloudCover: 10,
          bortleScale: 1,
          seeingConditions: 2,
          windSpeed: 5,
          humidity: 30,
          moonPhase
        }),
        isViable: true,
        distance: 0,
        timestamp: new Date().toISOString()
      },
      {
        id: "death-valley",
        name: "Death Valley",
        chineseName: "死亡谷",
        latitude: 36.5323,
        longitude: -116.9325,
        bortleScale: 1,
        siqs: calculateSIQS({
          cloudCover: 5,
          bortleScale: 1,
          seeingConditions: 1,
          windSpeed: 5,
          humidity: 20,
          moonPhase
        }),
        isViable: true,
        distance: 0,
        timestamp: new Date().toISOString()
      },
      {
        id: "mount-laguna",
        name: "Mount Laguna",
        chineseName: "拉古纳山",
        latitude: 32.8675,
        longitude: -116.4169,
        bortleScale: 3,
        siqs: calculateSIQS({
          cloudCover: 15,
          bortleScale: 3,
          seeingConditions: 2,
          windSpeed: 10,
          humidity: 40,
          moonPhase
        }),
        isViable: true,
        distance: 0,
        timestamp: new Date().toISOString()
      },
      {
        id: "trona-pinnacles",
        name: "Trona Pinnacles",
        chineseName: "特罗纳尖峰",
        latitude: 35.6168,
        longitude: -117.3692,
        bortleScale: 1,
        siqs: calculateSIQS({
          cloudCover: 5,
          bortleScale: 1,
          seeingConditions: 1,
          windSpeed: 5,
          humidity: 20,
          moonPhase
        }),
        isViable: true,
        distance: 0,
        timestamp: new Date().toISOString()
      }
    ];
    
    // If we have a user location, calculate distances
    if (userLocation) {
      return points.map(point => ({
        ...point,
        distance: getDistanceBetweenCoordinates(
          userLocation.latitude,
          userLocation.longitude,
          point.latitude,
          point.longitude
        )
      })).sort((a, b) => a.distance - b.distance);
    }
    
    return points;
  }, [userLocation]);
  
  const handleShowMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 3, recommendedPoints.length));
  }, [recommendedPoints.length]);
  
  const handleShowLess = useCallback(() => {
    setVisibleCount(3);
  }, []);
  
  const visiblePoints = useMemo(() => {
    return recommendedPoints.slice(0, visibleCount);
  }, [recommendedPoints, visibleCount]);
  
  // Get point name based on language
  const getPointName = useCallback((point: SharedAstroSpot) => {
    return language === 'zh' && point.chineseName ? point.chineseName : point.name;
  }, [language]);
  
  return (
    <div className="rounded-lg bg-cosmic-900/25 border border-cosmic-800/40 p-4 hover:border-cosmic-800/60 transition-all">
      <div className="flex items-center mb-3">
        <Compass className="mr-2 h-4 w-4 text-primary/80" />
        <h3 className="font-semibold">{t("Recommended Points", "推荐观测点")}</h3>
      </div>
      
      <div className="space-y-2">
        {visiblePoints.map((point, idx) => (
          <motion.div
            key={point.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between text-left h-auto py-2 bg-cosmic-950/40 hover:bg-cosmic-900/40"
              onClick={() => onSelectPoint({ 
                name: point.name, 
                latitude: point.latitude, 
                longitude: point.longitude 
              })}
            >
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-2 text-primary/70" />
                <span className="truncate max-w-[150px]">{getPointName(point)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs opacity-70">
                  {point.siqs.score.toFixed(1)}
                </span>
                {point.distance > 0 && (
                  <span className="text-xs opacity-70">
                    {point.distance < 1 
                      ? `${Math.round(point.distance * 1000)}m` 
                      : `${point.distance.toFixed(1)}km`}
                  </span>
                )}
                <Navigation className="h-3 w-3 text-primary/70" />
              </div>
            </Button>
          </motion.div>
        ))}
      </div>
      
      {recommendedPoints.length > 3 && (
        <div className="mt-2 text-center">
          {visibleCount < recommendedPoints.length ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShowMore}
              className="text-xs hover:bg-primary/10"
            >
              {t("Show more", "显示更多")}
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShowLess}
              className="text-xs hover:bg-primary/10"
            >
              {t("Show less", "收起")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default RecommendedPhotoPoints;
