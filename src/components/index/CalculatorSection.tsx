import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CameraIcon, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import SIQSCalculator from "@/components/SIQSCalculator";
import RecommendedPhotoPoints from "@/components/RecommendedPhotoPoints";
import { Button } from "@/components/ui/button";

interface CalculatorSectionProps {
  noAutoLocationRequest?: boolean;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

// Create a store to hold the current SIQS value
export const currentSiqsStore = {
  value: null as number | null,
  listeners: [] as ((value: number | null) => void)[],
  
  getValue() {
    return this.value;
  },
  
  setValue(newValue: number | null) {
    this.value = newValue;
    this.listeners.forEach(listener => listener(newValue));
  },
  
  subscribe(listener: (value: number | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
};

const CalculatorSection: React.FC<CalculatorSectionProps> = ({ noAutoLocationRequest = false }) => {
  const { t } = useLanguage();
  const [showResult, setShowResult] = useState(false);
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  
  // Update user location from geolocation if needed
  useEffect(() => {
    // Try to get the user's location from localStorage
    try {
      const storedLocation = localStorage.getItem('userLocation');
      if (storedLocation) {
        const location = JSON.parse(storedLocation);
        if (location && location.latitude && location.longitude) {
          setUserLocation(location);
        }
      }
    } catch (error) {
      console.error("Error reading user location from localStorage:", error);
    }
  }, []);
  
  // Handle SIQS calculation completion
  const handleSiqsCalculated = (siqsValue: number | null) => {
    if (siqsValue !== null) {
      setCurrentSiqs(siqsValue);
      setShowResult(true);
      currentSiqsStore.setValue(siqsValue);
    }
  };
  
  return (
    <section id="calculator" className="py-16 lg:py-24 relative">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="absolute inset-0 pointer-events-none bg-cosmic-gradient opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 70%, rgba(76, 0, 255, 0.15), transparent 60%)"
          }}
        />
        
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 sci-fi-text">
            {t("Enter Your Location", "输入您的位置")}
          </h2>
          <p className="text-lg md:text-xl text-cosmic-100 md:max-w-xl mx-auto">
            {t(
              "Discover the quality of the night sky at your location",
              "探索您位置的夜空质量"
            )}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <SIQSCalculator 
              className="h-full" 
              noAutoLocationRequest={noAutoLocationRequest}
              onSiqsCalculated={handleSiqsCalculated}
            />
          </div>
          
          <div className="lg:col-span-2">
            <div className="glassmorphism-strong rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full bg-cosmic-800/60 backdrop-blur-sm flex flex-col">
              <h3 className="text-xl font-semibold mb-4 sci-fi-text">
                {t("Recommended Photo Points", "推荐摄影点")}
              </h3>
              
              {!showResult && (
                <div className="flex flex-col items-center justify-center flex-grow py-8 text-center">
                  <p className="text-sm text-cosmic-100 mb-4">
                    {t("Enter your location to see recommended photo points", "输入您的位置以查看推荐的摄影点")}
                  </p>
                  <CameraIcon className="h-12 w-12 text-cosmic-300/50" />
                </div>
              )}
              
              {showResult && (
                <div className="flex-grow">
                  <RecommendedPhotoPoints 
                    userLocation={userLocation} 
                    limit={3}
                    hideEmptyMessage={false}
                  />
                </div>
              )}
              
              <div className="mt-4 flex justify-center">
                <Link to="/photo-points">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-gradient-to-r from-blue-500/10 to-green-500/10 hover:from-blue-500/20 hover:to-green-500/20"
                  >
                    {t("View All Photo Points", "查看所有摄影点")}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CalculatorSection;
