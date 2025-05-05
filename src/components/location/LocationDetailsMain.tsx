
import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEnhancedLocation } from "@/hooks/useEnhancedLocation";
import LocationDetailsContent from "./LocationDetailsContent";
import LocationDetailsHeader from "./LocationDetailsHeader";
import { getEnhancedLocationDetails } from "@/services/geocoding/enhancedReverseGeocoding";
import { LocationDetailsMainProps } from "@/types/location";

const LocationDetailsMain: React.FC<LocationDetailsMainProps> = ({
  locationData,
  setLocationData,
  statusMessage,
  messageType,
  setStatusMessage,
  handleUpdateLocation,
}) => {
  const { t, language } = useLanguage();
  const [showHeader, setShowHeader] = useState(true);
  const detailsInitializedRef = useRef(false);
  
  // Get enhanced location details for more accurate naming
  const { locationDetails } = useEnhancedLocation({
    latitude: locationData?.latitude,
    longitude: locationData?.longitude,
    skip: !locationData
  });
  
  // Use the enhanced location details to update the location name
  useEffect(() => {
    if (!locationData || !setLocationData || detailsInitializedRef.current) return;
    
    const updateLocationDetails = async () => {
      try {
        // Get enhanced location details with street-level information
        const enhancedDetails = await getEnhancedLocationDetails(
          locationData.latitude, 
          locationData.longitude, 
          language
        );
        
        // Only update if we got a detailed name with multiple components
        if (enhancedDetails.formattedName && 
            ((enhancedDetails.streetName && enhancedDetails.townName) || 
             enhancedDetails.formattedName.includes(',') || 
             enhancedDetails.formattedName.includes('，'))) {
          
          setLocationData({
            ...locationData,
            name: enhancedDetails.formattedName
          });
          
          detailsInitializedRef.current = true;
        }
      } catch (error) {
        console.error("Error updating location details:", error);
      }
    };
    
    updateLocationDetails();
  }, [locationData, setLocationData, language]);
  
  // Additional update when locationDetails is loaded from the hook
  useEffect(() => {
    if (!locationData || !setLocationData || !locationDetails || detailsInitializedRef.current) return;
    
    // Check if we have a detailed name from the hook result
    if (locationDetails.formattedName && 
        (locationDetails.formattedName.includes(',') || 
         locationDetails.formattedName.includes('，'))) {
      
      // Update location data with the detailed name
      setLocationData({
        ...locationData,
        name: locationDetails.formattedName
      });
      
      detailsInitializedRef.current = true;
    }
  }, [locationData, setLocationData, locationDetails]);
  
  // Reset the initialization flag when location changes
  useEffect(() => {
    if (locationData) {
      const locationKey = `${locationData.latitude}-${locationData.longitude}`;
      return () => {
        // Reset when unmounting with this location
        if (locationData && `${locationData.latitude}-${locationData.longitude}` === locationKey) {
          detailsInitializedRef.current = false;
        }
      };
    }
  }, [locationData]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {showHeader && locationData && (
        <LocationDetailsHeader
          name={locationData.name || t("Unnamed Location", "未命名位置")}
          latitude={locationData.latitude}
          longitude={locationData.longitude}
          timestamp={locationData.timestamp}
        />
      )}
      <LocationDetailsContent
        locationData={locationData}
        setLocationData={setLocationData}
        onLocationUpdate={handleUpdateLocation}
      />
    </div>
  );
};

export default LocationDetailsMain;
