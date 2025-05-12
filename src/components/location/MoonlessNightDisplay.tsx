import React, { useMemo } from 'react';
import { CloudMoon, Sun, Moon, Calendar, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { getMoonInfo, calculateMoonriseMoonsetTimes } from '@/services/realTimeSiqs/moonPhaseCalculator';
import { calculateMoonlessNightDuration } from '@/utils/weather/moonUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { getAstronomicalData, formatAstronomicalTime } from '@/services/astronomy/astronomyCalculationService';
import TimeItem from './timeDisplay/TimeItem';
import SunlightSection from './sections/SunlightSection';
import NightSection from './sections/NightSection';

interface MoonlessNightDisplayProps {
  latitude: number;
  longitude: number;
}

const MoonlessNightDisplay: React.FC<MoonlessNightDisplayProps> = ({ latitude, longitude }) => {
  const { t, language } = useLanguage();
  
  const astronomyData = useMemo(() => {
    return getAstronomicalData(latitude, longitude);
  }, [latitude, longitude]);
  
  const { isGoodForAstronomy, name: moonPhaseName } = getMoonInfo();
  
  const nightInfo = calculateMoonlessNightDuration(latitude, longitude);

  const directMoonTimes = useMemo(() => {
    return calculateMoonriseMoonsetTimes(latitude, longitude);
  }, [latitude, longitude]);
  
  const formatMoonTime = (time: Date | string) => {
    if (typeof time === 'string') {
      if (time === 'Unknown') {
        return '-';
      }
      return time;
    }
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const moonriseTime = nightInfo.moonrise === 'Unknown' ? directMoonTimes.moonrise : nightInfo.moonrise;
  const moonsetTime = nightInfo.moonset === 'Unknown' ? directMoonTimes.moonset : nightInfo.moonset;

  const astroNightStart = formatAstronomicalTime(astronomyData.astronomicalNight.start);
  const astroNightEnd = formatAstronomicalTime(astronomyData.astronomicalNight.end);

  return (
    <Card className="p-4 bg-cosmic-900/50 border-cosmic-800 hover:bg-cosmic-800/50 transition-all duration-300">
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="bg-cosmic-800/50 p-2 rounded-full">
              <CloudMoon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">
                {t('Astronomical Night', '天文夜晚')}
              </h3>
            </div>
          </div>
        </div>

        <SunlightSection 
          astroNightEnd={astroNightEnd}
          astroNightStart={astroNightStart}
        />
        
        <NightSection 
          astroNightStart={astroNightStart}
          astroNightEnd={astroNightEnd}
          duration={astronomyData.astronomicalNight.duration}
          latitude={latitude}
          longitude={longitude}
        />
        
        <div className="space-y-1 border-b border-cosmic-700/30 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Moon className="w-4 h-4 text-gray-300" />
            <span className="text-xs font-medium">
              {t('Moon', '月相')}: {t(moonPhaseName, 
                moonPhaseName === 'New Moon' ? '新月' : 
                moonPhaseName === 'Full Moon' ? '满月' : 
                moonPhaseName === 'First Quarter' ? '上弦月' : 
                moonPhaseName === 'Last Quarter' ? '下弦月' : 
                moonPhaseName === 'Waxing Crescent' ? '蛾眉月' : 
                moonPhaseName === 'Waning Crescent' ? '残月' : 
                moonPhaseName === 'Waxing Gibbous' ? '盈凸月' : '亏凸月')}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <TimeItem 
              label={t('Rise', '月出')} 
              value={formatMoonTime(moonriseTime)} 
            />
            <TimeItem 
              label={t('Set', '月落')} 
              value={formatMoonTime(moonsetTime)} 
            />
          </div>
        </div>
        
        <div className="space-y-1 border-b border-cosmic-700/30 pb-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span className="text-xs font-medium">{t('Milky Way', '银河')}</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-primary cursor-help">
                    {astronomyData.milkyWay.duration}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {t(
                      'Core visibility period (Sagittarius region)',
                      '银河核心可见期（人马座区域）'
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <TimeItem 
              label={t('Rise', '升起')} 
              value={astronomyData.milkyWay.rise} 
            />
            <TimeItem 
              label={t('Set', '落下')} 
              value={astronomyData.milkyWay.set} 
            />
          </div>
          
          <TimeItem 
            label={t('Best Viewing', '最佳观测')} 
            value={astronomyData.milkyWay.bestViewing} 
          />
          
          <div className="mt-1 text-xs text-blue-300">
            {astronomyData.milkyWay.isVisible 
              ? t('Core visible tonight', '今晚可见银河核心') 
              : t('Core may not be visible from this location', '此位置可能看不到银河核心')}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <CloudMoon className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">{t('Moonless Night', '无月夜晚')}</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-primary cursor-help">
                    {nightInfo.duration} {t('hrs', '小时')}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {t(
                      'Period when the moon is not visible during night',
                      '夜晚期间月亮不可见的时段'
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <TimeItem label={t('Begins', '开始')} value={nightInfo.startTime} />
            <TimeItem label={t('Ends', '结束')} value={nightInfo.endTime} />
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

export default React.memo(MoonlessNightDisplay);
