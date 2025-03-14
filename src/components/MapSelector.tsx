
import React, { useState, useRef, useCallback, lazy, Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import useDebounce from "@/hooks/useDebounce";
import { Location } from "@/services/geocoding/types";
import SearchInput from "./map/SearchInput";
import { useLocationSearch } from "@/hooks/useLocationSearch";

// Lazy load the search results component to improve initial loading speed
const SearchResults = lazy(() => import("./map/SearchResults"));

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
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    searchResults,
    isLoading,
    handleSearch,
    clearSearch
  } = useLocationSearch(debouncedSearchTerm);

  const handleSelectLocation = useCallback((location: Location) => {
    onSelectLocation(location);
    setSearchTerm("");
    setShowResults(false);
  }, [onSelectLocation]);

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (value.length > 0) {
      setShowResults(true);
    }
  }, []);

  // Handle clicks outside the search component
  React.useEffect(() => {
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

  // Display error toast if search fails
  React.useEffect(() => {
    if (searchResults === null && debouncedSearchTerm) {
      toast.error(t("Search Error", "搜索错误"), {
        description: t("Could not search for this location. Please try again.", "无法搜索此位置，请重试。")
      });
    }
  }, [searchResults, debouncedSearchTerm, t]);

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
                searchResults={searchResults || []} 
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
              searchResults={searchResults || []} 
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
