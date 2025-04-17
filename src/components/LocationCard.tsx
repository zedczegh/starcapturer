import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatTime, calculateAstronomicalNight } from '@/utils/astronomy/nightTimeCalculator';
import { siqsToColor } from '@/lib/siqs/utils';
import { getSiqsScore } from '@/utils/siqsHelpers';
import SiqsScoreBadge from './photoPoints/cards/SiqsScoreBadge';

interface LocationCardProps {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  siqs: number | { score: number; isViable: boolean } | undefined;
  timestamp?: string;
  isCertified?: boolean;
}

const LocationCard: React.FC<LocationCardProps> = ({
  id,
  name,
  latitude,
  longitude,
  siqs,
  timestamp,
  isCertified = false
}) => {
  const { t } = useLanguage();
  
  const numericSiqs = getSiqsScore(siqs);
  const siqsColor = siqsToColor(numericSiqs);
  
  const { start: nightStart, end: nightEnd } = calculateAstronomicalNight(latitude, longitude);
  const nightTimeStr = `${formatTime(nightStart)}-${formatTime(nightEnd)}`;
  
  const formattedTimestamp = timestamp ? new Date(timestamp).toLocaleString() : 'N/A';

  return (
    <Link to={`/location/${id}`} className="block">
      <Card className="bg-cosmic-900/70 backdrop-blur-md border border-cosmic-700/50 hover:border-cosmic-600/70 transition-colors duration-300 shadow-md hover:shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-50">{name}</h3>
            <SiqsScoreBadge score={siqs} isCertified={isCertified} />
          </div>
          <div className="text-sm text-gray-400">
            {t("Latitude", "纬度")}: {latitude.toFixed(4)}
            <br />
            {t("Longitude", "经度")}: {longitude.toFixed(4)}
            <br />
            {t("Astronomical Night", "天文夜晚")}: {nightTimeStr}
            <br />
            {t("Last Updated", "最近更新")}: {formattedTimestamp}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default LocationCard;
