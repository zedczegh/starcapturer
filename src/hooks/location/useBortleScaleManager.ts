
import { useEffect } from 'react';
import { isInChina } from '@/utils/chinaBortleData';

export const useBortleScaleManager = (
  locationData: any,
  isLoading: boolean,
  setLocationData: (data: any) => void,
  updateBortleScale: (lat: number, lon: number, name: string, currentScale: number | null) => Promise<number | null>,
  resetUpdateState: () => void
) => {
  useEffect(() => {
    if (!locationData || isLoading) return;
    
    const inChina = locationData.latitude && locationData.longitude ? 
      isInChina(locationData.latitude, locationData.longitude) : false;
    
    if (inChina || locationData.bortleScale === null || locationData.bortleScale === undefined) {
      const updateBortleScaleAsync = async () => {
        try {
          console.log("Location may be in China or needs Bortle update:", locationData.name);
          
          const newBortleScale = await updateBortleScale(
            locationData.latitude,
            locationData.longitude,
            locationData.name,
            locationData.bortleScale
          );
          
          if (newBortleScale !== null && newBortleScale !== locationData.bortleScale) {
            console.log(`Bortle scale updated: ${locationData.bortleScale} -> ${newBortleScale}`);
            setLocationData({
              ...locationData,
              bortleScale: newBortleScale
            });
            
            resetUpdateState();
          }
        } catch (error) {
          console.error("Failed to update Bortle scale:", error);
        }
      };
      
      updateBortleScaleAsync();
    }
  }, [locationData, isLoading, setLocationData, updateBortleScale, resetUpdateState]);
};
