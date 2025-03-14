import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import useDebounce from "@/hooks/useDebounce";
import { searchLocations, Location } from "@/services/geocoding";
import SearchResults from "./map/SearchResults";
import SearchInput from "./map/SearchInput";

interface MapSelectorProps {
  onSelectLocation: (location: Location) => void;
  children?: React.ReactNode;
}

// Priority search terms for immediate results
const PRIORITY_SEARCH_TERMS = ['ca', 'cal', 'cali', 'calif', 'new castle', 'newcastle', 'new york', 'ny', 'denmark'];

const MapSelector: React.FC<MapSelectorProps> = ({
  onSelectLocation,
  children
}) => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousSearchCache = useRef<{[key: string]: Location[]}>({});

  // Check if search term needs immediate results
  const isPrioritySearchTerm = useCallback((term: string): boolean => {
    const normalizedTerm = term.toLowerCase().trim();
    return PRIORITY_SEARCH_TERMS.includes(normalizedTerm) || 
           normalizedTerm.startsWith('califo') ||
           normalizedTerm.startsWith('new ca');
  }, []);

  // Effect for immediate search on priority terms
  useEffect(() => {
    if (searchTerm.length > 0) {
      const cacheKey = `${searchTerm.toLowerCase()}-${language}`;
      
      // Use cache if available for faster response
      if (previousSearchCache.current[cacheKey]) {
        setSearchResults(previousSearchCache.current[cacheKey]);
        setShowResults(true);
        return;
      }
      
      // For priority search terms, search immediately
      if (isPrioritySearchTerm(searchTerm)) {
        handleSearch(searchTerm);
      }
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, language, isPrioritySearchTerm]);

  // Normal debounced search effect for other terms
  useEffect(() => {
    if (debouncedSearchTerm.length > 0 && !isPrioritySearchTerm(debouncedSearchTerm)) {
      handleSearch(debouncedSearchTerm);
    } else if (debouncedSearchTerm.length === 0) {
      setSearchResults([]);
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, language, isPrioritySearchTerm]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    const cacheKey = `${query.toLowerCase()}-${language}`;
    if (previousSearchCache.current[cacheKey]) {
      setSearchResults(previousSearchCache.current[cacheKey]);
      setIsLoading(false);
      setShowResults(true);
      return;
    }
    
    try {
      const results = await searchLocations(query, language);
      
      // Store in cache for future quick access
      previousSearchCache.current[cacheKey] = results;
      
      // Keep cache size reasonable
      const cacheKeys = Object.keys(previousSearchCache.current);
      if (cacheKeys.length > 30) {
        delete previousSearchCache.current[cacheKeys[0]];
      }
      
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

  const handleSearchInputChange = (value: string) => {
    setSearchTerm(value);
    if (value.length > 0) {
      setShowResults(true);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowResults(false);
  };

  // Handle clicks outside the search component
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

  // Reset search results when language changes
  useEffect(() => {
    if (searchTerm.length > 0) {
      handleSearch(searchTerm);
    }
  }, [language]);

  if (children) {
    return (
      <div className="relative" ref={containerRef}>
        <div onClick={() => setShowResults(true)}>
          {children}
        </div>
        
        {showResults && (
          <div className="fixed md:absolute z-[9999] mt-1 w-96 max-w-[95vw] right-0 rounded-md bg-background/95 backdrop-blur-md border-2 border-primary/30 shadow-lg shadow-primary/20 overflow-hidden">
            <div className="p-3">
              <SearchInput
                searchTerm={searchTerm}
                setSearchTerm={handleSearchInputChange}
                isLoading={isLoading}
                clearSearch={clearSearch}
                autoFocus
              />
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

  return (
    <div className="relative w-full" ref={containerRef}>
      <SearchInput
        searchTerm={searchTerm}
        setSearchTerm={handleSearchInputChange}
        isLoading={isLoading}
        clearSearch={clearSearch}
      />

      {showResults && (
        <div className="fixed md:absolute z-[9999] mt-1 w-[calc(100vw-2rem)] md:w-full left-4 md:left-0 rounded-md bg-background border-2 border-primary/30 shadow-lg shadow-primary/20 overflow-hidden">
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
};

export default MapSelector;
