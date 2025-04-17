
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { getNextMoonlessNight, calculateMoonlessNightDuration } from "@/utils/weather/moonUtils";
import { getMoonInfo } from "@/services/realTimeSiqs/moonPhaseCalculator";
import { formatDistance } from "date-fns";
import { motion } from "framer-motion";
import { Clock, MoonIcon } from "lucide-react";

interface MoonlessNightDisplayProps {
  latitude: number;
  longitude: number;
}

const MoonlessNightDisplay: React.FC<MoonlessNightDisplayProps> = ({ latitude, longitude }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [nextMoonlessNight, setNextMoonlessNight] = useState<any>(null);
  const [duration, setDuration] = useState<number | null>(null);
  
  // Get current moon phase
  const moonInfo = getMoonInfo();
  
  useEffect(() => {
    const fetchMoonlessNight = async () => {
      setLoading(true);
      
      try {
        // Get the next moonless night data
        const data = await getNextMoonlessNight(latitude, longitude);
        setNextMoonlessNight(data);
        
        // Calculate duration
        const calculatedDuration = calculateMoonlessNightDuration(
          latitude,
          longitude
        );
        setDuration(calculatedDuration);
      } catch (error) {
        console.error("Error fetching moonless night data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (latitude && longitude) {
      fetchMoonlessNight();
    }
  }, [latitude, longitude]);
  
  // Format the date for next moonless night
  const formattedDate = nextMoonlessNight ? 
    formatDistance(new Date(nextMoonlessNight.date), new Date(), { addSuffix: true }) : 
    "";

  return (
    <Card className="backdrop-blur-sm border-cosmic-700/30 hover:border-cosmic-600/50 transition-all duration-300 shadow-lg overflow-hidden hover:shadow-cosmic-600/10">
      <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
        <CardTitle className="text-lg flex items-center gap-2">
          <MoonIcon className="w-4 h-4 text-purple-400" />
          {t("Moonless Night", "无月之夜")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-slate-700/60 rounded w-3/4"></div>
            <div className="h-4 bg-slate-700/60 rounded w-1/2"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="text-sm text-cosmic-100">
                {t("Next Opportunity", "下次机会")}:
              </div>
              <div className="text-sm font-medium text-purple-400">
                {formattedDate}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-cosmic-100">
                {t("Expected Duration", "预计持续时间")}:
              </div>
              <div className="text-sm font-medium text-purple-400 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-purple-400/70" />
                {duration ? `${duration.toFixed(1)} ${t("hours", "小时")}` : "Unknown"}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-cosmic-100">
                {t("Current Moon Phase", "当前月相")}:
              </div>
              <div className="text-sm font-medium text-purple-400">
                {moonInfo.name}
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default MoonlessNightDisplay;
