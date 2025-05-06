
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatTime, calculateAstronomicalNight } from '@/utils/astronomy/nightTimeCalculator';
import { getSiqsScore } from '@/utils/siqsHelpers';
import SiqsScoreBadge from './photoPoints/cards/SiqsScoreBadge';
import { Star, Clock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { useRealTimeSiqs } from '@/hooks/siqs/useRealTimeSiqs';

interface LocationCardProps {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  siqs: number | { score: number; isViable: boolean } | undefined;
  timestamp?: string;
  isCertified?: boolean;
  username?: string | React.ReactNode;
  chineseName?: string;
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
  chineseName
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const [displaySiqs, setDisplaySiqs] = useState<number | null>(getSiqsScore(siqs));
  const [siqsLoading, setSiqsLoading] = useState(false);
  const { calculateSiqs } = useRealTimeSiqs({ skipCache: false });
  
  // Load real-time SIQS data when the component mounts
  useEffect(() => {
    let isMounted = true;
    const initialSiqs = getSiqsScore(siqs);
    
    // Set initial SIQS value
    if (initialSiqs) {
      setDisplaySiqs(initialSiqs);
    }
    
    // Fetch real-time SIQS if coordinates are available
    const fetchRealTimeSiqs = async () => {
      if (latitude && longitude) {
        try {
          setSiqsLoading(true);
          const result = await calculateSiqs(latitude, longitude);
          if (isMounted && result?.siqs) {
            setDisplaySiqs(result.siqs);
          }
        } catch (error) {
          console.error('Error calculating SIQS:', error);
          // Fall back to initial value if available
          if (isMounted && initialSiqs && !displaySiqs) {
            setDisplaySiqs(initialSiqs);
          }
        } finally {
          if (isMounted) {
            setSiqsLoading(false);
          }
        }
      }
    };
    
    fetchRealTimeSiqs();
    
    return () => { isMounted = false; };
  }, [latitude, longitude, siqs, calculateSiqs]);
  
  // Memoize these expensive calculations
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
  const displayUsername = React.useMemo(() => {
    if (location.pathname.includes('/manage-astro-spots') && user) {
      return t("You", "您");
    }
    return username;
  }, [username, user, t, location.pathname]);

  // Use the appropriate name based on language
  const displayName = React.useMemo(() => {
    if (language === 'zh' && chineseName) {
      return chineseName;
    }
    return name;
  }, [name, chineseName, language]);

  return (
    <Card className="bg-cosmic-900/70 backdrop-blur-md border border-cosmic-700/50 hover:border-cosmic-600/70 transition-colors duration-300 shadow-md hover:shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-50 truncate pr-2">{displayName}</h3>
          <div className="flex-shrink-0">
            <SiqsScoreBadge score={displaySiqs} loading={siqsLoading} isCertified={isCertified} />
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
