
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatTime, calculateAstronomicalNight } from '@/utils/astronomy/nightTimeCalculator';
import { getSiqsScore } from '@/utils/siqsHelpers';
import SiqsScoreBadge from './photoPoints/cards/SiqsScoreBadge';
import { Star, Clock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

interface LocationCardProps {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  siqs: number | { score: number; isViable: boolean } | undefined;
  timestamp?: string;
  isCertified?: boolean;
  username?: string | React.ReactNode;
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
  const { user } = useAuth();
  const location = useLocation();
  
  // Memoize these expensive calculations
  const numericSiqs = React.useMemo(() => getSiqsScore(siqs), [siqs]);
  const { start: nightStart, end: nightEnd } = React.useMemo(
    () => calculateAstronomicalNight(latitude, longitude),
    [latitude, longitude]
  );
  const nightTimeStr = React.useMemo(
    () => `${formatTime(nightStart)}-${formatTime(nightEnd)}`,
    [nightStart, nightEnd]
  );
  
  const formattedTimestamp = React.useMemo(() => {
    if (!timestamp) return 'N/A';
    
    try {
      return new Date(timestamp).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return timestamp;
    }
  }, [timestamp]);

  // Display appropriate username based on context
  // If viewing own spots, show "You" instead of username
  const displayUsername = React.useMemo(() => {
    if (location.pathname.includes('/manage-astro-spots') && user) {
      return t("You", "您");
    }
    return username;
  }, [username, user, t, location.pathname]);

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
            <span>{t("Shared by", "分享者")}: {displayUsername}</span>
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

export default React.memo(LocationCard);
