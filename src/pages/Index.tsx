
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

const IndexPage = () => {
  const queryClient = useQueryClient();
  const [hasRestoredLocation, setHasRestoredLocation] = useState(false);
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
          
          const locationSiqs = savedLocation.siqs || currentSiqsStore.getValue();
          setCurrentSiqs(locationSiqs);
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
          if (savedLocation && savedLocation.siqs) {
            currentSiqsStore.setValue(savedLocation.siqs);
            setCurrentSiqs(savedLocation.siqs);
          }
        }
      } catch (error) {
        console.error("Error updating current SIQS:", error);
      }
    };
    
    updateCurrentSiqs();
  }, [queryClient]);

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

// Export the component as default
export default IndexPage;
