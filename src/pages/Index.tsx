
import React, { useEffect, useState, useCallback } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { prefetchPopularLocations } from '@/lib/queryPrefetcher';
import HeroSection from "@/components/index/HeroSection";
import CalculatorSection from "@/components/index/CalculatorSection";
import ScienceSection from "@/components/index/ScienceSection";
import PhotoPointsSection from "@/components/index/PhotoPointsSection";
import Footer from "@/components/index/Footer";
import { currentSiqsStore } from "@/components/index/CalculatorSection";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const IndexPage = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [hasRestoredLocation, setHasRestoredLocation] = useState(false);
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  const [pageReady, setPageReady] = useState(false);
  
  const { coords, getPosition } = useGeolocation({
    enableHighAccuracy: true
  });
  
  const saveUserLocation = useCallback((location: { latitude: number; longitude: number }) => {
    try {
      localStorage.setItem('userLocation', JSON.stringify(location));
      console.log("Saved user location to localStorage:", location);
    } catch (error) {
      console.error("Error saving location to localStorage:", error);
    }
  }, []);
  
  useEffect(() => {
    if (coords) {
      const userLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude
      };
      saveUserLocation(userLocation);
    }
  }, [coords, saveUserLocation]);
  
  // Request location on first load, with user permission
  useEffect(() => {
    // Only request if we haven't restored a location
    if (!hasRestoredLocation) {
      getPosition();
    }
  }, [getPosition, hasRestoredLocation]);
  
  useEffect(() => {
    // Prefetch popular locations for better UX
    prefetchPopularLocations(queryClient);
    
    try {
      const savedLocationString = localStorage.getItem('latest_siqs_location');
      
      if (savedLocationString) {
        const savedLocation = JSON.parse(savedLocationString);
        
        if (savedLocation && savedLocation.name) {
          setHasRestoredLocation(true);
          console.log("Found saved location, using it for calculations:", savedLocation.name);
          
          // Get the SIQS score from the saved location if available, or from the store
          const locationSiqs = savedLocation.siqs || currentSiqsStore.getState().value;
          if (locationSiqs) {
            setCurrentSiqs(locationSiqs);
            toast.success(t("Restored your last location", "已恢复您上次的位置"));
          }
        }
      }
    } catch (error) {
      console.error("Error checking for location restoration:", error);
    }
    
    // Handle direct navigation to specific sections using hash
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
    
    // Listen for SIQS updates from the store
    const unsubscribe = currentSiqsStore.subscribe(
      state => setCurrentSiqs(state.value)
    );
    
    // Mark page as ready for animations
    setPageReady(true);
    
    return () => {
      unsubscribe();
    };
  }, [queryClient, t]);

  if (!pageReady) {
    return (
      <div className="min-h-screen bg-cosmic-950 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-primary mb-4"></div>
          <div className="h-4 w-32 bg-cosmic-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-cosmic-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="fixed inset-0 bg-cosmic-950/70 z-0"></div>
      
      <div className="relative z-10">
        <HeroSection />
        <CalculatorSection id="calculator-section" noAutoLocationRequest={hasRestoredLocation} />
        <ScienceSection />
        <PhotoPointsSection currentSiqs={currentSiqs} />
        <Footer />
      </div>
    </motion.div>
  );
};

export default IndexPage;
