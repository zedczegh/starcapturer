
/**
 * This file contains the backup of the search functionality from the original homepage
 * It can be used as a reference if needed in the new homepage
 */

import { searchLocations } from '@/services/geocoding';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useCallback, useEffect } from 'react';
import { Location } from '@/services/geocoding/types';
import { saveLocation, SIQSLocation } from '@/utils/locationStorage';

export const useLocationSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<Location[]>([]);
  const { language } = useLanguage();
  
  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem('recent_location_searches');
      if (savedSearches) {
        const parsedSearches = JSON.parse(savedSearches);
        if (Array.isArray(parsedSearches)) {
          setRecentSearches(parsedSearches.slice(0, 5)); // Show max 5 recent searches
        }
      }
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  }, []);
  
  // Save a search to recent searches
  const saveToRecentSearches = useCallback((location: Location) => {
    try {
      // Add the new location to the start of the array and remove dupes
      const updatedSearches = [
        location,
        ...recentSearches.filter(item => 
          item.latitude !== location.latitude || 
          item.longitude !== location.longitude
        )
      ].slice(0, 5); // Keep only 5 most recent
      
      setRecentSearches(updatedSearches);
      localStorage.setItem('recent_location_searches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error("Error saving recent search:", error);
    }
  }, [recentSearches]);
  
  // Handle search input changes with debounce
  const debounceSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === "") {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchLocations(query, language);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [language]);
  
  // Handle location selection
  const handleLocationSelection = useCallback((location: Location) => {
    const siqsLocation: SIQSLocation = {
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude
    };
    
    saveLocation(siqsLocation);
    saveToRecentSearches(location);
    
    return siqsLocation;
  }, [saveToRecentSearches]);
  
  return {
    searchQuery,
    searchResults,
    isSearching,
    recentSearches,
    debounceSearch,
    handleLocationSelection
  };
};
