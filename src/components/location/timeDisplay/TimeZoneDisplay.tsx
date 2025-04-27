
import React from 'react';
import { Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocationFormattedTime } from '@/utils/timezone/timeZoneCalculator';

interface TimeZoneDisplayProps {
  latitude: number;
  longitude: number;
}

const TimeZoneDisplay: React.FC<TimeZoneDisplayProps> = ({ latitude, longitude }) => {
  const { t } = useLanguage();
  
  // Get location's timezone
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localTime = getLocationFormattedTime(latitude, longitude);
  
  return (
    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      <span>
        {t('Local Time at Location', '当地时间')}: {localTime} ({timeZone})
      </span>
    </div>
  );
};

export default TimeZoneDisplay;
