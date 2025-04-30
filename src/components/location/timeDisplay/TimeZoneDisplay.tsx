
import React, { useEffect, useState } from 'react';
import { Globe2 } from 'lucide-react';

interface TimeZoneDisplayProps {
  latitude: number;
  longitude: number;
}

const TimeZoneDisplay = ({ latitude, longitude }: TimeZoneDisplayProps) => {
  const [timeZone, setTimeZone] = useState<string>("");
  const [localTime, setLocalTime] = useState<string>("");

  useEffect(() => {
    try {
      // Get time zone name for the location
      const date = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timeZoneName: 'short'
      });
      const parts = formatter.formatToParts(date);
      const timeZonePart = parts.find(part => part.type === 'timeZoneName');
      setTimeZone(timeZonePart?.value || "");

      // Get current local time
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      setLocalTime(timeFormatter.format(date));
      
      // Update time every minute
      const interval = setInterval(() => {
        const updatedDate = new Date();
        setLocalTime(timeFormatter.format(updatedDate));
      }, 60000);

      return () => clearInterval(interval);
    } catch (e) {
      console.error("Error getting timezone:", e);
      setTimeZone("UTC");
    }
  }, [latitude, longitude]);

  return (
    <div className="flex items-center gap-1.5 text-cosmic-200 mt-1">
      <Globe2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-cosmic-400" />
      <span className="text-sm sm:text-xs flex items-center gap-1.5">
        <span className="font-mono text-base sm:text-sm">{localTime}</span>
        <span className="text-cosmic-400 font-medium">{timeZone}</span>
      </span>
    </div>
  );
};

export default React.memo(TimeZoneDisplay);
