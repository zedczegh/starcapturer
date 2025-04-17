
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { NavigateFunction } from 'react-router-dom';

// Default values to use when creating a new location
const DEFAULT_LOCATION = {
  name: "My Location",
  latitude: 37.7749,
  longitude: -122.4194,
  timestamp: new Date().toISOString()
};

interface LocationDataManagerProps {
  id?: string;
  initialState: any;
  navigate: NavigateFunction;
}

export function useLocationDataManager({ id, initialState, navigate }: LocationDataManagerProps) {
  const [locationData, setLocationData] = useState<any>(initialState);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"info" | "error" | "success" | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Load location data based on ID or saved data
  useEffect(() => {
    const loadLocationData = async () => {
      try {
        // If we have initialState, use it directly
        if (initialState) {
          setLocationData(initialState);
          setIsLoading(false);
          return;
        }
        
        // For the home page, try to get the latest location
        if (!id || id === 'home') {
          try {
            const savedLocationString = localStorage.getItem('latest_siqs_location');
            if (savedLocationString) {
              const savedLocation = JSON.parse(savedLocationString);
              if (savedLocation && savedLocation.latitude && savedLocation.longitude) {
                setLocationData(savedLocation);
                setIsLoading(false);
                return;
              }
            }
          } catch (error) {
            console.error("Error loading saved location:", error);
          }
          
          // If no saved location, use default
          setLocationData(DEFAULT_LOCATION);
          setIsLoading(false);
          return;
        }
        
        // For specific location IDs, try to load from localStorage
        try {
          // Try to get by ID directly (for custom generated IDs)
          const locationKey = `location_${id}`;
          const savedLocationString = localStorage.getItem(locationKey);
          
          if (savedLocationString) {
            const savedLocation = JSON.parse(savedLocationString);
            setLocationData(savedLocation);
            setIsLoading(false);
            return;
          }
          
          // If not found by ID, check if ID is latitude,longitude format
          if (id.includes(',')) {
            const [lat, lng] = id.split(',').map(parseFloat);
            if (!isNaN(lat) && !isNaN(lng)) {
              // Create a new location with the coordinates
              setLocationData({
                latitude: lat,
                longitude: lng,
                name: "Custom Location",
                timestamp: new Date().toISOString()
              });
              setIsLoading(false);
              return;
            }
          }
          
          // If we get here, location not found - go to not found page
          navigate('/404');
        } catch (error) {
          console.error("Error loading location data:", error);
          setMessageType("error");
          setStatusMessage("Error loading location data");
          navigate('/404');
        }
      } catch (error) {
        console.error("Error in loadLocationData:", error);
        setIsLoading(false);
      }
    };
    
    loadLocationData();
  }, [id, initialState, navigate]);
  
  // Handle updating location data
  const handleUpdateLocation = useCallback(async (updatedData: any) => {
    try {
      // Validate the updated data
      if (!updatedData.latitude || !updatedData.longitude) {
        setMessageType("error");
        setStatusMessage("Invalid location data");
        return;
      }
      
      // Update state with new data
      setLocationData((prevData: any) => ({
        ...prevData,
        ...updatedData,
        timestamp: new Date().toISOString()
      }));
      
      // Save to localStorage
      if (id && id !== 'home') {
        const locationKey = `location_${id}`;
        localStorage.setItem(locationKey, JSON.stringify({
          ...locationData,
          ...updatedData,
          timestamp: new Date().toISOString()
        }));
      }
      
      // Always update the latest_siqs_location
      localStorage.setItem('latest_siqs_location', JSON.stringify({
        ...locationData,
        ...updatedData,
        timestamp: new Date().toISOString()
      }));
      
      // Show success message
      setMessageType("success");
      setStatusMessage("Location updated successfully");
      
      // Clear message after delay
      setTimeout(() => {
        setStatusMessage(null);
        setMessageType(null);
      }, 3000);
      
      return updatedData;
    } catch (error) {
      console.error("Error updating location:", error);
      setMessageType("error");
      setStatusMessage("Error updating location");
      throw error;
    }
  }, [id, locationData]);
  
  return {
    locationData,
    setLocationData,
    statusMessage,
    setStatusMessage,
    messageType,
    setMessageType,
    isLoading,
    setIsLoading,
    handleUpdateLocation
  };
}
