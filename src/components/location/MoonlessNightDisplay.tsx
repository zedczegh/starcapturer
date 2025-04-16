
import React from 'react';
import { Moon, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateMoonPhase, getMoonInfo } from '@/services/realTimeSiqs/moonPhaseCalculator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface MoonlessNightDisplayProps {
  latitude: number;
  longitude: number;
}

const MoonlessNightDisplay: React.FC<MoonlessNightDisplayProps> = ({ latitude, longitude }) => {
  const { t } = useLanguage();
  const moonPhase = calculateMoonPhase();
  const { isGoodForAstronomy, name: moonPhaseName } = getMoonInfo();

  /**
   * Calculate moonrise and moonset times based on location and current moon phase
   */
  const calculateMoonriseMoonset = () => {
    const now = new Date();
    const phase = moonPhase;
    
    // Base calculations that factor in moon phase, latitude, and time of year
    // - New moon rises and sets with the sun
    // - Full moon rises at sunset, sets at sunrise
    // - First quarter rises at noon, sets at midnight
    // - Last quarter rises at midnight, sets at noon
    
    // Get current date info
    const month = now.getMonth();
    const isWinter = (month >= 9 || month <= 2);  // Oct to Mar is winter-ish
    
    // Estimate sunset/sunrise times based on season and latitude
    let sunriseHour = isWinter ? 7 : 6;
    let sunsetHour = isWinter ? 17 : 20;
    
    // Adjust for latitude - higher latitudes have more extreme day/night variation
    const latitudeAdjustment = Math.abs(latitude) / 15; // 0 to 6 hours adjustment
    if (Math.abs(latitude) > 30) {
      if (isWinter) {
        // Winter: later sunrise, earlier sunset at high latitudes
        sunriseHour += latitudeAdjustment * (latitude > 0 ? 1 : -1);
        sunsetHour -= latitudeAdjustment * (latitude > 0 ? 1 : -1);
      } else {
        // Summer: earlier sunrise, later sunset at high latitudes
        sunriseHour -= latitudeAdjustment * (latitude > 0 ? 1 : -1);
        sunsetHour += latitudeAdjustment * (latitude > 0 ? 1 : -1);
      }
    }
    
    // Normalize hours to 0-24 range
    sunriseHour = Math.max(4, Math.min(9, sunriseHour));
    sunsetHour = Math.max(17, Math.min(22, sunsetHour));
    
    // Calculate moonrise and moonset based on phase
    let moonriseHour, moonsetHour;
    
    if (phase < 0.05 || phase > 0.95) {
      // New Moon - rises and sets with the sun
      moonriseHour = sunriseHour;
      moonsetHour = sunsetHour;
    } else if (phase < 0.25) {
      // Waxing Crescent - rises after sunrise, sets after sunset
      moonriseHour = sunriseHour + 3 + (phase * 12); // gradually later
      moonsetHour = sunsetHour + 3 + (phase * 12);
    } else if (phase < 0.30) {
      // First Quarter - rises around noon, sets around midnight
      moonriseHour = 12;
      moonsetHour = 24;
    } else if (phase < 0.45) {
      // Waxing Gibbous - rises in afternoon, sets after midnight
      moonriseHour = 14 + ((phase - 0.3) * 12); // gradually later
      moonsetHour = 2 + ((phase - 0.3) * 12);
    } else if (phase < 0.55) {
      // Full Moon - rises at sunset, sets at sunrise
      moonriseHour = sunsetHour;
      moonsetHour = sunriseHour + 24; // next day
    } else if (phase < 0.70) {
      // Waning Gibbous - rises after sunset, sets after sunrise
      moonriseHour = sunsetHour + 2 + ((phase - 0.55) * 8);
      moonsetHour = sunriseHour + 2 + ((phase - 0.55) * 8) + 12;
    } else if (phase < 0.80) {
      // Last Quarter - rises around midnight, sets around noon
      moonriseHour = 24;
      moonsetHour = 12 + 24; // noon next day
    } else {
      // Waning Crescent - rises in early morning, sets in afternoon
      moonriseHour = 3 + ((phase - 0.8) * 20); // approaches sunrise
      moonsetHour = 15 + ((phase - 0.8) * 20);
    }
    
    // Normalize hours to 0-24 range for today and tomorrow
    const todayDate = now.getDate();
    const moonriseDate = moonriseHour >= 24 ? todayDate + 1 : todayDate;
    const moonsetDate = moonsetHour >= 24 ? todayDate + 1 : todayDate;
    
    moonriseHour = moonriseHour % 24;
    moonsetHour = moonsetHour % 24;
    
    // Format times
    const moonriseTime = new Date(now);
    moonriseTime.setDate(moonriseDate);
    moonriseTime.setHours(Math.floor(moonriseHour), Math.round((moonriseHour % 1) * 60), 0);
    
    const moonsetTime = new Date(now);
    moonsetTime.setDate(moonsetDate);
    moonsetTime.setHours(Math.floor(moonsetHour), Math.round((moonsetHour % 1) * 60), 0);
    
    // Format for display
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    return {
      moonrise: formatTime(moonriseTime),
      moonset: formatTime(moonsetTime)
    };
  };

  /**
   * Calculate moonless night duration based on moonrise and moonset times
   */
  const calculateMoonlessNightDuration = () => {
    // Moon times
    const { moonrise, moonset } = calculateMoonriseMoonset();
    
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
    const durationHours = durationMs / (1000 * 60 * 60);
    
    // Format times for display
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    return {
      duration: Math.round(durationHours * 10) / 10, // Round to 1 decimal
      startTime: formatTime(moonlessStart),
      endTime: formatTime(moonlessEnd),
      moonrise: moonrise,
      moonset: moonset
    };
  };

  const nightInfo = calculateMoonlessNightDuration();

  return (
    <Card className="p-4 bg-cosmic-900/50 border-cosmic-800 hover:bg-cosmic-800/50 transition-all duration-300">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-cosmic-800/50 p-2 rounded-full">
              <Moon className="w-5 h-5 text-primary" />
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
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold">
              {nightInfo.duration}
            </span>
            <span className="text-sm text-muted-foreground">{t('hours', '小时')}</span>
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
              : t('Wait for darker moon phase', '等待更暗的月相')}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MoonlessNightDisplay;
