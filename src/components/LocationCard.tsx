
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatTime, calculateAstronomicalNight } from '@/utils/astronomy/nightTimeCalculator';
import { siqsToColor } from '@/lib/siqs/utils';
import { getSiqsScore } from '@/utils/siqsHelpers';
import SiqsScoreBadge from './photoPoints/cards/SiqsScoreBadge';
import { Star, Clock, User } from 'lucide-react';

interface LocationCardProps {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  siqs: number | { score: number; isViable: boolean } | undefined | null;
  timestamp?: string;
  isCertified?: boolean;
  username?: string;
}

const LocationCard: React.FC<LocationCardProps> = ({
  id,
  name,
  latitude,
  longitude,
  siqs,
  timestamp,
  isCertified = false,
  username = 'Anonymous Stargazer'
}) => {
  const { t } = useLanguage();
  
  const numericSiqs = getSiqsScore(siqs);
  const { start: nightStart, end: nightEnd } = calculateAstronomicalNight(latitude, longitude);
  const nightTimeStr = `${formatTime(nightStart)}-${formatTime(nightEnd)}`;
  
  const formattedTimestamp = timestamp ? new Date(timestamp).toLocaleString() : 'N/A';

  return (
    <Card className="bg-cosmic-900/70 backdrop-blur-md border border-cosmic-700/50 hover:border-cosmic-600/70 transition-colors duration-300 shadow-md hover:shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-50 truncate pr-2">{name}</h3>
          <div className="flex-shrink-0">
            <SiqsScoreBadge score={numericSiqs} isCertified={isCertified} />
          </div>
        </div>
        <div className="space-y-2 text-sm text-gray-400">
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
