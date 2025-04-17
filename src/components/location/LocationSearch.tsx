
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
        setResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchTerm, language]);

  const handleSelectLocation = (location: Location) => {
    onSelectLocation(location);
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
        
        // Create a minimal location object
        const location = {
          name: t("Current Location", "当前位置"),
          latitude,
          longitude
        };
        
        onSelectLocation(location);
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
