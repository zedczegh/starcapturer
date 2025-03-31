
import { useState, useEffect } from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";

/**
 * Hook to separate certified and calculated locations from a combined list
 */
export const useCertifiedLocations = (
  locations: SharedAstroSpot[],
  searchRadius: number
) => {
  const [certifiedLocations, setCertifiedLocations] = useState<SharedAstroSpot[]>([]);
  const [calculatedLocations, setCalculatedLocations] = useState<SharedAstroSpot[]>([]);
  const [certifiedCount, setCertifiedCount] = useState(0);
  const [calculatedCount, setCalculatedCount] = useState(0);
  
  useEffect(() => {
    if (!locations || locations.length === 0) {
      setCertifiedLocations([]);
      setCalculatedLocations([]);
      setCertifiedCount(0);
      setCalculatedCount(0);
      return;
    }
    
    // Process locations to separate certified and calculated
    const certified: SharedAstroSpot[] = [];
    const calculated: SharedAstroSpot[] = [];
    
    locations.forEach(location => {
      if (location.isDarkSkyReserve || location.certification) {
        certified.push(location);
      } else {
        calculated.push(location);
      }
    });
    
    setCertifiedLocations(certified);
    setCalculatedLocations(calculated);
    setCertifiedCount(certified.length);
    setCalculatedCount(calculated.length);
    
  }, [locations, searchRadius]);
  
  return {
    certifiedLocations,
    calculatedLocations,
    certifiedCount,
    calculatedCount
  };
};
