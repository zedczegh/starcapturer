
import React from 'react';
import { CloudMoon, Sun, Moon, Calendar, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { getMoonInfo } from '@/services/realTimeSiqs/moonPhaseCalculator';
import { calculateMoonlessNightDuration } from '@/utils/weather/moonUtils';
import { calculateMilkyWayVisibility } from '@/utils/weather/milkyWayCalculator';
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
  const { t, language } = useLanguage();
  
  // Use our advanced moon phase algorithm to get moon info
  const { isGoodForAstronomy, name: moonPhaseName } = getMoonInfo();
  
  // Get moonless night information with detailed timing data
  const nightInfo = calculateMoonlessNightDuration(latitude, longitude);
  
  // Get Milky Way visibility information
  const milkyWayInfo = calculateMilkyWayVisibility(latitude, longitude);
  
  // Format time label and value with better alignment
  const TimeItem = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium ml-2">{value}</span>
    </div>
  );
  
  // Format moon time for display safely
  const formatMoonTime = (time: Date | string) => {
    if (typeof time === 'string') return time;
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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

        {/* Sun/Day Information - Condensed format */}
        <div className="space-y-1 border-b border-cosmic-700/30 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Sun className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-medium">{t('Daylight', '日照时间')}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <TimeItem label={t('Rise', '日出')} value={nightInfo.astronomicalNightEnd} />
            <TimeItem label={t('Set', '日落')} value={nightInfo.astronomicalNightStart} />
          </div>
        </div>
        
        {/* Night Information - Condensed format */}
        <div className="space-y-1 border-b border-cosmic-700/30 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <CloudMoon className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium">{t('Night', '夜晚')}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <TimeItem label={t('Begins', '开始')} value={nightInfo.astronomicalNightStart} />
            <TimeItem label={t('Ends', '结束')} value={nightInfo.astronomicalNightEnd} />
          </div>
          
          <TimeItem 
            label={t('Duration', '持续时间')} 
            value={`${nightInfo.astronomicalNightDuration} ${t('hrs', '小时')}`} 
          />
        </div>
        
        {/* Moon Information - Condensed format */}
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
              value={formatMoonTime(nightInfo.moonrise)} 
            />
            <TimeItem 
              label={t('Set', '月落')} 
              value={formatMoonTime(nightInfo.moonset)} 
            />
          </div>
        </div>
        
        {/* Milky Way Information - New Section */}
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
                    {milkyWayInfo.duration}
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
              value={milkyWayInfo.rise} 
            />
            <TimeItem 
              label={t('Set', '落下')} 
              value={milkyWayInfo.set} 
            />
          </div>
          
          <TimeItem 
            label={t('Best Viewing', '最佳观测')} 
            value={milkyWayInfo.bestViewing} 
          />
          
          <div className="mt-1 text-xs text-blue-300">
            {milkyWayInfo.isVisible 
              ? t('Core visible tonight', '今晚可见银河核心') 
              : t('Core may not be visible from this location', '此位置可能看不到银河核心')}
          </div>
        </div>
        
        {/* Moonless Night Information - This is the key section */}
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

export default MoonlessNightDisplay;
