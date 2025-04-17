
import { useCallback } from 'react';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';

interface UseLocationSIQSUpdaterResult {
  updateSIQS: () => Promise<void>;
  resetUpdateState: () => void;
}

/**
 * Hook to manage updating SIQS data for a location
 */
export function useLocationSIQSUpdater(
  locationData: any,
  forecastData: any,
  setLocationData: React.Dispatch<React.SetStateAction<any>>,
  t: Function
): UseLocationSIQSUpdaterResult {
  // State for tracking update status
  let updateRequested = false;
  
  // Function to update SIQS calculations
  const updateSIQS = useCallback(async () => {
    if (!locationData || !locationData.latitude || !locationData.longitude) {
      console.log("Cannot update SIQS: missing location data");
      return;
    }
    
    // Skip if we don't have Bortle scale data yet
    if (locationData.bortleScale === undefined || locationData.bortleScale === null) {
      console.log("Cannot update SIQS: missing Bortle scale data");
      return;
    }
    
    try {
      console.log("Calculating SIQS for location:", locationData.name);
      updateRequested = true;
      
      // Calculate new SIQS score
      const siqsResult = await calculateRealTimeSiqs(
        locationData.latitude,
        locationData.longitude,
        locationData.bortleScale
      );
      
      // Update location data with new SIQS result
      setLocationData((prevData: any) => ({
        ...prevData,
        siqsResult
      }));
      
      // Update localStorage with the new SIQS value
      try {
        const savedLocationString = localStorage.getItem('latest_siqs_location');
        if (savedLocationString) {
          const savedLocation = JSON.parse(savedLocationString);
          if (savedLocation) {
            savedLocation.siqs = siqsResult.siqs;
            localStorage.setItem('latest_siqs_location', JSON.stringify(savedLocation));
          }
        }
      } catch (e) {
        console.error("Error updating SIQS in localStorage:", e);
      }
      
      console.log("Updated SIQS:", siqsResult.siqs.toFixed(1));
    } catch (error) {
      console.error("Error updating SIQS:", error);
    } finally {
      updateRequested = false;
    }
  }, [locationData, setLocationData]);
  
  // Reset the update state to force a recalculation
  const resetUpdateState = useCallback(() => {
    updateRequested = false;
    updateSIQS().catch(console.error);
  }, [updateSIQS]);
  
  return { updateSIQS, resetUpdateState };
}
