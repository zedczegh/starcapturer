
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import ShareLocationForm from "@/components/ShareLocationForm";
import { motion } from "framer-motion";
import { Share2, MapPin } from "lucide-react";
import LocationStatusMessage from "@/components/location/LocationStatusMessage";
import { useLanguage } from "@/contexts/LanguageContext";

const ShareLocation = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; name?: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  // Use callback for better performance
  const getUserLocation = useCallback(async () => {
    // Attempt to get user's current location
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 5000, // Reduced from 10000 for faster response
        maximumAge: 0
      };

      setStatusMessage({
        message: t("Getting your current location...", "正在获取您的当前位置..."),
        type: 'info'
      });

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          
          try {
            // This would be a call to reverse geocode the coordinates
            // For simplicity, we're using a placeholder
            const locationName = `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setUserLocation(prev => prev ? { ...prev, name: locationName } : null);
            
            setStatusMessage({
              message: t("Location found. You can now share your astrophotography spot.", 
                       "位置已找到。您现在可以分享您的天文摄影点。"),
              type: 'success'
            });
          } catch (error) {
            console.error("Error getting location name:", error);
            setStatusMessage({
              message: t("We couldn't get your location name. You can still enter it manually.",
                       "我们无法获取您的位置名称。您仍然可以手动输入。"),
              type: 'error'
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setStatusMessage({
            message: t("We couldn't access your current location. You can still enter coordinates manually.",
                     "我们无法访问您的当前位置。您仍然可以手动输入坐标。"),
            type: 'error'
          });
        },
        options
      );
    }
  }, [t]);
  
  useEffect(() => {
    // Pre-fetch user location when component mounts
    // Adding a small delay to allow the page to render first
    const timer = setTimeout(() => {
      getUserLocation();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [getUserLocation]);
  
  return (
    <motion.div 
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }} // Faster animation
    >
      <NavBar />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <motion.div 
          className="max-w-3xl mx-auto"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.2 }} // Faster transitions
        >
          <div className="flex items-center mb-6">
            <Share2 className="h-6 w-6 mr-2 text-primary" />
            <h1 className="text-3xl font-bold">
              {t("Share Your Astrophotography Spot", "分享您的天文摄影点")}
            </h1>
          </div>
          
          <p className="text-muted-foreground mb-8">
            {t("Help fellow astrophotographers discover amazing locations by sharing your favorite spots for stargazing and astrophotography. Your contributions will be visible to the community as recommended photo points.",
              "通过分享您喜爱的观星和天文摄影地点，帮助其他天文摄影爱好者发现令人惊叹的地点。您的贡献将作为推荐的拍摄点展示给社区。")}
          </p>
          
          {statusMessage && (
            <LocationStatusMessage
              message={statusMessage.message}
              type={statusMessage.type}
              onClear={() => setStatusMessage(null)}
            />
          )}
          
          <div className="glassmorphism-strong p-6 rounded-xl">
            <ShareLocationForm userLocation={userLocation} />
          </div>
        </motion.div>
      </main>
    </motion.div>
  );
};

export default ShareLocation;
