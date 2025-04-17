import React, { useEffect, useState, useCallback } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { prefetchLocationData } from '@/lib/queryPrefetcher';
import { useGeolocation } from "@/hooks/location/useGeolocation";
import NavBar from "@/components/NavBarLegacy";
import PageLoader from "@/components/loaders/PageLoader";
import LocationDetailsViewport from "@/components/location/LocationDetailsViewport";
import { useLocationDataManager } from "@/hooks/location/useLocationDataManager";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBortleUpdater } from "@/hooks/location/useBortleUpdater";
import { useLocationSIQSUpdater } from "@/hooks/useLocationSIQSUpdater";
import Hero from '@/components/Hero';
import { useRef } from 'react';

const HomePage = () => {
  const queryClient = useQueryClient();
  const navigate = () => {}; // Empty navigate function since we don't need to navigate
  const { t } = useLanguage();
  const { updateBortleScale } = useBortleUpdater();
  
  // State to track if default location is loading
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const initialRenderRef = useRef(true);
  
  // Get user's current location
  const { coords, getPosition } = useGeolocation({
    enableHighAccuracy: true
  });
  
  // Setup location data manager with default location
  const {
    locationData, 
    setLocationData, 
    statusMessage, 
    messageType, 
    setStatusMessage,
    handleUpdateLocation,
    isLoading
  } = useLocationDataManager({ 
    id: 'home',
    initialState: null,
    navigate 
  });

  // Use the SIQS updater to keep scores in sync with forecast data
  const { resetUpdateState } = useLocationSIQSUpdater(
    locationData,
    locationData?.forecastData,
    setLocationData,
    t
  );
  
  // Initialize with saved location or default location
  useEffect(() => {
    try {
      // First try to get the latest used location
      const savedLocationString = localStorage.getItem('latest_siqs_location');
      if (savedLocationString) {
        const savedLocation = JSON.parse(savedLocationString);
        if (savedLocation && savedLocation.name) {
          console.log("Found saved location:", savedLocation);
          setLocationData({
            ...savedLocation,
            timestamp: new Date().toISOString()
          });
          setIsInitialLoad(false);
          return;
        }
      }
      
      // If no saved location, try to get user's current location
      getPosition();
    } catch (error) {
      console.error("Error loading initial location:", error);
    }
  }, [setLocationData, getPosition]);

  // Update location when coordinates are available
  useEffect(() => {
    if (coords && isInitialLoad) {
      console.log("Got user coordinates, updating location");
      
      // Use reverse geocoding to get location name
      const fetchLocationName = async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
          );
          const data = await response.json();
          
          const locationName = data.display_name || 
                              "Current Location";
          
          const newLocationData = {
            name: locationName,
            latitude: coords.latitude,
            longitude: coords.longitude,
            timestamp: new Date().toISOString()
          };
          
          setLocationData(newLocationData);
          
          // Save to localStorage
          localStorage.setItem('latest_siqs_location', JSON.stringify(newLocationData));
          
          setIsInitialLoad(false);
        } catch (error) {
          console.error("Error getting location name:", error);
          // Fall back to generic name
          setLocationData({
            name: "Current Location",
            latitude: coords.latitude,
            longitude: coords.longitude,
            timestamp: new Date().toISOString()
          });
          setIsInitialLoad(false);
        }
      };
      
      fetchLocationName();
    }
  }, [coords, isInitialLoad, setLocationData]);

  // Prefetch additional data when location data is available
  useEffect(() => {
    if (locationData && !isLoading && locationData.latitude && locationData.longitude) {
      prefetchLocationData(queryClient, locationData.latitude, locationData.longitude);
      
      // Reset the SIQS update state when location changes to force recalculation
      resetUpdateState();
      
      // Trigger a refresh event on the viewport
      setTimeout(() => {
        const viewport = document.querySelector('[data-refresh-trigger]');
        if (viewport) {
          viewport.dispatchEvent(new CustomEvent('forceRefresh'));
          console.log("Forced refresh event dispatched");
        }
      }, 300);
    }
  }, [locationData, isLoading, queryClient, resetUpdateState]);

  // Update Bortle scale data if needed
  useEffect(() => {
    const updateBortleScaleData = async () => {
      if (!locationData || isLoading) return;
      
      // If Bortle scale is missing, update it
      if (locationData.bortleScale === null || locationData.bortleScale === undefined) {
        try {
          const newBortleScale = await updateBortleScale(
            locationData.latitude,
            locationData.longitude,
            locationData.name,
            locationData.bortleScale
          );
          
          if (newBortleScale !== null && newBortleScale !== locationData.bortleScale) {
            console.log(`Updated Bortle scale: ${locationData.bortleScale} -> ${newBortleScale}`);
            setLocationData({
              ...locationData,
              bortleScale: newBortleScale
            });
            
            // Force SIQS update after Bortle scale changes
            resetUpdateState();
          }
        } catch (error) {
          console.error("Failed to update Bortle scale:", error);
        }
      }
    };
    
    updateBortleScaleData();
  }, [locationData, isLoading, setLocationData, updateBortleScale, resetUpdateState]);

  // Show loading while initializing
  if (isInitialLoad || isLoading) {
    return (
      <>
        <NavBar />
        <Hero />
        <PageLoader />
      </>
    );
  }

  return (
    <>
      <NavBar />
      <Hero />
      <LocationDetailsViewport 
        locationData={locationData}
        setLocationData={setLocationData}
        statusMessage={statusMessage}
        messageType={messageType}
        setStatusMessage={setStatusMessage}
        handleUpdateLocation={handleUpdateLocation}
      />
    </>
  );
};

export default HomePage;
