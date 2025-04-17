import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface UseLocationDataManagerProps {
  id?: string;
  initialState?: any;
  navigate: (path: string) => void;
  defaultLocation?: boolean;
}

export const useLocationDataManager = ({
  id,
  initialState,
  navigate,
  defaultLocation = false
}: UseLocationDataManagerProps) => {
  const [locationData, setLocationData] = useState<any>(initialState || null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"info" | "error" | "success" | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { t } = useLanguage();

  // Function to load a saved location from localStorage
  const loadSavedLocation = useCallback(() => {
    try {
      // First check for latest SIQS location (most recently calculated)
      const siqsLocationString = localStorage.getItem('latest_siqs_location');
      if (siqsLocationString) {
        const siqsLocation = JSON.parse(siqsLocationString);
        if (siqsLocation && siqsLocation.latitude && siqsLocation.longitude) {
          console.log("Loading saved SIQS location:", siqsLocation.name);
          return siqsLocation;
        }
      }
      
      // Then check for user's saved location
      const userLocationString = localStorage.getItem('userLocation');
      if (userLocationString) {
        const userLocation = JSON.parse(userLocationString);
        if (userLocation && userLocation.latitude && userLocation.longitude) {
          console.log("Loading saved user location");
          return {
            name: "Saved Location",
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            timestamp: new Date().toISOString()
          };
        }
      }
    } catch (error) {
      console.error("Error loading saved location:", error);
    }
    
    // If no saved location, return a default location (Beijing)
    return {
      name: "Beijing",
      latitude: 39.9042,
      longitude: 116.4074,
      timestamp: new Date().toISOString()
    };
  }, []);

  // Effect to load the location data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchLocationData = async () => {
      try {
        // If we have initial state, use that
        if (initialState) {
          if (isMounted) {
            setLocationData(initialState);
            setIsLoading(false);
          }
          return;
        }

        // For defaultLocation (homepage with no ID), load from localStorage
        if (defaultLocation && !id) {
          const savedLocation = loadSavedLocation();
          if (isMounted) {
            setLocationData(savedLocation);
            setIsLoading(false);
            
            // Set a success message
            setStatusMessage(t ? t("Loaded saved location", "已加载保存的位置") : "Loaded saved location");
            setMessageType("success");
            
            // Clear message after a few seconds
            setTimeout(() => {
              if (isMounted) {
                setStatusMessage(null);
                setMessageType(null);
              }
            }, 3000);
          }
          return;
        }

        // For regular location routes, handle as before
        const locationId = id;

        if (!locationId) {
          console.warn("No location ID provided");
          if (isMounted) {
            setStatusMessage(t ? t("No location ID provided", "未提供位置 ID") : "No location ID provided");
            setMessageType("error");
            setIsLoading(false);
          }
          return;
        }

        // Check if the ID is "current" to use geolocation
        if (locationId === "current") {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              const newLocationData = {
                name: "Current Location",
                latitude,
                longitude,
                timestamp: new Date().toISOString()
              };
              if (isMounted) {
                setLocationData(newLocationData);
                setIsLoading(false);
              }
            },
            (error) => {
              console.error("Geolocation error:", error);
              if (isMounted) {
                setStatusMessage(t ? t("Could not get your location. Please try entering it manually.", "无法获取您的位置。请尝试手动输入。") : "Could not get your location");
                setMessageType("error");
                setIsLoading(false);
              }
            }
          );
        } else {
          // Regular location ID handling
          try {
            const decodedId = decodeURIComponent(locationId);
            const [latitude, longitude] = decodedId.split(',').map(Number);

            if (isNaN(latitude) || isNaN(longitude)) {
              console.error("Invalid latitude or longitude");
              if (isMounted) {
                setStatusMessage(t ? t("Invalid latitude or longitude", "无效的纬度或经度") : "Invalid latitude or longitude");
                setMessageType("error");
                setIsLoading(false);
              }
              return;
            }

            const newLocationData = {
              name: "Custom Location",
              latitude,
              longitude,
              timestamp: new Date().toISOString()
            };
            if (isMounted) {
              setLocationData(newLocationData);
              setIsLoading(false);
            }
          } catch (error) {
            console.error("Error decoding location ID:", error);
            if (isMounted) {
              setStatusMessage(t ? t("Error decoding location ID", "解码位置 ID 时出错") : "Error decoding location ID");
              setMessageType("error");
              setIsLoading(false);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching location data:", error);
        
        // Handle errors
        if (isMounted) {
          setStatusMessage(t ? t("Failed to load location", "无法加载位置") : "Failed to load location");
          setMessageType("error");
          setIsLoading(false);
        }
      }
    };

    fetchLocationData();

    return () => {
      isMounted = false;
    };
  }, [id, initialState, navigate, t, defaultLocation, loadSavedLocation]);

  // Simplified function to update the location
  const handleUpdateLocation = useCallback(async (updatedLocation: any) => {
    try {
      setLocationData((prevData: any) => ({
        ...prevData,
        ...updatedLocation,
        timestamp: new Date().toISOString()
      }));
      
      setStatusMessage(t ? t("Location updated", "位置已更新") : "Location updated");
      setMessageType("success");

      // Clear message after a few seconds
      setTimeout(() => {
        setStatusMessage(null);
        setMessageType(null);
      }, 3000);
      
      // Save to localStorage for future visits
      try {
        localStorage.setItem('userLocation', JSON.stringify({
          latitude: updatedLocation.latitude,
          longitude: updatedLocation.longitude
        }));
      } catch (e) {
        console.error("Error saving to localStorage:", e);
      }

      return true;
    } catch (error) {
      console.error("Error updating location:", error);
      setStatusMessage(t ? t("Failed to update location", "无法更新位置") : "Failed to update location");
      setMessageType("error");
      return false;
    }
  }, [t]);

  return {
    locationData,
    setLocationData,
    statusMessage,
    setStatusMessage,
    messageType,
    setMessageType,
    handleUpdateLocation,
    isLoading
  };
};
