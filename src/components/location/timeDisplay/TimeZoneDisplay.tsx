
import React from 'react';
import { Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatInTimeZone } from 'date-fns-tz';

interface TimeZoneDisplayProps {
  latitude: number;
  longitude: number;
}

const TimeZoneDisplay: React.FC<TimeZoneDisplayProps> = ({ latitude, longitude }) => {
  const { t } = useLanguage();
  
  // Get local time zone based on coordinates
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const localTime = formatInTimeZone(now, timeZone, 'HH:mm');
  
  return (
    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      <span>
        {t('Local Time', '当地时间')}: {localTime} ({timeZone})
      </span>
    </div>
  );
};

export default TimeZoneDisplay;
