
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

  const calculateNightDuration = () => {
    const now = new Date();
    const startTime = new Date(now);
    startTime.setHours(18, 0, 0, 0);
    
    const endTime = new Date(now);
    endTime.setHours(7, 0, 0, 0);
    if (endTime <= startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    // Calculate duration in hours
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    return {
      duration,
      startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const nightInfo = calculateNightDuration();

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
                {t('Night Duration', '夜晚持续时间')}
              </h3>
            </div>
          </div>
          <Clock className="w-4 h-4 text-muted-foreground" />
        </div>

        <div className="mt-1">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold">
              {Math.round(nightInfo.duration)}
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
                    'Night observation period',
                    '夜间观测时段'
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className={`mt-1 text-xs ${isGoodForAstronomy ? 'text-green-400' : 'text-yellow-400'}`}>
            {isGoodForAstronomy 
              ? t('Good moon phase for astronomy', '适合天文观测的月相')
              : t('Wait for darker moon phase', '等待更暗的月相')}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MoonlessNightDisplay;
