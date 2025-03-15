
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
  
  // Extract region name from full location name - improved for better readability
  const regionName = useMemo(() => {
    if (!name || name.length < 10) return name;
    
    const parts = name.split(/,|，/);
    if (parts.length <= 1) return name;
    
    // Try to get province/state/region level (higher administrative division)
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      // Check for province/state identifiers in various languages
      if (part.includes("Province") || 
          part.includes("State") || 
          part.includes("District") ||
          part.includes("Region") ||
          part.includes("County") ||
          part.includes("Territory") ||
          part.includes("Oblast") ||
          part.includes("Prefecture") ||
          part.includes("省") || 
          part.includes("自治区") || 
          part.includes("特区") ||
          part.includes("特別行政区") ||
          part.includes("道") ||
          part.includes("府") ||
          part.includes("県") ||
          part.includes("州")) {
        return part;
      }
    }
    
    // If no specific region marker found, and we have enough parts,
    // use the second element which is often the city/region
    if (parts.length >= 2) {
      return parts[1].trim();
    }
    
    // Fall back to the full name if we couldn't extract a meaningful part
    return name;
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
