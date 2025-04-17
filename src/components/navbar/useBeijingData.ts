
import { useState, useEffect } from 'react';

/**
 * Hook to provide Beijing-related location data for the navbar
 */
export const useBeijingData = () => {
  const [beijingLocations, setBeijingLocations] = useState<any[]>([]);
  const [beijingNames, setBeijingNames] = useState<string[]>([]);

  useEffect(() => {
    // This could be expanded to fetch real Beijing location data
    // For now, we'll just provide some sample data
    const locations = [
      { 
        name: "Beijing Observatory", 
        latitude: 39.9042, 
        longitude: 116.4074 
      },
      { 
        name: "Beijing Planetarium", 
        latitude: 39.9411, 
        longitude: 116.3881 
      }
    ];
    
    setBeijingLocations(locations);
    setBeijingNames(locations.map(loc => loc.name));
  }, []);

  return { beijingLocations, beijingNames };
};
