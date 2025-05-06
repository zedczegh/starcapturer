
import { useState, useEffect } from "react";
import { fetchWithCache } from "@/utils/fetchWithCache";

interface UseLocationNameEnhancerProps {
  latitude?: number;
  longitude?: number;
  language: string;
}

export function useLocationNameEnhancer({ latitude, longitude, language }: UseLocationNameEnhancerProps) {
  const [enhancedName, setEnhancedName] = useState<string | null>(null);
  const [chineseName, setChineseName] = useState<string | null>(null);
  const [locationDetails, setLocationDetails] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!latitude || !longitude) return;
    
    const fetchLocationInfo = async () => {
      setIsLoading(true);
      try {
        const apiUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${language}`;
        
        const data = await fetchWithCache(apiUrl, undefined, 24 * 60 * 60 * 1000); // Cache for 24 hours
        
        if (data) {
          // Create enhanced name from available data
          const locality = data.locality || data.city || '';
          const principalSubdivision = data.principalSubdivision || '';
          
          // Construct detailed location information
          const locationParts = [];
          if (data.locality) locationParts.push(data.locality);
          if (data.city && data.city !== data.locality) locationParts.push(data.city);
          if (principalSubdivision) locationParts.push(principalSubdivision);
          if (data.countryName) locationParts.push(data.countryName);
          
          const detailedLocation = locationParts.join(', ');
          setLocationDetails(detailedLocation || null);
          
          // For the enhanced name, use a shorter version
          const enhancedNameParts = [];
          if (locality) enhancedNameParts.push(locality);
          if (principalSubdivision && !enhancedNameParts.includes(principalSubdivision)) {
            enhancedNameParts.push(principalSubdivision);
          }
          
          // Set the enhanced name based on available data
          if (enhancedNameParts.length > 0) {
            setEnhancedName(enhancedNameParts.join(', '));
            
            // If language is Chinese, set Chinese name as the enhanced name
            if (language === 'zh') {
              setChineseName(enhancedNameParts.join(', '));
            }
          }
          
          // If we have Chinese data specifically
          if (data.localityInfo && data.localityInfo.administrative) {
            // Try to extract Chinese names from administrative data
            const chineseNameParts = [];
            for (const admin of data.localityInfo.administrative) {
              if (admin.name && admin.order <= 3) { // Only use higher-level administrative divisions
                chineseNameParts.push(admin.name);
              }
            }
            
            if (chineseNameParts.length > 0 && language === 'zh') {
              setChineseName(chineseNameParts.join(', '));
            }
          }
        }
      } catch (error) {
        console.error("Error fetching location details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLocationInfo();
  }, [latitude, longitude, language]);
  
  return { enhancedName, chineseName, locationDetails, isLoading };
}
