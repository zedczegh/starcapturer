
import React, { useEffect, useState } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { prefetchPopularLocations } from '@/lib/queryPrefetcher';
import HeroSection from "@/components/index/HeroSection";
import CalculatorSection from "@/components/index/CalculatorSection";
import ScienceSection from "@/components/index/ScienceSection";
import PhotoPointsSection from "@/components/index/PhotoPointsSection";
import Footer from "@/components/index/Footer";

const Index = () => {
  const queryClient = useQueryClient();
  const [hasRestoredLocation, setHasRestoredLocation] = useState(false);
  
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
        }
      }
    } catch (error) {
      console.error("Error checking for location restoration:", error);
    }
    
    // Scroll directly to calculator section on load
    const calculatorSection = document.getElementById('calculator');
    if (calculatorSection) {
      setTimeout(() => {
        calculatorSection.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    }
    
    // Scroll to section if hash is present in URL
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
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

export default Index;
