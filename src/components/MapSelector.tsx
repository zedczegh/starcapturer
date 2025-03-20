
import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import useDebounce from "@/hooks/useDebounce";
import { searchLocations, Location } from "@/services/geocoding";
import { searchCache } from "@/services/caching/searchCache";
import SearchInput from "./map/SearchInput";

// Lazy load the search results component to improve initial loading speed
const SearchResults = lazy(() => import("./map/SearchResults"));

// Priority search terms that should trigger immediate search
const PRIORITY_SEARCH_TERMS = ['ca', 'cal', 'cali', 'calif', 'new castle', 'newcastle', 'new york', 'ny', 'denmark'];

interface MapSelectorProps {
  onSelectLocation: (location: Location) => void;
  children?: React.ReactNode;
}

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
  
  // Use memo to avoid recreating this function on every render
  const isPrioritySearchTerm = useMemo(() => {
    return (term: string): boolean => {
      const normalizedTerm = term.toLowerCase().trim();
      return PRIORITY_SEARCH_TERMS.includes(normalizedTerm) || 
             normalizedTerm.startsWith('califo') ||
             normalizedTerm.startsWith('new ca');
    };
  }, []);

  // Effect for immediate search on priority terms
  useEffect(() => {
    if (searchTerm.length > 0) {
      // Try cache first for fast response
      const cachedResults = searchCache.getCachedResults(searchTerm.toLowerCase(), language);
      
      if (cachedResults && cachedResults.length > 0) {
        setSearchResults(cachedResults);
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
    
    // Check cache first
    const cachedResults = searchCache.getCachedResults(query.toLowerCase(), language);
    if (cachedResults && cachedResults.length > 0) {
      setSearchResults(cachedResults);
      setIsLoading(false);
      setShowResults(true);
      return;
    }
    
    try {
      const results = await searchLocations(query, language);
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

  const handleSelectLocation = useCallback((location: Location) => {
    onSelectLocation(location);
    setSearchTerm("");
    setSearchResults([]);
    setShowResults(false);
  }, [onSelectLocation]);

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (value.length > 0) {
      setShowResults(true);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setSearchResults([]);
    setShowResults(false);
  }, []);

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
            
            <Suspense fallback={<div className="p-6 text-center">Loading results...</div>}>
              <SearchResults 
                searchResults={searchResults} 
                handleSelectLocation={handleSelectLocation} 
                searchTerm={searchTerm} 
                isLoading={isLoading} 
              />
            </Suspense>
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
        onFocus={() => setShowResults(true)}
      />

      {showResults && (
        <div className="fixed md:absolute z-[9999] mt-1 w-[calc(100vw-2rem)] md:w-full left-4 md:left-0 rounded-md bg-background border-2 border-primary/30 shadow-lg shadow-primary/20 overflow-hidden">
          <Suspense fallback={<div className="p-6 text-center">Loading results...</div>}>
            <SearchResults 
              searchResults={searchResults} 
              handleSelectLocation={handleSelectLocation} 
              searchTerm={searchTerm} 
              isLoading={isLoading} 
            />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default MapSelector;
