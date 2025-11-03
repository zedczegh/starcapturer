
import { useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

export function useLocationsPersistence(
  locations: SharedAstroSpot[],
  activeView: 'certified' | 'calculated' | 'obscura'
) {
  useEffect(() => {
    if (locations && locations.length > 0) {
      try {
        const storageKey = activeView === 'certified' ? 
          'persistent_certified_locations' : 
          activeView === 'obscura' ?
          'persistent_obscura_locations' :
          'persistent_calculated_locations';
        
        const existingData = sessionStorage.getItem(storageKey);
        
        const simplifiedLocations = locations.map(loc => ({
          id: loc.id || `loc-${loc.latitude?.toFixed(6)}-${loc.longitude?.toFixed(6)}`,
          name: loc.name || 'Unknown Location',
          latitude: loc.latitude,
          longitude: loc.longitude,
          siqs: loc.siqs,
          isDarkSkyReserve: loc.isDarkSkyReserve,
          certification: loc.certification,
          distance: loc.distance
        }));
        
        let combinedLocations = simplifiedLocations;
        
        if (existingData) {
          try {
            const existingLocations = JSON.parse(existingData);
            const locationMap = new Map();
            
            if (Array.isArray(existingLocations)) {
              existingLocations.forEach(loc => {
                if (loc?.latitude && loc?.longitude) {
                  const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
                  locationMap.set(key, loc);
                }
              });
            }
            
            simplifiedLocations.forEach(loc => {
              if (loc?.latitude && loc?.longitude) {
                const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
                locationMap.set(key, loc);
              }
            });
            
            combinedLocations = Array.from(locationMap.values());
          } catch (err) {
            console.error('Error parsing existing locations:', err);
          }
        }
        
        sessionStorage.setItem(storageKey, JSON.stringify(combinedLocations));
        console.log(`Stored ${combinedLocations.length} ${activeView} locations to session storage`);
      } catch (err) {
        console.error('Error storing locations in session storage:', err);
      }
    }
  }, [locations, activeView]);
}
