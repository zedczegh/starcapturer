
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQueryClient } from "@tanstack/react-query";
import SIQSCalculator from "@/components/SIQSCalculator";
import SIQSSummary from "@/components/SIQSSummary";
import StatusMessage from "@/components/StatusMessage";
import { toast } from "sonner";
import { loadSavedLocation } from "@/utils/locationStorage";
import RecommendedPhotoPoints from "@/components/RecommendedPhotoPoints";
import MapSelector from "@/components/MapSelector";

// Add loading debounce for improved UX
let loadingDebounceTimer: NodeJS.Timeout | null = null;

// Define props for this component
interface CalculatorSectionProps {
  noAutoLocationRequest?: boolean;
}

const CalculatorSection: React.FC<CalculatorSectionProps> = ({ noAutoLocationRequest = false }) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [siqs, setSiqs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  
  // Attempt to load saved location on mount
  useEffect(() => {
    const loadLocation = async () => {
      try {
        const savedLocation = loadSavedLocation();
        if (savedLocation && savedLocation.name) {
          console.log("Found saved location:", savedLocation.name);
          setSelectedLocation(savedLocation);
          setHasLocation(true);
        }
      } catch (error) {
        console.error("Error loading saved location:", error);
      }
    };
    
    loadLocation();
  }, []);
  
  // Handle location selection
  const handleLocationSelect = useCallback((location: any) => {
    console.log("Location selected:", location.name);
    setSelectedLocation(location);
    setHasLocation(true);
    setSiqs(null);
  }, []);
  
  // Handle SIQS update
  const handleUpdateSiqs = useCallback((score: number, isViable: boolean) => {
    setSiqs(score);
    
    // Debounce loading state to prevent flickering UI
    if (loadingDebounceTimer) {
      clearTimeout(loadingDebounceTimer);
    }
    
    setIsLoading(true);
    loadingDebounceTimer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    if (!isViable) {
      toast.warning(t(
        "This location may not be suitable for astrophotography",
        "该位置可能不适合天文摄影"
      ), {
        duration: 4000,
      });
    }
  }, [t]);
  
  return (
    <section id="calculator" className="py-16 bg-cosmic-900">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-white"
          >
            {t("Sky Imaging Quality Score Calculator", "天空成像质量评分计算器")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-cosmic-300 max-w-2xl mx-auto"
          >
            {t(
              "Calculate the potential quality of astrophotography at your location",
              "计算您所在位置的天文摄影潜在质量"
            )}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">
                  {t("Enter Location", "输入位置")}
                </h3>
                <div className="space-y-4">
                  <MapSelector onLocationSelect={handleLocationSelect} />
                  
                  {/* Removed the "Select from Globe" button */}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="mt-6 space-y-4">
                <SIQSCalculator
                  location={selectedLocation}
                  onUpdateSiqs={handleUpdateSiqs}
                  noAutoLocationRequest={noAutoLocationRequest}
                />
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-7">
            {!hasLocation ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-cosmic-800 p-6 rounded-xl h-full flex flex-col justify-center items-center"
              >
                <StatusMessage
                  type="info"
                  message={t(
                    "Enter a location to calculate SIQS score",
                    "输入位置以计算SIQS评分"
                  )}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <SIQSSummary siqs={siqs} location={selectedLocation} />

                {!isLoading && siqs !== null && selectedLocation && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    className="mt-6 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-white">
                        {t("Recommended Photo Points", "推荐拍摄点")}
                      </h3>
                      <Button
                        onClick={() => navigate("/photo-points")}
                        className="rounded-full text-sm px-4 py-1 h-auto"
                      >
                        {t("View All Photo Points", "查看全部拍摄点")}
                      </Button>
                    </div>
                    
                    <RecommendedPhotoPoints
                      onSelectPoint={handleLocationSelect}
                      userLocation={
                        selectedLocation ? {
                          latitude: selectedLocation.latitude,
                          longitude: selectedLocation.longitude
                        } : null
                      }
                      preferCertified={true}
                    />
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CalculatorSection;
