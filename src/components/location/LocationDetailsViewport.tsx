
import React, { memo } from "react";
import { motion } from "framer-motion";
import NavBar from "@/components/NavBar";
import LocationStatusMessage from "@/components/location/LocationStatusMessage";
import LocationDetailsContent from "@/components/location/LocationDetailsContent";

interface LocationDetailsViewportProps {
  locationData: any;
  setLocationData: (data: any) => void;
  statusMessage: string | null;
  messageType: 'info' | 'success' | 'error';
  setStatusMessage: (message: string | null) => void;
  handleUpdateLocation: (location: { name: string; latitude: number; longitude: number }) => Promise<void>;
}

const LocationDetailsViewport = memo<LocationDetailsViewportProps>(({
  locationData,
  setLocationData,
  statusMessage,
  messageType,
  setStatusMessage,
  handleUpdateLocation
}) => {
  return (
    <motion.div 
      className="min-h-screen overflow-x-hidden sci-fi-scrollbar pb-16 md:pb-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <NavBar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <LocationStatusMessage 
          message={statusMessage}
          type={messageType}
          onClear={() => setStatusMessage(null)}
        />
        
        <LocationDetailsContent
          locationData={locationData}
          setLocationData={setLocationData}
          onLocationUpdate={handleUpdateLocation}
        />
      </main>
    </motion.div>
  );
});

LocationDetailsViewport.displayName = 'LocationDetailsViewport';

export default LocationDetailsViewport;
