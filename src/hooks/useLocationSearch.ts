
import { useState, useEffect, useCallback } from "react";
import { searchLocations, Location } from "@/services/geocoding";
import { searchCache } from "@/services/caching/searchCache";
import { useLanguage } from "@/contexts/LanguageContext";

// Priority search terms that should trigger immediate search
const PRIORITY_SEARCH_TERMS = ['ca', 'cal', 'cali', 'calif', 'new castle', 'newcastle', 'new york', 'ny', 'denmark'];

/**
 * Custom hook for handling location search functionality
 * @param debouncedSearchTerm The search term after debounce
 */
export function useLocationSearch(debouncedSearchTerm: string) {
  const { language } = useLanguage();
  const [searchResults, setSearchResults] = useState<Location[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isPrioritySearchTerm = useCallback((term: string): boolean => {
    const normalizedTerm = term.toLowerCase().trim();
    return PRIORITY_SEARCH_TERMS.includes(normalizedTerm) || 
           normalizedTerm.startsWith('califo') ||
           normalizedTerm.startsWith('new ca');
  }, []);

  // Handle search execution
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    // Check cache first for instant results
    const cachedResults = searchCache.getCachedResults(query.toLowerCase(), language);
    if (cachedResults && cachedResults.length > 0) {
      setSearchResults(cachedResults);
      setIsLoading(false);
      return;
    }
    
    try {
      const results = await searchLocations(query, language);
      setSearchResults(results);
    } catch (error) {
      console.error("Location search error:", error);
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  // Clear search and results
  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setIsLoading(false);
  }, []);

  // Effect for priority terms - search immediately
  useEffect(() => {
    if (debouncedSearchTerm && isPrioritySearchTerm(debouncedSearchTerm)) {
      handleSearch(debouncedSearchTerm);
    } else if (debouncedSearchTerm) {
      handleSearch(debouncedSearchTerm);
    } else {
      clearSearch();
    }
  }, [debouncedSearchTerm, isPrioritySearchTerm, handleSearch, clearSearch]);

  // Effect for language changes - refresh results if needed
  useEffect(() => {
    if (debouncedSearchTerm) {
      handleSearch(debouncedSearchTerm);
    }
  }, [language, debouncedSearchTerm, handleSearch]);

  return {
    searchResults,
    isLoading,
    handleSearch,
    clearSearch
  };
}
