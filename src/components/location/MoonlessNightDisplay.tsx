
import React from 'react';
import { Clock, CloudMoon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateMoonPhase, getMoonInfo } from '@/services/realTimeSiqs/moonPhaseCalculator';
import { calculateMoonlessNightDuration } from '@/utils/weather/moonUtils';
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
  const { isGoodForAstronomy, name: moonPhaseName } = getMoonInfo();
  
  // Get moonless night information
  const nightInfo = calculateMoonlessNightDuration(latitude, longitude);

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
