
import { useState, useEffect } from "react";
import { getLocationInfo } from "@/data/locationDatabase";

export function useUserRegionName(
  userLocation: { latitude: number; longitude: number } | null,
  language: string
) {
  const [userRegionName, setUserRegionName] = useState<string>("");

  // Update user region name when location changes
  useEffect(() => {
    if (userLocation) {
      try {
        // Get higher-level location name (state/province)
        // Use global locationInfo instead of direct require
        const locationInfo = { 
          name: `Location at ${userLocation.latitude.toFixed(2)}, ${userLocation.longitude.toFixed(2)}`,
          formattedName: language === 'en' ? "Current Region" : "当前区域",
          bortleScale: 5
        };
        
        try {
          // Try to get the actual location from the database
          const dbLocationInfo = getLocationInfo(userLocation.latitude, userLocation.longitude);
          if (dbLocationInfo && dbLocationInfo.name) {
            Object.assign(locationInfo, dbLocationInfo);
          }
        } catch (err) {
          console.error("Error accessing location database:", err);
        }
        
        // Extract just the region name
        let regionName = "";
        if (locationInfo.name) {
          // For Chinese locations, try to extract province/state level
          const nameParts = locationInfo.name.split(',');
          if (nameParts.length > 1) {
            // Try to get province/state level name
            const provincePart = nameParts.find(part => 
              part.trim().includes("Province") || 
              part.trim().includes("State") || 
              part.trim().includes("District") ||
              part.trim().includes("省") || 
              part.trim().includes("自治区") ||
              part.trim().includes("市")
            );
            
            if (provincePart) {
              regionName = provincePart.trim();
            } else {
              // If no province found, use the second part (usually city or county)
              regionName = nameParts[1].trim();
            }
          } else {
            regionName = locationInfo.name;
          }
        }
        
        setUserRegionName(regionName || (language === 'en' ? "Current Region" : "当前区域"));
      } catch (error) {
        console.error("Error setting user region name:", error);
        setUserRegionName(language === 'en' ? "Current Region" : "当前区域");
      }
    }
  }, [userLocation, language]);

  return { userRegionName };
}
