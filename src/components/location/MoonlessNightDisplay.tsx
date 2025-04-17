
import React from 'react';
import { CloudMoon, Sun, Moon, Calendar } from 'lucide-react';
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
  const { t, language } = useLanguage();
  
  // Use our advanced moon phase algorithm to get moon info
  const { isGoodForAstronomy, name: moonPhaseName } = getMoonInfo();
  
  // Get moonless night information with detailed timing data
  const nightInfo = calculateMoonlessNightDuration(latitude, longitude);
  
  // Format time label and value with better alignment
  const TimeItem = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground mr-2">{label}:</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
  
  // Format moon time for display safely
  const formatMoonTime = (time: Date | string) => {
    if (typeof time === 'string') return time;
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get historical context for the location based on latitude
  const getHistoricalContext = () => {
    const absLatitude = Math.abs(latitude);
    const isNorthern = latitude >= 0;
    
    if (absLatitude > 66) {
      return t(
        "This polar region experiences extreme day/night cycles with midnight sun in summer and polar nights in winter, historically challenging for astronomers.",
        "这个极地地区经历极端的昼夜周期，夏季有午夜太阳，冬季有极夜，历来对天文学家是一种挑战。"
      );
    } else if (absLatitude > 45) {
      return t(
        "This temperate location has significant seasonal variations in night length, traditionally offering excellent winter stargazing conditions.",
        "这个温带位置的夜晚长度有明显的季节性变化，传统上冬季提供极佳的观星条件。"
      );
    } else if (absLatitude > 23.5) {
      return isNorthern ? 
        t(
          "This mid-latitude region has been favored by astronomers for centuries, with moderate seasonal changes and good year-round observation opportunities.",
          "这个中纬度地区几个世纪以来一直受到天文学家的青睐，季节变化适中，全年都有良好的观测机会。"
        ) :
        t(
          "Southern mid-latitudes offer views of the spectacular southern celestial features, historically important for navigation and cultural storytelling.",
          "南半球中纬度地区提供壮观的南天celestial特征的景象，在历史上对导航和文化讲述很重要。"
        );
    } else {
      return t(
        "Near-equatorial regions like this have consistent night lengths year-round and have traditionally been valued for their access to both northern and southern celestial hemispheres.",
        "像这样的近赤道地区全年夜晚长度一致，传统上因能同时观测到北天和南天celestial半球而备受重视。"
      );
    }
  };

  // Determine best observation months based on latitude
  const getBestMonths = () => {
    const isNorthern = latitude >= 0;
    
    if (Math.abs(latitude) > 60) {
      // Polar regions
      return isNorthern ? 
        t("September to March (polar winter)", "9月至3月（极地冬季）") : 
        t("March to September (polar winter)", "3月至9月（极地冬季）");
    } else if (Math.abs(latitude) > 30) {
      // Mid latitudes
      return isNorthern ?
        t("October to March", "10月至3月") :
        t("April to September", "4月至9月");
    } else {
      // Near equator - less seasonal variation
      return t("Year-round with slight favor to dry season", "全年（尤其是干季）");
    }
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
          <div className="flex items-center gap-2 mb-1.5">
            <Sun className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-medium">{t('Daylight', '日照时间')}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <TimeItem label={t('Rise', '日出')} value={nightInfo.astronomicalNightEnd} />
            <TimeItem label={t('Set', '日落')} value={nightInfo.astronomicalNightStart} />
          </div>
        </div>
        
        {/* Night Information - Condensed format */}
        <div className="space-y-1 border-b border-cosmic-700/30 pb-2">
          <div className="flex items-center gap-2 mb-1.5">
            <CloudMoon className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium">{t('Night', '夜晚')}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
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
          <div className="flex items-center gap-2 mb-1.5">
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
          
          <div className="grid grid-cols-2 gap-2">
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
        
        {/* Moonless Night Information - This is the key section */}
        <div className="space-y-1 border-b border-cosmic-700/30 pb-2">
          <div className="flex items-center justify-between mb-1.5">
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
          
          <div className="grid grid-cols-2 gap-2">
            <TimeItem label={t('Begins', '开始')} value={nightInfo.startTime} />
            <TimeItem label={t('Ends', '结束')} value={nightInfo.endTime} />
          </div>
          
          <div className={`mt-1 text-xs ${isGoodForAstronomy ? 'text-green-400' : 'text-yellow-400'}`}>
            {isGoodForAstronomy 
              ? t('Optimal moon phase for astronomy', '最佳天文观测月相')
              : t('Next new moon in', '下一个新月在') + ` ${nightInfo.daysUntilNewMoon} ` + t('days', '天')}
          </div>
        </div>
        
        {/* Historical & Best Observation Times section - New section */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center gap-2 mb-1.5">
            <Calendar className="w-4 h-4 text-blue-300" />
            <span className="text-xs font-medium">{t('Best Observation Times', '最佳观测时间')}</span>
          </div>
          
          <div className="bg-cosmic-800/30 rounded-md p-2 text-xs">
            <p className="text-blue-200 font-medium mb-1">
              {t('Best months:', '最佳月份:')} {getBestMonths()}
            </p>
            <p className="text-cosmic-300 text-xs">
              {getHistoricalContext()}
            </p>
            <p className="text-cosmic-400 text-xs mt-1 italic">
              {t('Estimates based on geographical location, historical weather patterns, and regional climate data.', 
                '基于地理位置、历史天气模式和区域气候数据的估计。')}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MoonlessNightDisplay;
