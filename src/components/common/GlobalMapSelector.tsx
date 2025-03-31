
import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { SIQSLocation } from '@/utils/locationStorage';
import LazyMapComponent from '@/components/location/map/LazyMapComponent';

const GlobalMapSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<[number, number]>([20, 0]);
  const [selectedLocation, setSelectedLocation] = useState<SIQSLocation | null>(null);
  const callbackRef = useRef<((location: SIQSLocation) => void) | null>(null);
  const { t } = useLanguage();
  
  // Listen for the custom event to open the map selector
  useEffect(() => {
    const handleOpenMapSelect = (event: any) => {
      setIsOpen(true);
      
      // Get initial position if available
      if (event.detail?.initialPosition) {
        setPosition([event.detail.initialPosition.latitude, event.detail.initialPosition.longitude]);
      }
      
      // Store the callback function
      if (event.detail?.onSelect && typeof event.detail.onSelect === 'function') {
        callbackRef.current = event.detail.onSelect;
      }
    };
    
    document.addEventListener('openMapSelect', handleOpenMapSelect);
    
    return () => {
      document.removeEventListener('openMapSelect', handleOpenMapSelect);
    };
  }, []);
  
  // Handle map click to set position
  const handleMapClick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    
    // Create a location object with coordinates
    setSelectedLocation({
      name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      latitude: lat,
      longitude: lng
    });
  };
  
  // Handle confirmation
  const handleConfirm = async () => {
    if (selectedLocation && callbackRef.current) {
      // Try to get a better name for the location using reverse geocoding
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${selectedLocation.longitude},${selectedLocation.latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiYXN0cm9wbGFubmVyIiwiYSI6ImNsc2I0d2txbTBkMWoybHFuZmJ6cDNzcWQifQ.MGCCvI4zlgaMtK88q-iu7A'}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            const locationName = data.features[0].place_name;
            selectedLocation.name = locationName;
          }
        }
      } catch (error) {
        console.error('Error getting location name:', error);
      }
      
      // Call the callback function with the selected location
      callbackRef.current(selectedLocation);
      
      // Close the dialog
      setIsOpen(false);
      setSelectedLocation(null);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t("Select Location on Map", "在地图上选择位置")}</DialogTitle>
        </DialogHeader>
        
        <div className="h-[50vh] w-full">
          <LazyMapComponent
            center={position}
            zoom={3}
            markers={selectedLocation ? [{position: [selectedLocation.latitude, selectedLocation.longitude]}] : undefined}
            onMapClick={handleMapClick}
            className="h-full w-full rounded-md border border-cosmic-700"
          />
        </div>
        
        <div className="flex justify-between items-center pt-2">
          <div className="text-sm">
            {selectedLocation 
              ? t(
                  `Selected: ${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`,
                  `已选择: ${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`
                )
              : t("Click on the map to select a location", "点击地图选择位置")}
          </div>
          
          <Button 
            onClick={handleConfirm}
            disabled={!selectedLocation}
          >
            {t("Confirm Location", "确认位置")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalMapSelector;
