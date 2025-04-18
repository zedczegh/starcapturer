import React, { useEffect, useCallback, useRef, useState } from 'react';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';
import { fetchForecastData } from '@/lib/api';
import { calculateTonightCloudCover } from '@/utils/nighttimeSIQS';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import L from 'leaflet'; // Add this import for the Leaflet namespace

interface SiqsEffectsControllerProps {
  userLocation: { latitude: number; longitude: number } | null;
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  onSiqsCalculated?: (siqs: number) => void;
  onSpotsGenerated?: (spots: SharedAstroSpot[]) => void;
  disabled?: boolean;
  mapInstance?: L.Map | null; // Accept map instance as prop rather than using useMap()
}

// Store generated spots globally to persist between renders
const generatedSpotsCache = new Map<string, SharedAstroSpot[]>();

const SiqsEffectsController: React.FC<SiqsEffectsControllerProps> = ({
  userLocation,
  activeView,
  searchRadius,
  onSiqsCalculated,
  onSpotsGenerated,
  disabled = false,
  mapInstance
}) => {
  const lastLocationRef = useRef<string | null>(null);
  const [isGeneratingSpots, setIsGeneratingSpots] = useState(false);
  
  const calculateSiqsForLocation = useCallback(async (latitude: number, longitude: number) => {
    try {
      // Use our cloud cover based SIQS calculation
      const result = await calculateRealTimeSiqs(latitude, longitude, 4);
      
      if (result && typeof result.score === 'number') {
        console.log(`Map effects: calculated cloud cover-based SIQS ${result.score.toFixed(1)} for [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);
        if (onSiqsCalculated) {
          onSiqsCalculated(result.score);
        }
        return result.score;
      }
    } catch (error) {
      console.error("Error calculating SIQS in map effects:", error);
    }
    return null;
  }, [onSiqsCalculated]);
  
  const generateCalculatedSpots = useCallback(async (
    latitude: number, 
    longitude: number, 
    radius: number
  ): Promise<SharedAstroSpot[]> => {
    if (isGeneratingSpots) return [];
    
    // Create a unique key for this location
    const locationKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}_${radius}`;
    
    // Check if we already have spots for this location
    if (generatedSpotsCache.has(locationKey)) {
      const cachedSpots = generatedSpotsCache.get(locationKey) || [];
      console.log(`Using ${cachedSpots.length} cached spots for location ${locationKey}`);
      return cachedSpots;
    }
    
    setIsGeneratingSpots(true);
    console.log(`Generating calculated spots around [${latitude}, ${longitude}] with radius ${radius}km`);
    
    try {
      // Limit number of spots to avoid excessive API calls
      const numPoints = Math.min(10, Math.floor(radius / 20));
      const spots: SharedAstroSpot[] = [];
      
      // Generate points in a grid pattern
      for (let i = 0; i < numPoints; i++) {
        // Skip excessive generation
        if (spots.length >= 8) break;
        
        // Calculate position in a spiral pattern around center
        const angle = (i / numPoints) * Math.PI * 2;
        const distance = (radius * 0.5) * (i / numPoints);
        
        // Convert to lat/lng offset (approximate)
        const latOffset = distance * 0.009 * Math.sin(angle);
        const lngOffset = distance * 0.009 * Math.cos(angle);
        
        const spotLat = latitude + latOffset;
        const spotLng = longitude + lngOffset;
        
        // Calculate SIQS score for this location
        const siqs = await calculateRealTimeSiqs(spotLat, spotLng, 4);
        
        // Only include high quality spots (SIQS >= 5.0)
        if (siqs && siqs.score >= 5.0) {
          const newSpot: SharedAstroSpot = {
            id: `gen-${spotLat.toFixed(6)}-${spotLng.toFixed(6)}`,
            name: `Spot near ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
            latitude: spotLat,
            longitude: spotLng,
            bortleScale: 4, // Default bortle scale
            siqs: siqs.score,
            siqsResult: siqs,
            distance: distance,
            timestamp: new Date().toISOString() // Add required timestamp
          };
          spots.push(newSpot);
        }
        
        // Pause between API calls to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`Generated ${spots.length} calculated spots with SIQS >= 5.0`);
      
      // Store spots in cache for future use
      generatedSpotsCache.set(locationKey, spots);
      
      return spots;
    } catch (error) {
      console.error("Error generating calculated spots:", error);
      return [];
    } finally {
      setIsGeneratingSpots(false);
    }
  }, [isGeneratingSpots, calculateSiqsForLocation]);
  
  useEffect(() => {
    if (disabled || !userLocation) return;
    
    // Generate a unique identifier for this location
    const locationId = `${userLocation.latitude.toFixed(4)},${userLocation.longitude.toFixed(4)}`;
    
    // Skip if location hasn't changed
    if (locationId === lastLocationRef.current) {
      return;
    }
    
    lastLocationRef.current = locationId;
    
    // Always calculate SIQS for user location
    const applyMapEffects = async () => {
      try {
        if (userLocation) {
          await calculateSiqsForLocation(userLocation.latitude, userLocation.longitude);
        }
        
        // Generate points around user for calculated view
        if (activeView === 'calculated' && searchRadius > 0 && userLocation) {
          // Generate or retrieve cached spots
          const spots = await generateCalculatedSpots(
            userLocation.latitude,
            userLocation.longitude,
            searchRadius
          );
          
          // Pass spots to parent component if callback provided
          if (onSpotsGenerated && spots.length > 0) {
            onSpotsGenerated(spots);
          }
        }
      } catch (error) {
        console.error("Error applying map effects:", error);
      }
    };
    
    applyMapEffects();
  }, [userLocation, activeView, searchRadius, calculateSiqsForLocation, generateCalculatedSpots, onSpotsGenerated, disabled]);
  
  return null;
};

export default SiqsEffectsController;
