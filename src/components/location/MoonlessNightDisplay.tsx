
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { MoonlessNightInfo } from '@/services/realTimeSiqs/siqsTypes';
import { Clock } from 'lucide-react';

interface MoonlessNightDisplayProps {
  latitude: number;
  longitude: number;
}

const MoonlessNightDisplay = ({ latitude, longitude }: MoonlessNightDisplayProps) => {
  const { t } = useLanguage();
  const [moonlessNight, setMoonlessNight] = useState<MoonlessNightInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateMoonlessNight = async () => {
      try {
        setLoading(true);
        // Simulate a calculation or API call to get moonless night data
        // In a real-world scenario, this would call an astronomy API
        
        // Create a dummy response for demonstration
        const now = new Date();
        const tonight = new Date(now);
        tonight.setHours(20, 0, 0, 0); // 8 PM tonight
        
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(5, 0, 0, 0); // 5 AM tomorrow
        
        // Calculate a dummy moonrise/moonset time
        const moonrise = new Date(now);
        moonrise.setHours(22, 30, 0, 0); // 10:30 PM
        
        const moonset = new Date(now);
        moonset.setDate(moonset.getDate() + 1);
        moonset.setHours(10, 15, 0, 0); // 10:15 AM tomorrow
        
        // Create the moonless night info
        const moonlessInfo: MoonlessNightInfo = {
          moonrise: moonrise,
          moonset: moonset,
          startTime: tonight,
          endTime: tomorrow,
          duration: 9, // hours
          daysUntilNewMoon: 4,
          isTonight: true
        };
        
        setMoonlessNight(moonlessInfo);
        setLoading(false);
      } catch (error) {
        console.error('Error calculating moonless night:', error);
        setLoading(false);
      }
    };

    if (latitude && longitude) {
      calculateMoonlessNight();
    }
  }, [latitude, longitude]);

  const formatTime = (date: Date): string => {
    return format(date, 'h:mm a');
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-indigo-900/40 to-cosmic-900/60 border-cosmic-700/30 shadow-md hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-center mb-3">
          <Clock className="w-5 h-5 text-indigo-400 mr-2" />
          <h3 className="text-lg font-medium text-indigo-100">
            {t("Moonless Night", "无月之夜")}
          </h3>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-2 py-2">
            <div className="h-4 bg-cosmic-700/50 rounded w-3/4"></div>
            <div className="h-4 bg-cosmic-700/50 rounded w-1/2"></div>
            <div className="h-4 bg-cosmic-700/50 rounded w-2/3"></div>
          </div>
        ) : moonlessNight ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-cosmic-400">{t("Moonrise", "月出")}:</span>
              <span className="font-medium">{formatTime(moonlessNight.moonrise)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-cosmic-400">{t("Moonset", "月落")}:</span>
              <span className="font-medium">{formatTime(moonlessNight.moonset)}</span>
            </div>
            
            <div className="pt-2 border-t border-cosmic-700/30">
              <div className="flex justify-between">
                <span className="text-cosmic-400">{t("Best viewing", "最佳观测")}:</span>
                <span className="font-medium">
                  {formatTime(moonlessNight.startTime)} - {formatTime(moonlessNight.endTime)}
                </span>
              </div>
              
              <div className="flex justify-between mt-1">
                <span className="text-cosmic-400">{t("Duration", "持续时间")}:</span>
                <span className="font-medium">{`${moonlessNight.duration} ${t("hours", "小时")}`}</span>
              </div>
            </div>
            
            {moonlessNight.daysUntilNewMoon !== undefined && (
              <div className="pt-2 border-t border-cosmic-700/30 text-xs text-cosmic-300">
                <span>{t("New moon in", "新月将在")} {moonlessNight.daysUntilNewMoon} {t("days", "天内")}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-cosmic-300 py-2">
            {t("Could not calculate moonless night period", "无法计算无月之夜时段")}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MoonlessNightDisplay;
