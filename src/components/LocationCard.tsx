
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
import { formatLocationName } from "@/utils/locationNameFormatter";
import LightPollutionIndicator from "./location/LightPollutionIndicator";

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
}

const LocationCard: React.FC<LocationCardProps> = ({
  id,
  name,
  latitude,
  longitude,
  siqs,
  isViable,
  timestamp,
  className,
  bortleScale = 5,
}) => {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  
  const formattedDate = new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  
  const formattedTime = new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  
  const scoreColor = siqsToColor(siqs);

  // Format name more nicely
  let displayName = formatLocationName(name, language as any);
  
  // Check if the name contains coordinates or is a remote area
  if (
    displayName === "Remote area" || 
    displayName === "偏远地区" || 
    displayName.includes("°") || 
    displayName.includes("Location at") || 
    displayName.includes("位置在")
  ) {
    // Use a generic name for calculated locations
    const locationMatch = displayName.match(/calc-loc-(\d+)/);
    if (locationMatch) {
      const locationNumber = parseInt(locationMatch[1]) || 1;
      displayName = language === 'en' 
        ? `Potential ideal dark site ${locationNumber}`
        : `潜在理想暗夜地点 ${locationNumber}`;
    }
  }
  
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
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold">{siqs.toFixed(1)}</span>
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg line-clamp-1">{displayName}</h3>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                <span>
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
                  <Star className="h-3 w-3 mr-1" />
                  {t("Viable", "可行")}
                </span>
              ) : (
                t("Not Viable", "不可行")
              )}
            </Badge>
          </div>
          
          {/* Light pollution indicator with improved visibility */}
          <div className="mt-3">
            <LightPollutionIndicator 
              bortleScale={bortleScale} 
              size="sm" 
              showBortleNumber={true}
              compact={false} 
            />
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
          <div className="flex items-center">
            <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
            <span>{formattedDate} at {formattedTime}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default LocationCard;
