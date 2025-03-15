
import React, { useMemo } from "react";
import { RefreshCw, MapPin, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { formatDateForDisplay } from "@/utils/dateUtils";

interface LocationHeaderProps {
  name: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
  loading?: boolean;
  onRefresh?: () => void;
}

const LocationHeader: React.FC<LocationHeaderProps> = ({
  name,
  latitude,
  longitude,
  timestamp,
  loading,
  onRefresh
}) => {
  const { language, t } = useLanguage();
  
  // Format the coordinates for display based on language setting
  const formattedCoords = useMemo(() => {
    if (language === "en") {
      // Format for English: decimal degrees with N/S, E/W indicators
      const latDir = latitude >= 0 ? "N" : "S";
      const lngDir = longitude >= 0 ? "E" : "W";
      return `${Math.abs(latitude).toFixed(4)}° ${latDir}, ${Math.abs(longitude).toFixed(4)}° ${lngDir}`;
    } else {
      // Format for Chinese: decimal degrees without indicators
      return `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
    }
  }, [latitude, longitude, language]);
  
  // Extract region name from full location name
  const regionName = useMemo(() => {
    // If name is short, just use it
    if (!name || name.length < 15) return name;
    
    // Try to extract just the region/province/state
    const parts = name.split(/,|，/);
    if (parts.length === 1) return name;
    
    // For Chinese locations, try to extract province/state level
    for (const part of parts) {
      const trimmedPart = part.trim();
      if (trimmedPart.includes("Province") || 
          trimmedPart.includes("District") ||
          trimmedPart.includes("State") ||
          trimmedPart.includes("県") ||
          trimmedPart.includes("省") ||
          trimmedPart.includes("自治区") ||
          trimmedPart.includes("地区")) {
        return trimmedPart;
      }
    }
    
    // If no specific region found, use the first part
    if (parts.length >= 2) {
      const firstTwoParts = parts.slice(0, 2).map(p => p.trim()).join(", ");
      return firstTwoParts;
    }
    
    return parts[0].trim();
  }, [name]);
  
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 py-2">
      <div>
        <h1 className="text-2xl font-bold flex items-center">
          <MapPin className="h-5 w-5 text-primary mr-2" />
          {regionName}
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center text-sm text-muted-foreground mt-1">
          <span>{formattedCoords}</span>
          {timestamp && (
            <span className="sm:ml-4 flex items-center mt-1 sm:mt-0">
              <Calendar className="h-3.5 w-3.5 mr-1 inline" />
              {formatDateForDisplay(timestamp, language)}
            </span>
          )}
        </div>
      </div>
      
      {onRefresh && (
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4 md:mt-0 bg-background/80 backdrop-blur-sm hover:bg-background/60"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t("Refresh", "刷新")}
        </Button>
      )}
    </div>
  );
};

export default LocationHeader;
