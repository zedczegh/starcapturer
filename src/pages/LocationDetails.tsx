
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import LocationError from "@/components/location/LocationError";
import LocationDetailsContent from "@/components/location/LocationDetailsContent";
import LocationDetailsHeader from "@/components/location/LocationDetailsHeader";
import LocationStatusMessage from "@/components/location/LocationStatusMessage";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useLocationUpdate } from "@/hooks/useLocationUpdate";
import { motion } from "framer-motion";

const LocationDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [locationData, setLocationData] = useState<any>(null);
  const { t } = useLanguage();
  const { toast } = useToast();
  const { loading, handleLocationUpdate } = useLocationUpdate(locationData, setLocationData);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');

  useEffect(() => {
    if (!locationData && location.state) {
      console.log("Setting location data from state:", location.state);
      setLocationData(location.state);
      
      if (!location.state?.latitude || !location.state?.longitude) {
        toast({
          title: t("Error", "错误"),
          description: t("Incomplete location data", "位置数据不完整"),
          variant: "destructive"
        });
        
        const redirectTimer = setTimeout(() => {
          navigate("/");
        }, 2000);
        
        return () => clearTimeout(redirectTimer);
      }
    } else if (!locationData && !location.state) {
      console.error("Location data is missing", { params: id, locationState: location.state });
      
      toast({
        title: t("Error", "错误"),
        description: t("Location data not found", "找不到位置数据"),
        variant: "destructive"
      });
    }
  }, [locationData, location.state, navigate, t, id, toast]);

  const handleUpdateLocation = async (newLocation: { name: string; latitude: number; longitude: number }) => {
    try {
      await handleLocationUpdate(newLocation);
      setStatusMessage(t("SIQS score has been recalculated for the new location.", 
                   "已为新位置重新计算SIQS评分。"));
      setMessageType('success');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      setStatusMessage(t("Failed to update location and recalculate SIQS score. Please try again.", 
                   "无法更新位置并重新计算SIQS评分。请重试。"));
      setMessageType('error');                   
    }
  };

  if (!locationData) {
    return <LocationError />;
  }

  return (
    <motion.div 
      className="min-h-screen overflow-x-hidden sci-fi-scrollbar pb-16 md:pb-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <NavBar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <LocationDetailsHeader name={locationData.name} />
        
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
};

export default LocationDetails;
