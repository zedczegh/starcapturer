
import React, { useState, useEffect } from 'react';
import { getLocationDateTime, getTimeZoneOffsetHours } from '@/utils/timeZoneUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock } from 'lucide-react';

interface LocationTimeDisplayProps {
  latitude: number;
  longitude: number;
  className?: string;
}

const LocationTimeDisplay: React.FC<LocationTimeDisplayProps> = ({
  latitude,
  longitude,
  className = ''
}) => {
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [timeZoneInfo, setTimeZoneInfo] = useState<string>('');
  
  // Update the time every second
  useEffect(() => {
    if (!latitude || !longitude) return;
    
    // Initialize time
    updateTime();
    
    // Set up interval to update time
    const intervalId = setInterval(updateTime, 1000);
    
    return () => clearInterval(intervalId);
  }, [latitude, longitude]);
  
  const updateTime = () => {
    try {
      // Get current time at location
      const timeString = getLocationDateTime(latitude, longitude, 'HH:mm:ss');
      const dateString = getLocationDateTime(latitude, longitude, 'yyyy-MM-dd');
      const offset = getTimeZoneOffsetHours(latitude, longitude);
      
      setCurrentTime(`${timeString}`);
      setTimeZoneInfo(`${dateString} (UTC${offset})`);
    } catch (error) {
      console.error("Error updating location time:", error);
    }
  };
  
  if (!latitude || !longitude) {
    return null;
  }
  
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <Clock className="h-4 w-4 text-muted-foreground" />
      <div>
        <div className="font-mono text-lg tracking-wider">{currentTime}</div>
        <div className="text-xs text-muted-foreground">{timeZoneInfo}</div>
      </div>
    </div>
  );
};

export default LocationTimeDisplay;
