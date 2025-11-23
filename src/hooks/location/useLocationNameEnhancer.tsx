
import { useState, useEffect } from "react";
import { fetchWithCache } from "@/utils/fetchWithCache";
import { useMapProvider } from "@/contexts/MapProviderContext";

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
  const { provider, isAMapReady } = useMapProvider();
  
  useEffect(() => {
    if (!latitude || !longitude) return;
    
    const fetchLocationInfo = async () => {
      setIsLoading(true);
      try {
        // If using AMap and it's ready, use AMap Geocoder for Chinese names
        if (provider === 'amap' && isAMapReady && typeof window !== 'undefined' && (window as any).AMap) {
          try {
            await new Promise<void>((resolve, reject) => {
              (window as any).AMap.plugin('AMap.Geocoder', function() {
                const geocoder = new (window as any).AMap.Geocoder({ 
                  city: '全国', 
                  radius: 1000,
                  extensions: 'all'
                });
                
                geocoder.getAddress([longitude, latitude], (status: string, result: any) => {
                  if (status === 'complete' && result.regeocode) {
                    const regeocode = result.regeocode;
                    const formattedAddress = regeocode.formattedAddress;
                    const addressComponent = regeocode.addressComponent;
                    
                    // Set Chinese name from AMap
                    setChineseName(formattedAddress);
                    
                    // Create enhanced name with city and province
                    const enhancedParts = [];
                    if (addressComponent.township) enhancedParts.push(addressComponent.township);
                    if (addressComponent.district) enhancedParts.push(addressComponent.district);
                    if (addressComponent.city) enhancedParts.push(addressComponent.city);
                    if (addressComponent.province) enhancedParts.push(addressComponent.province);
                    
                    if (enhancedParts.length > 0) {
                      const enhanced = enhancedParts.slice(0, 2).join(', ');
                      setEnhancedName(language === 'zh' ? enhanced : formattedAddress);
                      setLocationDetails(formattedAddress);
                    }
                    
                    resolve();
                  } else {
                    reject(new Error('AMap geocoding failed'));
                  }
                });
              });
            });
            
            setIsLoading(false);
            return; // Exit early if AMap succeeded
          } catch (amapError) {
            console.log('AMap geocoding failed, falling back to BigDataCloud:', amapError);
          }
        }
        
        // Fallback to BigDataCloud API
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
  }, [latitude, longitude, language, provider, isAMapReady]);
  
  return { enhancedName, chineseName, locationDetails, isLoading };
}
