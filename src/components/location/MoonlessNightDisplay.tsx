
import React from 'react';
import { CloudMoon, Sun, Moon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { getMoonInfo } from '@/services/realTimeSiqs/moonPhaseCalculator';
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
  
  // Use our advanced moon phase algorithm to get moon info
  const { isGoodForAstronomy, name: moonPhaseName } = getMoonInfo();
  
  // Get moonless night information with detailed timing data
  const nightInfo = calculateMoonlessNightDuration(latitude, longitude);
  
  // Format for labels
  const formatLabel = (label: string, enLabel: string, zhLabel: string) => {
    return (
      <span className="text-xs text-muted-foreground">
        {t(enLabel, zhLabel)}:
      </span>
    );
  };
  
  // Format for values
  const formatValue = (value: string) => {
    return (
      <span className="text-xs font-medium">
        {value}
      </span>
    );
  };

  // Format moon time for display safely
  const formatMoonTime = (time: Date | string) => {
    if (typeof time === 'string') return time;
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="p-4 bg-cosmic-900/50 border-cosmic-800 hover:bg-cosmic-800/50 transition-all duration-300">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
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

        {/* Sun/Day Information */}
        <div className="space-y-1 border-b border-cosmic-700/30 pb-2">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-medium">{t('Daylight', '日照时间')}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-1">
            <div className="flex items-center justify-between">
              {formatLabel('Rise', 'Rise', '日出')}
              {formatValue(nightInfo.astronomicalNightEnd)}
            </div>
            <div className="flex items-center justify-between">
              {formatLabel('Set', 'Set', '日落')}
              {formatValue(nightInfo.astronomicalNightStart)}
            </div>
          </div>
        </div>
        
        {/* Night Information */}
        <div className="space-y-1 border-b border-cosmic-700/30 pb-2">
          <div className="flex items-center gap-2">
            <CloudMoon className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium">{t('Night', '夜晚')}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-1">
            <div className="flex items-center justify-between">
              {formatLabel('Begins', 'Begins', '开始')}
              {formatValue(nightInfo.astronomicalNightStart)}
            </div>
            <div className="flex items-center justify-between">
              {formatLabel('Ends', 'Ends', '结束')}
              {formatValue(nightInfo.astronomicalNightEnd)}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            {formatLabel('Duration', 'Duration', '持续时间')}
            {formatValue(`${nightInfo.astronomicalNightDuration} ${t('hrs', '小时')}`)}
          </div>
        </div>
        
        {/* Moon Information */}
        <div className="space-y-1 border-b border-cosmic-700/30 pb-2">
          <div className="flex items-center gap-2">
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
          
          <div className="grid grid-cols-2 gap-1">
            <div className="flex items-center justify-between">
              {formatLabel('Rise', 'Rise', '月出')}
              {formatValue(formatMoonTime(nightInfo.moonrise))}
            </div>
            <div className="flex items-center justify-between">
              {formatLabel('Set', 'Set', '月落')}
              {formatValue(formatMoonTime(nightInfo.moonset))}
            </div>
          </div>
        </div>
        
        {/* Moonless Night Information - This is the key section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
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
          
          <div className="grid grid-cols-2 gap-1">
            <div className="flex items-center justify-between">
              {formatLabel('Begins', 'Begins', '开始')}
              {formatValue(nightInfo.startTime)}
            </div>
            <div className="flex items-center justify-between">
              {formatLabel('Ends', 'Ends', '结束')}
              {formatValue(nightInfo.endTime)}
            </div>
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
