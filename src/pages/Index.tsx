
import React, { useEffect, useState, useCallback } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { prefetchPopularLocations } from '@/lib/queryPrefetcher';
import HeroSection from "@/components/index/HeroSection";
import CalculatorSection from "@/components/index/CalculatorSection";
import ScienceSection from "@/components/index/ScienceSection";
import PhotoPointsSection from "@/components/index/PhotoPointsSection";
import Footer from "@/components/index/Footer";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { isGoodViewingCondition } from "@/hooks/siqs/siqsCalculationUtils";
import { currentSiqsStore } from "@/components/index/CalculatorSection";
import { useGeolocation } from "@/hooks/location/useGeolocation";

const Index = () => {
  const queryClient = useQueryClient();
  const [hasRestoredLocation, setHasRestoredLocation] = useState(false);
  const { t } = useLanguage();
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  
  // Always try to get the user's location on page load for global use
  const { coords, getPosition } = useGeolocation({
    enableHighAccuracy: true
  });
  
  // Save user location for global use
  const saveUserLocation = useCallback((location: { latitude: number; longitude: number }) => {
    try {
      localStorage.setItem('userLocation', JSON.stringify(location));
      console.log("Saved user location to localStorage:", location);
    } catch (error) {
      console.error("Error saving location to localStorage:", error);
    }
  }, []);
  
  // Update user location when coords change
  useEffect(() => {
    if (coords) {
      const userLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude
      };
      saveUserLocation(userLocation);
    }
  }, [coords, saveUserLocation]);
  
  // Request location on page load
  useEffect(() => {
    getPosition();
  }, [getPosition]);
  
  useEffect(() => {
    // Prefetch data for popular locations when the home page loads
    prefetchPopularLocations(queryClient);
    
    // Check if we need to restore previous location
    try {
      // Check localStorage for saved location
      const savedLocationString = localStorage.getItem('latest_siqs_location');
      
      if (savedLocationString) {
        // We have a saved location, parse it and mark as restored
        const savedLocation = JSON.parse(savedLocationString);
        
        if (savedLocation && savedLocation.name) {
          // Mark as restored to prevent auto-triggering current location
          setHasRestoredLocation(true);
          console.log("Found saved location, disabling auto location request");
          
          // Use the exact SIQS value from the saved location
          const locationSiqs = savedLocation.siqs;
          setCurrentSiqs(locationSiqs);
          
          // Update the global store with this value
          currentSiqsStore.setValue(locationSiqs);
          
          // Using threshold of 5 for showing notification about good conditions
          if (locationSiqs && isGoodViewingCondition(locationSiqs)) {
            // Show notification for ideal astrophotography location
            setTimeout(() => {
              toast.info(
                t(
                  "Your current location is ideal for astrophotography tonight, please find a rural spot with lower light pollution to start imaging!",
                  "您当前的位置今晚非常适合天文摄影，请寻找光污染较少的乡村地点开始拍摄！"
                ),
                {
                  duration: 8000,
                  icon: <Star className="text-yellow-400" />,
                }
              );
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error("Error checking for location restoration:", error);
    }
    
    // Scroll to calculator section or hash if present in URL
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
    
    // Update the currentSiqsStore value
    const updateCurrentSiqs = () => {
      try {
        const savedLocationString = localStorage.getItem('latest_siqs_location');
        if (savedLocationString) {
          const savedLocation = JSON.parse(savedLocationString);
          if (savedLocation && typeof savedLocation.siqs === 'number') {
            currentSiqsStore.setValue(savedLocation.siqs);
            setCurrentSiqs(savedLocation.siqs);
          }
        }
      } catch (error) {
        console.error("Error updating current SIQS:", error);
      }
    };
    
    updateCurrentSiqs();
    
    // Make global store available for external components
    (window as any).currentSiqsStore = currentSiqsStore;
    
  }, [queryClient, t]);

  return (
    <div className="min-h-screen bg-cosmic-950">
      <HeroSection />
      <CalculatorSection noAutoLocationRequest={hasRestoredLocation} />
      <ScienceSection />
      <PhotoPointsSection />
      <Footer />
    </div>
  );
};

export default Index;
