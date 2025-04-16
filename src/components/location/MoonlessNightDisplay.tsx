
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
  const { isGoodForAstronomy } = getMoonInfo();

  const calculateMoonlessNightDuration = () => {
    // Enhanced calculation taking into account moon phase
    const phase = calculateMoonPhase();
    const now = new Date();
    
    // Base night duration (6 PM to 7 AM)
    let startTime = new Date(now);
    startTime.setHours(18, 0, 0, 0);
    
    let endTime = new Date(now);
    endTime.setHours(7, 0, 0, 0);
    if (endTime <= startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    // Calculate effective moonless duration based on moon phase
    let effectiveDuration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    // Adjust duration based on moon phase
    if (phase < 0.1 || phase > 0.9) {
      // Near new moon - full duration
      effectiveDuration = effectiveDuration;
    } else if (phase > 0.4 && phase < 0.6) {
      // Near full moon - minimal duration
      effectiveDuration *= 0.2;
    } else {
      // Partial moon - reduced duration
      effectiveDuration *= (1 - (Math.min(Math.abs(0.5 - phase), 0.4) * 2));
    }
    
    return {
      duration: Math.round(effectiveDuration * 10) / 10, // Round to 1 decimal
      startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
