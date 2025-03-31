
import { useState, useCallback, useEffect, useRef } from 'react';
import { searchLocations } from '@/services/geocoding';
import { useLanguage } from '@/contexts/LanguageContext';
import { containsChineseCharacters } from '@/services/geocoding/matching';
import { toast } from 'sonner';

/**
 * Enhanced hook for location search with improved Chinese and English support
 */
export const useLocationSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { language } = useLanguage();
  
  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem('recentLocationSearches');
      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches));
      }
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  }, []);
  
  // Save a new search to recent searches
  const saveRecentSearch = useCallback((location: any) => {
    setRecentSearches(prev => {
      // Remove duplicates and add to the front
      const newSearches = [
        location,
        ...prev.filter(item => 
          item.name !== location.name || 
          item.latitude !== location.latitude || 
          item.longitude !== location.longitude
        )
      ].slice(0, 10); // Keep only the 10 most recent
      
      // Save to localStorage
      try {
        localStorage.setItem('recentLocationSearches', JSON.stringify(newSearches));
      } catch (error) {
        console.error("Error saving recent searches:", error);
      }
      
      return newSearches;
    });
  }, []);
  
  // Perform the search with debounce
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Use the improved searchLocations function with language context
      const results = await searchLocations(query, language);
      
      // Sort results for better relevance
      const sortedResults = sortSearchResults(results, query, language);
      setSearchResults(sortedResults);
    } catch (error) {
      console.error("Error searching locations:", error);
      toast.error("Error searching for locations, please try again.");
    } finally {
      setIsSearching(false);
    }
  }, [language]);
  
  // Handle search term change with debounce
  const handleSearchTermChange = useCallback((newTerm: string) => {
    setSearchTerm(newTerm);
    
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      performSearch(newTerm);
    }, 300); // 300ms debounce
  }, [performSearch]);
  
  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  return {
    searchTerm,
    setSearchTerm: handleSearchTermChange,
    searchResults,
    isSearching,
    clearSearch,
    recentSearches,
    saveRecentSearch
  };
};

/**
 * Helper function to sort search results for better relevance
 */
function sortSearchResults(results: any[], query: string, language: string) {
  const hasChineseQuery = containsChineseCharacters(query);
  
  return [...results].sort((a, b) => {
    // For Chinese language or queries with Chinese characters
    if (language === 'zh' || hasChineseQuery) {
      const aHasChinese = containsChineseCharacters(a.name);
      const bHasChinese = containsChineseCharacters(b.name);
      
      // Prioritize results with Chinese characters if search is in Chinese
      if (aHasChinese && !bHasChinese) return -1;
      if (!aHasChinese && bHasChinese) return 1;
    }
    
    // Exact matches come first
    const aExactMatch = a.name.toLowerCase() === query.toLowerCase();
    const bExactMatch = b.name.toLowerCase() === query.toLowerCase();
    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;
    
    // Starts with query comes next
    const aStartsWith = a.name.toLowerCase().startsWith(query.toLowerCase());
    const bStartsWith = b.name.toLowerCase().startsWith(query.toLowerCase());
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    return 0;
  });
}
