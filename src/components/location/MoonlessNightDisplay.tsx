
import React from 'react';
import { Moon, Clock, CloudMoon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  calculateMoonPhase, 
  getMoonInfo, 
  calculateMoonriseMoonsetTimes 
} from '@/services/realTimeSiqs/moonPhaseCalculator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import type { MoonlessNightInfo } from '@/services/realTimeSiqs/siqsTypes';

interface MoonlessNightDisplayProps {
  latitude: number;
  longitude: number;
}

const MoonlessNightDisplay: React.FC<MoonlessNightDisplayProps> = ({ latitude, longitude }) => {
  const { t } = useLanguage();
  const moonPhase = calculateMoonPhase();
  const { isGoodForAstronomy, name: moonPhaseName } = getMoonInfo();

  /**
   * Calculate moonless night duration based on moonrise and moonset times
   */
  const calculateMoonlessNightDuration = (): MoonlessNightInfo => {
    // Get moon times
    const { moonrise, moonset } = calculateMoonriseMoonsetTimes(latitude, longitude);
    
    // Parse times
    const parseMoonTime = (timeStr: string) => {
      const now = new Date();
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (period && period.toLowerCase() === 'pm' && hours < 12) {
        hours += 12;
      }
      if (period && period.toLowerCase() === 'am' && hours === 12) {
        hours = 0;
      }
      
      const result = new Date(now);
      result.setHours(hours, minutes, 0, 0);
      return result;
    };
    
    const moonriseTime = parseMoonTime(moonrise);
    const moonsetTime = parseMoonTime(moonset);
    
    // Standard night period - default 6 PM to 7 AM
    const nightStart = new Date();
    nightStart.setHours(18, 0, 0, 0);
    
    const nightEnd = new Date();
    nightEnd.setHours(7, 0, 0, 0);
    if (nightEnd <= nightStart) {
      nightEnd.setDate(nightEnd.getDate() + 1);
    }
    
    // Calculate moonless period
    let moonlessStart, moonlessEnd;
    
    // Determine when the moonless period starts
    if (moonsetTime >= nightStart && moonsetTime <= nightEnd) {
      // Moon sets during night - moonless starts at moonset
      moonlessStart = moonsetTime;
    } else if (moonsetTime < nightStart && moonriseTime > nightEnd) {
      // Moon is not in the sky during our night window - entire night is moonless
      moonlessStart = nightStart;
    } else if (moonriseTime > nightStart && moonriseTime < nightEnd) {
      // Moon rises during night - moonless ends at moonrise
      moonlessStart = nightStart;
    } else {
      // Moon is up all night or complex scenario - use phase-based estimate
      const phase = calculateMoonPhase();
      if (phase < 0.1 || phase > 0.9) {
        // Near new moon - mostly dark
        moonlessStart = nightStart;
      } else if (phase > 0.4 && phase < 0.6) {
        // Near full moon - minimal moonless time
        moonlessStart = new Date(nightEnd);
        moonlessStart.setHours(nightEnd.getHours() - 2);
      } else {
        // Partial moon - reduced duration
        moonlessStart = new Date(nightStart);
        moonlessStart.setHours(nightStart.getHours() + 2);
      }
    }
    
    // Determine when the moonless period ends
    if (moonriseTime > moonlessStart && moonriseTime <= nightEnd) {
      // Moon rises before night ends
      moonlessEnd = moonriseTime;
    } else {
      // No moonrise during remaining night
      moonlessEnd = nightEnd;
    }
    
    // Calculate duration in hours
    const durationMs = moonlessEnd.getTime() - moonlessStart.getTime();
    const durationHours = Math.max(0.5, durationMs / (1000 * 60 * 60)); // At least 0.5 hour
    
    // Format times for display
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    // Days until new moon
    const daysUntilNewMoon = calculateDaysUntilNewMoon(moonPhase);
    
    return {
      duration: Math.round(durationHours * 10) / 10, // Round to 1 decimal
      startTime: formatTime(moonlessStart),
      endTime: formatTime(moonlessEnd),
      moonrise: moonrise,
      moonset: moonset,
      nextNewMoon: formatNextNewMoonDate(),
      daysUntilNewMoon
    };
  };

  /**
   * Calculate days until next new moon
   */
  const calculateDaysUntilNewMoon = (phase: number): number => {
    // Calculate days until next new moon (phase = 0)
    // One lunar cycle is 29.53059 days
    const daysUntilNewMoon = phase * 29.53059;
    return Math.round(daysUntilNewMoon);
  };
  
  /**
   * Format the next new moon date
   */
  const formatNextNewMoonDate = (): string => {
    const now = new Date();
    const daysToAdd = calculateDaysUntilNewMoon(moonPhase);
    const newMoonDate = new Date(now);
    newMoonDate.setDate(newMoonDate.getDate() + daysToAdd);
    return newMoonDate.toLocaleDateString();
  };

  const nightInfo = calculateMoonlessNightDuration();

  return (
    <Card className="p-4 bg-cosmic-900/50 border-cosmic-800 hover:bg-cosmic-800/50 transition-all duration-300">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-cosmic-800/50 p-2 rounded-full">
              <CloudMoon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">
                {t('Moonless Night Duration', '无月夜晚时长')}
              </h3>
            </div>
          </div>
          <Clock className="w-4 h-4 text-muted-foreground" />
        </div>

        <div className="mt-1">
          <div className="flex items-center">
            <span className="text-2xl font-semibold">
              {nightInfo.duration}
            </span>
            <span className="ml-1 text-sm text-muted-foreground">{t('hrs', '小时')}</span>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mt-1 text-xs text-muted-foreground cursor-help">
                  {nightInfo.startTime} - {nightInfo.endTime}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {t(
                    'Effective moonless observation period',
                    '有效无月观测时段'
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="mt-1 text-xs text-muted-foreground">
            {t('Moon:', '月相:')} {t(moonPhaseName, moonPhaseName === 'New Moon' ? '新月' : 
                                               moonPhaseName === 'Full Moon' ? '满月' : 
                                               moonPhaseName === 'First Quarter' ? '上弦月' : 
                                               moonPhaseName === 'Last Quarter' ? '下弦月' : 
                                               moonPhaseName === 'Waxing Crescent' ? '蛾眉月' : 
                                               moonPhaseName === 'Waning Crescent' ? '残月' : 
                                               moonPhaseName === 'Waxing Gibbous' ? '盈凸月' : '亏凸月')}
          </div>

          <div className="mt-1 text-xs text-muted-foreground flex justify-between">
            <span>{t('Rise:', '月出:')} {nightInfo.moonrise}</span>
            <span>{t('Set:', '月落:')} {nightInfo.moonset}</span>
          </div>

          <div className={`mt-1 text-xs ${isGoodForAstronomy ? 'text-green-400' : 'text-yellow-400'}`}>
            {isGoodForAstronomy 
              ? t('Optimal moon phase for astronomy', '最佳天文观测月相')
              : t('Next new moon in', '下一个新月在') + ` ${nightInfo.daysUntilNewMoon} ` + t('days', '天')}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MoonlessNightDisplay;
