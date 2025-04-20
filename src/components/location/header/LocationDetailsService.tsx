
import { useLocationNameEnhancer } from "@/hooks/location/useLocationNameEnhancer";

interface UseLocationDetailsServiceProps {
  latitude?: number;
  longitude?: number;
  language: string;
}

export function useLocationDetailsService({ 
  latitude, 
  longitude, 
  language 
}: UseLocationDetailsServiceProps) {
  // Use our refactored hook to get enhanced location names
  const { enhancedName, chineseName, locationDetails } = useLocationNameEnhancer({
    latitude,
    longitude,
    language
  });

  // Log location data for debugging mobile issues
  if (latitude && longitude) {
    console.log(`Location details service: ${latitude}, ${longitude}, enhanced name: ${enhancedName}`);
  }

  return {
    enhancedName,
    chineseName,
    locationDetails
  };
}
