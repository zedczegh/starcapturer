
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock } from 'lucide-react';
import { getLocationDateTime } from '@/utils/timeZoneUtils';

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
  const { t, language } = useLanguage();
  const [currentTime, setCurrentTime] = useState('');
  const [timeZone, setTimeZone] = useState('');
  
  // Function to format the local time based on location
  const updateTime = () => {
    try {
      if (!latitude || !longitude) return;
      
      // Get formatted time for the location
      const timeFormat = language === 'zh' ? 'HH:mm:ss' : 'h:mm:ss a';
      const dateFormat = language === 'zh' ? 'yyyy年MM月dd日' : 'MMM d, yyyy';
      
      const time = getLocationDateTime(latitude, longitude, timeFormat);
      const date = getLocationDateTime(latitude, longitude, dateFormat);
      
      setCurrentTime(`${time} - ${date}`);
      
      // Calculate timezone offset
      const now = new Date();
      const localOffset = now.getTimezoneOffset();
      
      // Try to approximate the timezone from coordinates
      const hourOffset = Math.round(longitude / 15);
      const tzString = `UTC${hourOffset >= 0 ? '+' : ''}${hourOffset}`;
      
      setTimeZone(tzString);
    } catch (error) {
      console.error('Error updating time:', error);
      setCurrentTime(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    if (latitude && longitude) {
      updateTime();
      // Update every second
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [latitude, longitude, language]);
  
  if (!latitude || !longitude) {
    return null;
  }

  return (
    <div className={`text-cosmic-200 text-sm flex items-center ${className}`}>
      <Clock className="h-4 w-4 mr-1.5" />
      <div>
        <div className="font-medium text-cosmic-50">{currentTime}</div>
        <div className="text-xs opacity-70">{t("Local Time", "当地时间")} ({timeZone})</div>
      </div>
    </div>
  );
};

export default LocationTimeDisplay;
