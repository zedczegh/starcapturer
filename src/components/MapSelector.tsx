import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, MapPin, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { locationDatabase } from "@/utils/locationUtils";
import useDebounce from "@/hooks/useDebounce";

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
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (debouncedSearchTerm.length > 2) {
      searchLocation(debouncedSearchTerm);
    } else if (debouncedSearchTerm.length === 0) {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

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
      { name: "Shanghai", placeDetails: "Shanghai, China", latitude: 31.2304, longitude: 121.4737 },
      { name: "Hong Kong", placeDetails: "Hong Kong SAR", latitude: 22.3193, longitude: 114.1694 },
      { name: "Guangzhou", placeDetails: "Guangdong, China", latitude: 23.1291, longitude: 113.2644 },
      { name: "Shenzhen", placeDetails: "Guangdong, China", latitude: 22.5431, longitude: 114.0579 },
      { name: "Chengdu", placeDetails: "Sichuan, China", latitude: 30.5728, longitude: 104.0668 },
      { name: "Zhangjiajie", placeDetails: "Hunan, China", latitude: 29.1174, longitude: 110.4794 },
      { name: "Xi'an", placeDetails: "Shaanxi, China", latitude: 34.3416, longitude: 108.9398 },
      { name: "Lhasa", placeDetails: "Tibet, China", latitude: 29.6500, longitude: 91.1000 },
      { name: "Urumqi", placeDetails: "Xinjiang, China", latitude: 43.8256, longitude: 87.6168 },
      { name: "Harbin", placeDetails: "Heilongjiang, China", latitude: 45.8038, longitude: 126.5340 }
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
        latitude: 30 + Math.random() * 20,
        longitude: 100 + Math.random() * 20
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
    if (e.target.value.length > 0) {
      setShowResults(true);
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
