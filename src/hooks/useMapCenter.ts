
import { useState, useEffect } from 'react';

interface UseMapCenterOptions {
  defaultCenter?: [number, number];
  persistKey?: string;
}

export const useMapCenter = (options: UseMapCenterOptions = {}) => {
  const { defaultCenter = [35.8617, 104.1954], persistKey = 'lastMapCenter' } = options;
  
  // Load last center from storage if available
  const loadSavedCenter = (): [number, number] => {
    try {
      const savedCenter = localStorage.getItem(persistKey);
      if (savedCenter) {
        const [lat, lng] = JSON.parse(savedCenter);
        if (typeof lat === 'number' && typeof lng === 'number') {
          return [lat, lng];
        }
      }
    } catch (e) {
      console.error('Error loading saved map center:', e);
    }
    return defaultCenter;
  };
  
  const [center, setCenter] = useState<[number, number]>(loadSavedCenter());
  
  // Update center and save to storage
  const updateCenter = (newCenter: [number, number]) => {
    setCenter(newCenter);
    try {
      localStorage.setItem(persistKey, JSON.stringify(newCenter));
    } catch (e) {
      console.error('Error saving map center:', e);
    }
  };
  
  return {
    center,
    setCenter: updateCenter
  };
};

export default useMapCenter;
