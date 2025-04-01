
import React, { useEffect, useState, lazy, Suspense } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { prefetchPopularLocations } from '@/lib/queryPrefetcher';
import HeroSection from "@/components/index/HeroSection";
import ScienceSection from "@/components/index/ScienceSection";
import PhotoPointsSection from "@/components/index/PhotoPointsSection";
import Footer from "@/components/index/Footer";
import PageLoader from "@/components/loaders/PageLoader";

// Lazy load the calculator section for better performance
const CalculatorSection = lazy(() => import("@/components/index/CalculatorSection"));

const Index = () => {
  const queryClient = useQueryClient();
  const [hasRestoredLocation, setHasRestoredLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Prefetch data for popular locations when the home page loads
    try {
      prefetchPopularLocations(queryClient);
    } catch (error) {
      console.error("Error prefetching popular locations:", error);
    }
    
    // Check if we need to restore previous location
    try {
      // Check localStorage for saved location
      const savedLocationString = localStorage.getItem('latest_siqs_location');
      
      if (savedLocationString) {
        try {
          // We have a saved location, parse it and mark as restored
          const savedLocation = JSON.parse(savedLocationString);
          
          if (savedLocation && savedLocation.name) {
            // Mark as restored to prevent auto-triggering current location
            setHasRestoredLocation(true);
            console.log("Found saved location, disabling auto location request");
          }
        } catch (parseError) {
          console.error("Error parsing saved location:", parseError);
        }
      }
    } catch (error) {
      console.error("Error checking for location restoration:", error);
    }
    
    // Mark loading as complete
    setIsLoading(false);
    
    // Scroll directly to calculator section on load
    const scrollToCalculator = () => {
      try {
        const calculatorSection = document.getElementById('calculator');
        if (calculatorSection) {
          calculatorSection.scrollIntoView({ behavior: 'smooth' });
        }
      } catch (error) {
        console.error("Error scrolling to calculator section:", error);
      }
    };
    
    const timer = setTimeout(scrollToCalculator, 300);
    
    // Scroll to section if hash is present in URL
    try {
      const hash = window.location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth' });
          }, 300);
        }
      }
    } catch (error) {
      console.error("Error scrolling to hash section:", error);
    }
    
    return () => clearTimeout(timer);
  }, [queryClient]);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-cosmic-950">
      <HeroSection />
      
      <Suspense fallback={<div className="h-96 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>}>
        <CalculatorSection noAutoLocationRequest={hasRestoredLocation} />
      </Suspense>
      
      <ScienceSection />
      <PhotoPointsSection />
      <Footer />
    </div>
  );
};

export default Index;
