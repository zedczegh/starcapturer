
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
  
  useEffect(() => {
    getPosition();
  }, [getPosition]);
  
  useEffect(() => {
    prefetchPopularLocations(queryClient);
    
    try {
      const savedLocationString = localStorage.getItem('latest_siqs_location');
      
      if (savedLocationString) {
        const savedLocation = JSON.parse(savedLocationString);
        
        if (savedLocation && savedLocation.name) {
          setHasRestoredLocation(true);
          console.log("Found saved location, disabling auto location request");
          
          const locationSiqs = savedLocation.siqs || currentSiqsStore.getValue();
          setCurrentSiqs(locationSiqs);
        }
      }
    } catch (error) {
      console.error("Error checking for location restoration:", error);
    }
    
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
    
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
      <div className="fixed inset-0 bg-cosmic-950/70 z-0"></div>
      
      <div className="relative z-10">
        <HeroSection />
        <CalculatorSection noAutoLocationRequest={hasRestoredLocation} />
        <ScienceSection />
        <PhotoPointsSection />
        <Footer />
      </div>
    </div>
  );
};

export default IndexPage;
