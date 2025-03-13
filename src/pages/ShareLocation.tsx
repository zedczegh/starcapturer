
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import ShareLocationForm from "@/components/ShareLocationForm";
import { motion } from "framer-motion";

const ShareLocation = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; name?: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Use callback for better performance
  const getUserLocation = useCallback(async () => {
    // Attempt to get user's current location
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 5000, // Reduced from 10000 for faster response
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          
          try {
            // This would be a call to reverse geocode the coordinates
            // For simplicity, we're using a placeholder
            const locationName = `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setUserLocation(prev => prev ? { ...prev, name: locationName } : null);
          } catch (error) {
            console.error("Error getting location name:", error);
            setStatusMessage({
              message: "We couldn't get your location name. You can still enter it manually.",
              type: 'error'
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setStatusMessage({
            message: "We couldn't access your current location. You can still enter coordinates manually.",
            type: 'error'
          });
        },
        options
      );
    }
  }, []);
  
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
          <h1 className="text-3xl font-bold mb-6">Share Your Astrophotography Spot</h1>
          <p className="text-muted-foreground mb-8">
            Help fellow astrophotographers discover amazing locations by sharing your favorite 
            spots for stargazing and astrophotography. Your contributions will be visible to the 
            community as recommended photo points.
          </p>
          
          {statusMessage && (
            <div className={`mb-4 p-3 rounded-md ${statusMessage.type === 'error' ? 'bg-destructive/15 text-destructive' : 'bg-green-500/15 text-green-600'}`}>
              {statusMessage.message}
            </div>
          )}
          
          <ShareLocationForm userLocation={userLocation} />
        </motion.div>
      </main>
    </motion.div>
  );
};

export default ShareLocation;
