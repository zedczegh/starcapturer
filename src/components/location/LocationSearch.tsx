import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { searchLocations } from "@/services/geocoding";
import { Location } from "@/services/geocoding/types";
import { Loader2, MapPin } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchInput from "@/components/map/SearchInput";
import SearchResults from "@/components/map/SearchResults";
import { getCurrentPosition } from "@/utils/geolocationUtils";
import { Button } from "@/components/ui/button";
import { findClosestLocation } from "@/utils/locationDatabase";
import { getLocationInfo } from "@/utils/locationDatabase";

interface LocationSearchProps {
  onSelectLocation: (location: Location) => void;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ onSelectLocation }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { t, language } = useLanguage();

  // Effect to handle search with debounce
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const searchResults = await searchLocations(searchTerm, language);
        
        // Enhance results with Bortle scale information where available
        const enhancedResults = searchResults.map(location => {
          try {
            // Try to get more detailed location info from our internal database
            const locationInfo = getLocationInfo(location.latitude, location.longitude);
            
            if (locationInfo) {
              return {
                ...location,
                bortleScale: locationInfo.bortleScale,
                placeDetails: location.placeDetails || 
                  (locationInfo.bortleScale ? 
                    t(`Bortle Scale: ${locationInfo.bortleScale}`, `波尔特等级: ${locationInfo.bortleScale}`) : 
                    undefined)
              };
            }
            
            // If no specific location info, try to find the closest known location
            const closestLocation = findClosestLocation(location.latitude, location.longitude);
            if (closestLocation) {
              return {
                ...location,
                bortleScale: closestLocation.bortleScale,
                placeDetails: location.placeDetails || 
                  (closestLocation.bortleScale ? 
                    t(`Bortle Scale: ${closestLocation.bortleScale}`, `波尔特等级: ${closestLocation.bortleScale}`) : 
                    undefined)
              };
            }
          } catch (error) {
            console.error("Error enhancing location with bortle info:", error);
          }
          
          return location;
        });
        
        setResults(enhancedResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchTerm, language, t]);

  const handleSelectLocation = (location: Location) => {
    try {
      // Try to enhance the selected location with additional data
      const locationInfo = getLocationInfo(location.latitude, location.longitude);
      
      // Merge additional data if available
      if (locationInfo) {
        const enhancedLocation = {
          ...location,
          bortleScale: locationInfo.bortleScale,
          formattedName: locationInfo.formattedName
        };
        onSelectLocation(enhancedLocation);
        return;
      }
      
      // Otherwise pass the location as is
      onSelectLocation(location);
    } catch (error) {
      console.error("Error enhancing selected location:", error);
      onSelectLocation(location);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setResults([]);
  };

  const handleUseCurrentLocation = () => {
    setIsGettingLocation(true);
    
    getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Get enhanced location info for current position
          const locationInfo = getLocationInfo(latitude, longitude);
          
          // Create location object with enhanced data if available
          const location = {
            name: locationInfo ? locationInfo.name : t("Current Location", "当前位置"),
            latitude,
            longitude,
            bortleScale: locationInfo ? locationInfo.bortleScale : undefined
          };
          
          onSelectLocation(location);
        } catch (error) {
          console.error("Error getting location info:", error);
          
          // Fallback to basic location
          const location = {
            name: t("Current Location", "当前位置"),
            latitude,
            longitude
          };
          
          onSelectLocation(location);
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Error getting current location:", error);
        setIsGettingLocation(false);
      }
    );
  };

  return (
    <div className="space-y-4 py-4">
      <h2 className="text-lg font-semibold text-center mb-4">
        {t("Search for a Location", "搜索位置")}
      </h2>
      
      <SearchInput
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isLoading={isLoading}
        clearSearch={clearSearch}
        autoFocus={true}
      />
      
      <div className="min-h-[200px] mt-2 border rounded-md bg-background/50">
        <SearchResults
          searchResults={results}
          handleSelectLocation={handleSelectLocation}
          searchTerm={searchTerm}
          isLoading={isLoading}
        />
      </div>
      
      <div className="flex justify-center mt-4">
        <Button 
          onClick={handleUseCurrentLocation}
          disabled={isGettingLocation}
          variant="outline"
          className="w-full"
        >
          {isGettingLocation ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("Getting location...", "正在获取位置...")}
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              {t("Use current location", "使用当前位置")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default LocationSearch;
