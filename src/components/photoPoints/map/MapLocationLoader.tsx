
import React, { useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getAllStoredLocations } from '@/services/calculatedLocationsService';

interface MapLocationLoaderProps {
  activeView: 'certified' | 'calculated';
  calculatedLocations: SharedAstroSpot[];
  certifiedLocations: SharedAstroSpot[];
  onLocationsProcessed: (locations: SharedAstroSpot[]) => void;
  onLoadingPhaseChange: (phase: 'processing' | 'ready') => void;
  onLocationStatsUpdate: (certifiedCount: number, calculatedCount: number) => void;
}

/**
 * Component responsible for loading and processing location data for the map
 */
const MapLocationLoader: React.FC<MapLocationLoaderProps> = ({
  activeView,
  calculatedLocations,
  certifiedLocations,
  onLocationsProcessed,
  onLoadingPhaseChange,
  onLocationStatsUpdate
}) => {
  // Update certified location stats
  useEffect(() => {
    if (certifiedLocations.length > 0) {
      onLocationStatsUpdate(certifiedLocations.length, 0);
      console.log(`Loaded ${certifiedLocations.length} certified locations`);
    }
  }, [certifiedLocations, onLocationStatsUpdate]);

  // Log calculated locations
  useEffect(() => {
    if (calculatedLocations.length > 0) {
      console.log(`Received ${calculatedLocations.length} calculated locations to process`);
    }
  }, [calculatedLocations]);

  // Combine calculated locations with stored locations
  useEffect(() => {
    if (activeView === 'calculated') {
      const storedLocations = getAllStoredLocations();
      
      onLoadingPhaseChange('processing');
      
      const locMap = new Map<string, SharedAstroSpot>();
      
      calculatedLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locMap.set(key, loc);
        }
      });
      
      storedLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          if (!locMap.has(key)) {
            locMap.set(key, loc);
          }
        }
      });
      
      const combined = Array.from(locMap.values());
      onLocationsProcessed(combined);
      onLocationStatsUpdate(0, combined.length);
      
      console.log(`Combined ${calculatedLocations.length} current locations with ${storedLocations.length} stored locations for a total of ${combined.length} unique locations`);
      
      setTimeout(() => {
        onLoadingPhaseChange('ready');
      }, 500);
    }
  }, [calculatedLocations, activeView, onLocationsProcessed, onLoadingPhaseChange, onLocationStatsUpdate]);

  return null;
};

export default MapLocationLoader;
