
import React, { useEffect, useState } from "react";
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
import { getLatestLocation } from "@/services/locationSyncService";
import { currentSiqsStore } from "@/components/index/CalculatorSection";

const Index = () => {
  const queryClient = useQueryClient();
  const [hasRestoredLocation, setHasRestoredLocation] = useState(false);
  const { t } = useLanguage();
  
  useEffect(() => {
    // Prefetch data for popular locations when the home page loads
    prefetchPopularLocations(queryClient);
    
    // Check if we need to restore previous location
    try {
      // Check for saved location
      const savedLocation = getLatestLocation();
      
      if (savedLocation) {
        // We have a saved location, mark as restored
        setHasRestoredLocation(true);
        console.log("Found saved location, disabling auto location request");
        
        // Get current SIQS score if available
        const currentSiqs = currentSiqsStore.getScore();
        
        // Check if SIQS score is over 6, show notification
        if (currentSiqs && currentSiqs > 6) {
          // Show notification for ideal astrophotography conditions
          setTimeout(() => {
            toast.info(
              t(
                "Current conditions are ideal for astrophotography tonight!",
                "当前条件非常适合今晚进行天文摄影！"
              ),
              {
                duration: 6000,
                icon: <Star className="text-yellow-400" />,
              }
            );
          }, 2000);
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
    } else {
      // If no hash, scroll to calculator section
      const calculatorSection = document.getElementById('calculator');
      if (calculatorSection) {
        setTimeout(() => {
          calculatorSection.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    }
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
