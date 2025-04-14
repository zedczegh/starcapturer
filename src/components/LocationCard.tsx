
import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { siqsToColor } from "@/lib/siqs/utils";
import { CalendarClock, MapPin, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { prefetchSIQSDetails } from "@/lib/queryPrefetcher";
import LightPollutionIndicator from "./location/LightPollutionIndicator";
import { useDisplayName } from "./photoPoints/cards/DisplayNameResolver";

interface LocationCardProps {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  siqs: number;
  isViable: boolean;
  timestamp: string;
  className?: string;
  bortleScale?: number;
  certification?: string;
  category?: string;
  chineseName?: string;
}

const LocationCard: React.FC<LocationCardProps> = ({
  id,
  name,
  chineseName,
  latitude,
  longitude,
  siqs,
  isViable,
  timestamp,
  className,
  bortleScale = 5,
  certification,
  category
}) => {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  
  // Format date and time for display
  const formattedDate = new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  
  const formattedTime = new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  
  // Get the color for the SIQS score
  const scoreColor = siqsToColor(siqs);
  
  // Create a location object that fully matches SharedAstroSpot interface
  const locationObj = {
    id,  // Add the id from props
    name,
    chineseName,
    latitude,
    longitude,
    bortleScale, // Add the bortleScale from props
    certification,
    timestamp,  // Add the timestamp from props
  };

  // Use the shared display name resolver
  const { displayName, showOriginalName } = useDisplayName({
    location: locationObj,
    language,
    locationCounter: null
  });
  
  // Prefetch data when user hovers over the card
  const handleMouseEnter = useCallback(() => {
    prefetchSIQSDetails(queryClient, latitude, longitude);
  }, [latitude, longitude, queryClient]);
  
  // Create a link with both the ID and the state to ensure consistent navigation
  return (
    <Link 
      to={`/location/${id}`}
      onMouseEnter={handleMouseEnter}
      state={{
        id,
        name,
        chineseName,
        latitude,
        longitude,
        timestamp
      }}
      data-testid="location-card"
    >
      <Card 
        className={cn(
          "h-full overflow-hidden transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg", 
          className
        )}
      >
        <div 
          className="h-24 bg-cosmic-800 flex items-center justify-center relative"
          style={{
            background: "linear-gradient(135deg, rgba(16,18,64,1) 0%, rgba(36,42,107,1) 100%)"
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "url('/images/stars.png')",
              backgroundSize: "cover",
            }}
          />
          
          <div className="relative z-10 flex items-center justify-center">
            <div 
              className="rounded-full p-3 flex items-center justify-center" 
              style={{ backgroundColor: scoreColor, opacity: 0.2 }}
            >
              <div 
                className="rounded-full p-6 flex items-center justify-center"
                style={{ backgroundColor: scoreColor, opacity: 0.4 }}
              />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{siqs.toFixed(1)}</span>
              
              {/* Category moved below the SIQS score */}
              {certification && (
                <span className="text-xs mt-1.5 px-2.5 py-0.5 bg-indigo-600/80 rounded-full text-white font-medium">
                  {certification}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg line-clamp-1">{displayName}</h3>
              
              {/* Show original name if different from the nearest town name */}
              {showOriginalName && (
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  <span>
                    {language === 'en' ? name : (chineseName || name)}
                  </span>
                </div>
              )}
              
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 mr-1.5" />
                <span className="font-medium">
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </span>
              </div>
            </div>
            <Badge 
              className="ml-2" 
              variant={isViable ? "default" : "destructive"}
            >
              {isViable ? (
                <span className="flex items-center">
                  <Star className="h-3.5 w-3.5 mr-1.5" />
                  {t("Viable", "可行")}
                </span>
              ) : (
                t("Not Viable", "不可行")
              )}
            </Badge>
          </div>
          
          {/* Bortle scale indicator with improved visibility */}
          <div className="mt-4">
            <LightPollutionIndicator 
              bortleScale={bortleScale} 
              size="md"
              showBortleNumber={true}
              className="text-base"
            />
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 text-sm text-muted-foreground">
          <div className="flex items-center">
            <CalendarClock className="h-4 w-4 mr-2" />
            <span className="font-medium">{formattedDate} at {formattedTime}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default LocationCard;
