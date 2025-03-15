
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import NavBar from "@/components/NavBar";
import LocationDetailsContent from "@/components/location/LocationDetailsContent";
import { useLanguage } from "@/contexts/LanguageContext";

interface LocationDetailsViewportProps {
  locationData: any;
  setLocationData: (data: any) => void;
  statusMessage: string | null;
  messageType: "info" | "error" | "success" | "warning" | null;
  setStatusMessage: (message: string | null) => void;
  handleUpdateLocation: (location: { name: string; latitude: number; longitude: number }) => Promise<void>;
}

const LocationDetailsViewport: React.FC<LocationDetailsViewportProps> = ({
  locationData,
  setLocationData,
  statusMessage,
  messageType,
  setStatusMessage,
  handleUpdateLocation
}) => {
  const { language, t } = useLanguage();
  const [showStatusMessage, setShowStatusMessage] = useState(false);
  
  // Show status message if provided (without auto-refresh)
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setShowStatusMessage(true);
      }, 300);
      
      // Auto-hide success messages after 5 seconds
      if (messageType === "success") {
        const hideTimer = setTimeout(() => {
          setShowStatusMessage(false);
          setStatusMessage(null);
        }, 5000);
        return () => {
          clearTimeout(timer);
          clearTimeout(hideTimer);
        };
      }
      
      return () => clearTimeout(timer);
    } else {
      setShowStatusMessage(false);
    }
  }, [statusMessage, messageType, setStatusMessage]);
  
  // Show toast for status messages
  useEffect(() => {
    if (statusMessage && messageType) {
      if (messageType === "error") {
        toast.error(statusMessage);
      } else if (messageType === "success") {
        toast.success(statusMessage);
      } else if (messageType === "warning") {
        toast.warning(statusMessage);
      } else {
        toast.info(statusMessage);
      }
    }
  }, [statusMessage, messageType]);
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        <LocationDetailsContent 
          locationData={locationData}
          setLocationData={setLocationData}
          onLocationUpdate={handleUpdateLocation}
          disableAutoRefresh={true} // Disable auto-refresh
        />
      </main>
    </div>
  );
};

export default LocationDetailsViewport;
