
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
  
  // Extract region name from full location name for consistent display
  const displayName = useMemo(() => {
    if (!name) return "";
    
    const parts = name.split(/,|，/);
    if (parts.length <= 1) return name;
    
    // For consistency with homepage, use the second part (usually the region/province/state)
    if (parts.length >= 2) {
      return parts[1].trim();
    }
    
    return name;
  }, [name]);
  
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 py-2">
      <div>
        <h1 className="text-2xl font-bold flex items-center">
          <MapPin className="h-5 w-5 text-primary mr-2" />
          {displayName}
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
