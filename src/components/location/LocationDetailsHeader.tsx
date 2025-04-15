
import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocationDetailsService } from "./header/LocationDetailsService";
import NavigationButtons from "./navigation/NavigationButtons";

interface LocationDetailsHeaderProps {
  name?: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  loading?: boolean;
  className?: string;
}

const LocationDetailsHeader: React.FC<LocationDetailsHeaderProps> = ({ 
  name, 
  latitude,
  longitude,
  timestamp, 
  loading,
  className
}) => {
  const { t, language } = useLanguage();
  const { enhancedName, locationDetails } = useLocationDetailsService({
    latitude,
    longitude,
    language
  });
  
  // Determine which name to display with priority to enhanced name
  const displayName = enhancedName || name || t("Location Details", "位置详情");
  
  return (
    <div className={cn("mb-6 pt-16", className)}>
      <div className="flex flex-col items-center justify-between">
        <div className="text-center w-full">
          <div className="flex items-center justify-center mb-2">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center justify-center">
              <Sparkles className="h-6 w-6 mr-2 text-primary" /> 
              {displayName}
            </h1>
          </div>
          
          {/* Coordinates section with buttons moved below the title */}
          {latitude !== undefined && longitude !== undefined && (
            <div className="flex flex-col items-center justify-center text-xs text-muted-foreground/75 mt-2 space-y-2">
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
              </div>
              
              {/* Navigation buttons now placed below coordinates */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <NavigationButtons 
                  latitude={latitude}
                  longitude={longitude}
                  locationName={displayName}
                />
              </div>
            </div>
          )}
          
          {/* Show detailed location info if available */}
          {locationDetails && locationDetails !== displayName && (
            <div className="flex items-center justify-center text-muted-foreground mt-1">
              <MapPin className="h-4 w-4 mr-1.5" />
              <span>{locationDetails}</span>
            </div>
          )}
          
          <p className="text-muted-foreground mt-3">
            {t(
              "View detailed analysis and forecasts for astrophotography at this location.",
              "查看此地点的天文摄影详细分析和预报。"
            )}
          </p>
        </div>
      </div>
      
      {timestamp && (
        <p className="text-sm text-muted-foreground mt-3 text-center">
          {t("Last updated", "最后更新")}: {new Date(timestamp).toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default LocationDetailsHeader;
