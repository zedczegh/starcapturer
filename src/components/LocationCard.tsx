
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatTime, calculateAstronomicalNight } from '@/utils/astronomy/nightTimeCalculator';
import { getSiqsScore } from '@/utils/siqsHelpers';
import SiqsScoreBadge from './photoPoints/cards/SiqsScoreBadge';
import { Star, Clock, User } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface LocationCardProps {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  siqs: number | { score: number; isViable: boolean } | null | undefined;
  timestamp?: string;
  isCertified?: boolean;
  username?: React.ReactNode; // Change from string to ReactNode
  hideSiqs?: boolean;
  price?: number;
  currency?: string;
}

const LocationCard: React.FC<LocationCardProps> = ({
  id,
  name,
  latitude,
  longitude,
  siqs,
  timestamp,
  isCertified = false,
  username = 'Anonymous Stargazer',
  hideSiqs = false,
  price,
  currency = '$'
}) => {
  const { t } = useLanguage();
  
  // Convert SIQS to a number regardless of its format
  const numericSiqs = React.useMemo(() => {
    return getSiqsScore(siqs);
  }, [siqs]);
  
  const { start: nightStart, end: nightEnd } = calculateAstronomicalNight(latitude, longitude);
  const nightTimeStr = `${formatTime(nightStart)}-${formatTime(nightEnd)}`;
  
  const formattedTimestamp = timestamp ? new Date(timestamp).toLocaleString() : 'N/A';

  return (
    <Card className="bg-cosmic-900/70 backdrop-blur-md border border-cosmic-700/50 hover:border-cosmic-600/70 transition-colors duration-300 shadow-md hover:shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-50 truncate pr-2">{name}</h3>
          {!hideSiqs && numericSiqs !== null && (
            <div className="flex-shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <SiqsScoreBadge 
                      score={numericSiqs} 
                      isCertified={isCertified} 
                      compact={true}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {t("Sky quality score", "天空质量评分")}
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
        <div className="space-y-2 text-sm text-gray-400">
          {price !== undefined && (
            <div className="flex items-center text-primary font-medium">
              <span>{currency}{price}</span>
              <span className="text-gray-400 ml-1">{t(" / night", " / 晚")}</span>
            </div>
          )}
          
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-cosmic-400" />
            <span>{t("Shared by", "分享者")}: {username}</span>
          </div>
          
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-2 text-cosmic-400" />
            <span>{t("Astronomical Night", "天文夜晚")}: {nightTimeStr}</span>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-cosmic-400" />
            <span>{t("Last Updated", "最近更新")}: {formattedTimestamp}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationCard;
