
import React, { useEffect, useState } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { prefetchPopularLocations } from '@/lib/queryPrefetcher';
import HeroSection from "@/components/index/HeroSection";
import CalculatorSection from "@/components/index/CalculatorSection";
import ScienceSection from "@/components/index/ScienceSection";
import PhotoPointsSection from "@/components/index/PhotoPointsSection";
import Footer from "@/components/index/Footer";
import { toast } from "sonner";
import { Star, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { isGoodViewingCondition } from "@/hooks/siqs/siqsCalculationUtils";
import { currentSiqsStore } from "@/components/index/CalculatorSection";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const queryClient = useQueryClient();
  const [hasRestoredLocation, setHasRestoredLocation] = useState(false);
  const { t } = useLanguage();
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  const [showGoodConditionBanner, setShowGoodConditionBanner] = useState(false);
  
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
              
              // Show banner for good conditions
              setShowGoodConditionBanner(true);
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
  }, [queryClient, t]);

  return (
    <div className="min-h-screen bg-cosmic-950">
      <HeroSection />
      
      {/* Good condition banner */}
      {showGoodConditionBanner && currentSiqs && currentSiqs >= 6.0 && (
        <div className="w-full max-w-6xl mx-auto px-4 mt-4 mb-6">
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-4 backdrop-blur-sm shadow-lg border border-green-500/30">
            <div className="flex items-start gap-4">
              <div className="text-green-400 shrink-0 mt-1">
                <Star className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-green-300">
                  {t(
                    "Excellent Viewing Conditions Tonight!",
                    "今晚观测条件极佳！"
                  )}
                </h3>
                <p className="text-sm text-green-200/90 mt-1">
                  {t(
                    "Your current location has a SIQS score of " + currentSiqs.toFixed(1) + " indicating ideal astrophotography conditions. Consider exploring darker areas nearby for even better results.",
                    "您当前位置的SIQS评分为" + currentSiqs.toFixed(1) + "，表明天文摄影条件理想。考虑探索附近更暗的区域获得更好效果。"
                  )}
                </p>
                <div className="mt-3">
                  <Link to="/photo-points">
                    <Button size="sm" variant="outline" className="bg-green-500/20 hover:bg-green-500/30 text-green-100">
                      <MapPin className="h-3.5 w-3.5 mr-1.5" />
                      {t("Find Dark Sky Locations", "查找暗空地点")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <CalculatorSection noAutoLocationRequest={hasRestoredLocation} />
      <ScienceSection />
      <PhotoPointsSection />
      <Footer />
    </div>
  );
};

export default Index;
