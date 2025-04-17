
import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import SIQSCalculator from "@/components/SIQSCalculator";
import { create } from "zustand";
import SIQSSummary from "@/components/SIQSSummary";
import { calculateAstronomicalNight, formatTime } from "@/utils/astronomy/nightTimeCalculator";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Star, Calculator } from "lucide-react";

// Create a store for the current SIQS value
interface SiqsState {
  value: number | null;
  setValue: (value: number | null) => void;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  setMetadata: (name: string, lat: number, lng: number) => void;
}

export const currentSiqsStore = create<SiqsState>((set) => ({
  value: null,
  setValue: (value) => set({ value }),
  locationName: null,
  latitude: null,
  longitude: null,
  setMetadata: (name, lat, lng) => set({ locationName: name, latitude: lat, longitude: lng })
}));

interface CalculatorSectionProps {
  noAutoLocationRequest?: boolean;
  id?: string;
}

const CalculatorSection: React.FC<CalculatorSectionProps> = ({ 
  noAutoLocationRequest = false,
  id = "calculator" 
}) => {
  const { t } = useLanguage();
  const [siqsCalculated, setSiqsCalculated] = useState<number | null>(null);
  const [locationData, setLocationData] = useState<any>(null);
  const [calculationSuccessful, setCalculationSuccessful] = useState(false);
  
  const currentSiqs = currentSiqsStore(state => state.value);
  const locationLatitude = currentSiqsStore(state => state.latitude);
  const locationLongitude = currentSiqsStore(state => state.longitude);
  const locationName = currentSiqsStore(state => state.locationName);
  
  // Create simulated weather data for the SIQS Summary component
  const updateSummaryData = useCallback(() => {
    if (siqsCalculated !== null && locationLatitude && locationLongitude && locationName) {
      try {
        const { start, end } = calculateAstronomicalNight(
          locationLatitude, 
          locationLongitude
        );
        
        setLocationData({
          name: locationName,
          latitude: locationLatitude,
          longitude: locationLongitude,
          timestamp: new Date().toISOString(),
          astronomicalNight: {
            start: start.toISOString(),
            end: end.toISOString(),
            formattedTime: `${formatTime(start)} - ${formatTime(end)}`
          },
          weatherData: {
            temperature: 15,
            humidity: 60,
            windSpeed: 10,
            clearSkyRate: 75
          },
          siqsResult: {
            score: siqsCalculated,
            isViable: siqsCalculated >= 2.5
          }
        });
        
        // Mark calculation as successful for animations
        if (!calculationSuccessful) {
          setCalculationSuccessful(true);
        }
        
      } catch (err) {
        console.error("Error calculating astronomical night for SIQS summary:", err);
      }
    }
  }, [siqsCalculated, locationLatitude, locationLongitude, locationName, calculationSuccessful]);
  
  // Update summary when SIQS is calculated
  useEffect(() => {
    updateSummaryData();
  }, [siqsCalculated, locationLatitude, locationLongitude, updateSummaryData]);
  
  const handleSiqsCalculated = useCallback((siqs: number | null) => {
    console.log("SIQS calculated:", siqs);
    setSiqsCalculated(siqs);
    currentSiqsStore.getState().setValue(siqs);
    
    if (siqs !== null && siqs > 0) {
      // Show toast for successful calculation
      toast.success(
        t("SIQS calculated successfully!", "SIQS计算成功！"),
        {
          description: t(
            `Score: ${siqs.toFixed(1)} - ${siqs >= 7 ? 'Excellent' : siqs >= 5 ? 'Good' : siqs >= 3 ? 'Fair' : 'Poor'} conditions`,
            `分数: ${siqs.toFixed(1)} - ${siqs >= 7 ? '极佳' : siqs >= 5 ? '良好' : siqs >= 3 ? '一般' : '较差'}条件`
          )
        }
      );
    }
  }, [t]);

  // Animation variants for sections
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6 }
    }
  };

  return (
    <section id={id} className="py-16 px-4 relative">
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div 
          className="text-center mb-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <div className="flex items-center justify-center mb-2">
            <Calculator className="h-6 w-6 text-primary mr-2" />
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              {t("SIQS Calculator", "SIQS计算器")}
            </h2>
          </div>
          
          <div className="h-1 w-24 bg-primary/30 mx-auto my-4">
            <div className="h-full bg-primary" style={{ width: siqsCalculated ? '100%' : '30%' }}></div>
          </div>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t(
              "Calculate the Sky Imaging Quality Score for any location on Earth.",
              "计算地球上任何位置的天空成像质量评分。"
            )}
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
            }}
          >
            <SIQSCalculator
              hideRecommendedPoints={false}
              noAutoLocationRequest={noAutoLocationRequest}
              onSiqsCalculated={handleSiqsCalculated}
            />
          </motion.div>
          
          <motion.div 
            className="flex flex-col justify-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0, x: 20 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.6, delay: 0.2 } }
            }}
          >
            {locationData && locationData.siqsResult ? (
              <div className={`transition-all duration-500 ${calculationSuccessful ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <SIQSSummary 
                  siqsResult={locationData.siqsResult} 
                  weatherData={locationData.weatherData}
                  locationData={locationData}
                />
              </div>
            ) : (
              <div className="glassmorphism-strong rounded-xl p-6 text-center">
                <Star className="h-8 w-8 text-primary mx-auto mb-3 opacity-60" />
                <h3 className="text-xl font-medium mb-4">
                  {t("Select a Location", "选择位置")}
                </h3>
                <p className="text-muted-foreground">
                  {t(
                    "Use the calculator on the left to select a location and calculate its SIQS score.",
                    "使用左侧计算器选择位置并计算其SIQS评分。"
                  )}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CalculatorSection;
