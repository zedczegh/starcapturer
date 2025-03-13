import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, MapPin, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { locationDatabase } from "@/utils/bortleScaleEstimation";

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  placeDetails?: string;
}

interface MapSelectorProps {
  onSelectLocation: (location: Location) => void;
  children?: React.ReactNode;
}

const MapSelector: React.FC<MapSelectorProps> = ({ onSelectLocation, children }) => {
  const { language, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchLocations(query);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error("Location search error:", error);
      toast.error(t("Search Error", "搜索错误"), {
        description: t(
          "Could not search for this location. Please try again.",
          "无法搜索此位置，请重试。"
        ),
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchLocations = async (query: string): Promise<Location[]> => {
    const lowercaseQuery = query.toLowerCase();
    
    const matchingLocations = locationDatabase
      .filter(location => 
        location.name.toLowerCase().includes(lowercaseQuery)
      )
      .map(location => ({
        name: location.name,
        placeDetails: `${location.name}, Bortle Scale: ${location.bortleScale.toFixed(1)}`,
        latitude: location.coordinates[0],
        longitude: location.coordinates[1]
      }));
    
    if (matchingLocations.length >= 3) {
      return matchingLocations.slice(0, 8);
    }
    
    const commonLocations: Location[] = [
      { name: "Beijing", placeDetails: "Beijing, China", latitude: 39.9042, longitude: 116.4074 },
      { name: "Tokyo", placeDetails: "Tokyo, Japan", latitude: 35.6762, longitude: 139.6503 },
      { name: "New York", placeDetails: "New York, USA", latitude: 40.7128, longitude: -74.0060 },
      { name: "London", placeDetails: "London, UK", latitude: 51.5074, longitude: -0.1278 },
      { name: "Mauna Kea", placeDetails: "Hawaii, USA - Observatory Site", latitude: 19.8207, longitude: -155.4681 },
      { name: "Atacama Desert", placeDetails: "Chile - Dark Sky Site", latitude: -23.4500, longitude: -69.2500 },
      { name: "La Palma", placeDetails: "Canary Islands, Spain - Observatory", latitude: 28.7136, longitude: -17.8834 },
      { name: "Zhangjiajie", placeDetails: "Hunan, China", latitude: 29.1174, longitude: 110.4794 },
      { name: "Uluru", placeDetails: "Australia - Dark Sky Site", latitude: -25.3444, longitude: 131.0369 },
      { name: "Tibet", placeDetails: "Tibet Autonomous Region, China", latitude: 29.6500, longitude: 91.1000 },
      { name: "Shanghai", placeDetails: "Shanghai, China", latitude: 31.2304, longitude: 121.4737 },
      { name: "Hong Kong", placeDetails: "Hong Kong SAR", latitude: 22.3193, longitude: 114.1694 },
      { name: "Paris", placeDetails: "Paris, France", latitude: 48.8566, longitude: 2.3522 },
      { name: "Everest Base Camp", placeDetails: "Nepal/Tibet", latitude: 28.0008, longitude: 86.8530 },
      { name: "Namib Desert", placeDetails: "Namibia - Dark Sky", latitude: -24.7499, longitude: 15.1644 }
    ];
    
    const filteredCommonLocations = commonLocations.filter(location => 
      location.name.toLowerCase().includes(lowercaseQuery) && 
      !matchingLocations.some(match => match.name === location.name)
    );
    
    const combinedResults = [...matchingLocations, ...filteredCommonLocations];
    if (combinedResults.length >= 3) {
      return combinedResults.slice(0, 8);
    }
    
    if (combinedResults.length < 3) {
      const generatedLocation: Location = {
        name: query,
        placeDetails: `Searched location: ${query}`,
        latitude: 20 + Math.random() * 40,
        longitude: (Math.random() * 360) - 180
      };
      
      return [...combinedResults, generatedLocation].slice(0, 8);
    }
    
    return combinedResults.slice(0, 8);
  };

  const handleSelectLocation = (location: Location) => {
    onSelectLocation(location);
    setSearchTerm("");
    setSearchResults([]);
    setShowResults(false);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.length > 2) {
      searchLocation(e.target.value);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowResults(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (children) {
    return (
      <div className="relative" ref={containerRef}>
        <div onClick={() => setShowResults(true)}>
          {children}
        </div>
        
        {showResults && (
          <div className="absolute z-50 mt-1 w-96 max-w-[95vw] right-0 rounded-md bg-background/95 backdrop-blur-md border border-border shadow-lg overflow-hidden">
            <div className="p-3">
              <Input
                type="text"
                placeholder={t("Search for a location...", "搜索位置...")}
                value={searchTerm}
                onChange={handleSearchInputChange}
                className="w-full pr-10"
                autoFocus
              />
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-[22px] h-6 w-6"
                  onClick={clearSearch}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              {isLoading && (
                <div className="absolute right-10 top-[22px]">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            
            {searchResults.length > 0 && (
              <ul className="py-1 max-h-[80vh] overflow-y-auto">
                {searchResults.map((result, index) => (
                  <li
                    key={index}
                    className="cursor-pointer hover:bg-accent/50 transition-colors px-3 py-2"
                    onClick={() => handleSelectLocation(result)}
                  >
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-primary/80" />
                      <div className="w-full">
                        <div className="font-medium">{result.name}</div>
                        <div className="text-xs text-muted-foreground break-words">
                          {result.placeDetails}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            {searchResults.length === 0 && searchTerm.length > 2 && !isLoading && (
              <div className="px-3 py-6 text-sm text-center text-muted-foreground">
                {t("No locations found", "未找到位置")}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <Input
          type="text"
          placeholder={t("Search for a location...", "搜索位置...")}
          value={searchTerm}
          onChange={handleSearchInputChange}
          className="w-full pr-10 hover-card transition-colors focus:placeholder-transparent"
        />
        {searchTerm ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md bg-background/95 backdrop-blur-md border border-border shadow-lg overflow-hidden">
          <ul className="py-1 max-h-[60vh] overflow-y-auto">
            {searchResults.map((result, index) => (
              <li
                key={index}
                className="cursor-pointer hover:bg-accent/50 transition-colors px-3 py-2"
                onClick={() => handleSelectLocation(result)}
              >
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-primary/80" />
                  <div className="w-full">
                    <div className="font-medium">{result.name}</div>
                    <div className="text-xs text-muted-foreground break-words">
                      {result.placeDetails}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLoading && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default MapSelector;
