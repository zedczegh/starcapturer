
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import useDebounce from "@/hooks/useDebounce";
import { searchLocations } from "@/services/geocoding";
import SearchResults from "./map/SearchResults";

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

const MapSelector: React.FC<MapSelectorProps> = ({
  onSelectLocation,
  children
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedSearchTerm.length > 2) {
      handleSearch(debouncedSearchTerm);
    } else if (debouncedSearchTerm.length === 0) {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

  const handleSearch = async (query: string) => {
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
        description: t("Could not search for this location. Please try again.", "无法搜索此位置，请重试。")
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
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
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Child mode (triggered through another component)
  if (children) {
    return (
      <div className="relative" ref={containerRef}>
        <div onClick={() => setShowResults(true)}>
          {children}
        </div>
        
        {showResults && (
          <div className="fixed md:absolute z-[200] mt-1 w-96 max-w-[95vw] right-0 rounded-md bg-background/95 backdrop-blur-md border-2 border-primary/30 shadow-lg shadow-primary/20 overflow-hidden">
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
            
            <SearchResults 
              searchResults={searchResults} 
              handleSelectLocation={handleSelectLocation} 
              searchTerm={searchTerm} 
              isLoading={isLoading} 
            />
          </div>
        )}
      </div>
    );
  }

  // Standalone mode
  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <Input 
          type="text" 
          placeholder={t("Search for a location...", "搜索位置...")} 
          value={searchTerm} 
          onChange={handleSearchInputChange} 
          className="w-full pr-10 hover-card transition-colors focus:placeholder-transparent rounded-lg bg-slate-800" 
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

      {showResults && (
        <div className="fixed md:absolute z-[200] mt-1 w-[calc(100vw-2rem)] md:w-full left-4 md:left-0 rounded-md bg-background border-2 border-primary/30 shadow-lg shadow-primary/20 overflow-hidden">
          <SearchResults 
            searchResults={searchResults} 
            handleSelectLocation={handleSelectLocation} 
            searchTerm={searchTerm} 
            isLoading={isLoading} 
          />
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
