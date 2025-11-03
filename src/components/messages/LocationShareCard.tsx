
import React, { useEffect, useState } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Navigation, Star, ExternalLink, Telescope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSIQSScore } from "@/utils/mapUtils";
import { useNavigate } from "react-router-dom";
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';
import { supabase } from '@/integrations/supabase/client';
import { fetchFromSupabase } from '@/utils/supabaseFetch';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RealTimeSiqsProvider from '@/components/photoPoints/cards/RealTimeSiqsProvider';
import SiqsScoreBadge from '@/components/photoPoints/cards/SiqsScoreBadge';
import useCreatorProfile from '@/hooks/astro-spots/useCreatorProfile';

interface LocationShareCardProps {
  id?: string;
  name: string;
  latitude?: number;
  longitude?: number;
  siqs?: number | { score: number; isViable: boolean } | undefined;
  timestamp: string;
  isCertified?: boolean;
  spotId?: string;
  isAstroSpot?: boolean;
  fromLink?: boolean;
  userId?: string;
}

const LocationShareCard: React.FC<LocationShareCardProps> = ({
  id,
  name,
  latitude,
  longitude,
  siqs,
  timestamp,
  isCertified = false,
  spotId,
  isAstroSpot = false,
  fromLink = false,
  userId
}) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [locationName, setLocationName] = useState(name);
  const [isLoading, setIsLoading] = useState(false);
  const [spotData, setSpotData] = useState<any>(null);
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [isLoadingSiqs, setIsLoadingSiqs] = useState(false);
  
  // Get creator profile for AstroSpots
  const { creatorProfile } = useCreatorProfile(isAstroSpot ? (spotData?.user_id || userId) : undefined);
  
  // Format SIQS score for display
  const formattedSiqs = formatSIQSScore(siqs);

  // Fetch AstroSpot details if we have a spotId
  useEffect(() => {
    const fetchAstroSpotDetails = async () => {
      if (!spotId) return;
      
      setIsLoading(true);
      try {
        const spotDetails = await fetchFromSupabase(
          'user_astro_spots', // Changed from 'astro_spots' to 'user_astro_spots'
          (query) => query
            .select('id, name, latitude, longitude, siqs, created_at, user_id')
            .eq('id', spotId)
            .single(),
          { skipCache: fromLink } // Skip cache if this came from a link
        );
        
        if (spotDetails) {
          setSpotData(spotDetails);
          setLocationName(spotDetails.name);
        }
      } catch (error) {
        console.error("Error fetching astro spot details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAstroSpot && spotId) {
      fetchAstroSpotDetails();
    }
  }, [spotId, isAstroSpot, fromLink]);
  
  // Use reverse geocoding to get better location name for regular locations
  useEffect(() => {
    const fetchLocationName = async () => {
      if (!latitude || !longitude) return;
      
      setIsLoading(true);
      try {
        const details = await getEnhancedLocationDetails(
          latitude, 
          longitude, 
          language === 'zh' ? 'zh' : 'en'
        );
        
        if (details && details.formattedName && 
            !details.formattedName.includes("°") && 
            details.formattedName !== name) {
          setLocationName(details.formattedName);
        }
      } catch (error) {
        console.error("Error fetching location name:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch if we have coordinates and the name looks like a default one
    if (latitude && longitude && 
        !isAstroSpot &&
        (name === t("Shared Location", "共享位置") || 
         name.includes("°") || 
         name.includes("Location"))) {
      fetchLocationName();
    }
  }, [latitude, longitude, name, language, t, isAstroSpot]);

  const handleViewDetails = () => {
    if (isAstroSpot && spotId) {
      navigate(`/astro-spot/${spotId}`, {
        state: {
          id: spotId,
          fromMessage: true
        }
      });
    } else if (latitude && longitude) {
      navigate(`/location/${latitude.toFixed(6)},${longitude.toFixed(6)}`, {
        state: {
          id: id || `loc-${latitude.toFixed(6)}-${longitude.toFixed(6)}`,
          name: locationName,
          latitude,
          longitude,
          // Ensure isViable is always defined if siqs is an object
          siqs: typeof siqs === 'number' 
            ? { score: siqs, isViable: siqs >= 5.0 } 
            : siqs ? { ...siqs, isViable: siqs.isViable ?? (siqs.score >= 5.0) } : undefined,
          timestamp,
          fromMessage: true
        }
      });
    }
  };

  // If we're showing an AstroSpot and have spot data, use that data
  const displayLatitude = spotData?.latitude || latitude;
  const displayLongitude = spotData?.longitude || longitude;
  const displaySiqs = realTimeSiqs || spotData?.siqs || siqs;

  // Handle SIQS calculation result
  const handleSiqsCalculated = (siqs: number | null, loading: boolean) => {
    setRealTimeSiqs(siqs);
    setIsLoadingSiqs(loading);
  };

  return (
    <div className="bg-slate-900/70 backdrop-blur-md border border-cosmic-700/50 hover:border-cosmic-600/70 transition-colors duration-300 p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isAstroSpot && (
            <Avatar className="h-7 w-7 border border-cosmic-700/50">
              <AvatarImage src={creatorProfile?.avatar_url} />
              <AvatarFallback className="bg-primary/20 text-primary-foreground text-xs">
                {creatorProfile?.username?.substring(0, 2) || '?'}
              </AvatarFallback>
            </Avatar>
          )}
          <h3 className="text-lg font-semibold text-gray-50">
            {isLoading ? (
              <span className="inline-flex items-center">
                <span className="h-4 w-4 mr-2 rounded-full border-2 border-primary border-t-transparent animate-spin"></span>
                {locationName}
              </span>
            ) : (
              locationName
            )}
          </h3>
        </div>
        {displaySiqs && (
          <div className="flex items-center">
            <SiqsScoreBadge 
              score={displaySiqs} 
              loading={isLoadingSiqs} 
              isCertified={isCertified}
            />
          </div>
        )}
      </div>
      
      <div className="space-y-2 text-sm text-gray-400">
        {displayLatitude && displayLongitude && (
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-cosmic-400" />
            <span>{t("Latitude", "纬度")}: {displayLatitude.toFixed(4)}, {t("Longitude", "经度")}: {displayLongitude.toFixed(4)}</span>
          </div>
        )}
        
        <div className="flex items-center">
          {isAstroSpot ? (
            <Telescope className="h-4 w-4 mr-2 text-cosmic-400" />
          ) : (
            <Navigation className="h-4 w-4 mr-2 text-cosmic-400" />
          )}
          <span>
            {isAstroSpot ? 
              t("Shared AstroSpot", "共享观星点") : 
              t("Shared Location", "共享位置")}
          </span>
        </div>
      </div>
      
      <div className="mt-3 flex justify-end">
        <Button
          variant={isAstroSpot ? "secondary" : "outline"}
          size="sm"
          onClick={handleViewDetails}
          className={`flex items-center gap-1.5 text-xs ${isAstroSpot ? "bg-primary/80 text-primary-foreground hover:bg-primary/70" : ""}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {isAstroSpot ? 
            t("View AstroSpot", "查看观星点") : 
            t("View Details", "查看详情")}
        </Button>
      </div>

      {/* Real-time SIQS Provider (invisible component) */}
      {(displayLatitude && displayLongitude) && (
        <RealTimeSiqsProvider
          latitude={displayLatitude}
          longitude={displayLongitude}
          isVisible={true}
          onSiqsCalculated={handleSiqsCalculated}
          existingSiqs={spotData?.siqs || siqs}
          isCertified={isCertified}
          priorityLevel="medium"
        />
      )}
    </div>
  );
};

export default LocationShareCard;
