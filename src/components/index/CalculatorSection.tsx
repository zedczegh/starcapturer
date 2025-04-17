
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import SIQSCalculator from "@/components/SIQSCalculator";
import { create } from "zustand";
import SIQSSummary from "@/components/SIQSSummary";
import { calculateAstronomicalNight, formatTime } from "@/utils/astronomy/nightTimeCalculator";

// Create a store for the current SIQS value
interface SiqsState {
  value: number | null;
  setValue: (value: number | null) => void;
  metadata: {
    locationName: string | null;
    latitude: number | null;
    longitude: number | null;
    setMetadata: (name: string, lat: number, lng: number) => void;
  }
}

export const currentSiqsStore = create<SiqsState>((set) => ({
  value: null,
  setValue: (value) => set({ value }),
  metadata: {
    locationName: null,
    latitude: null,
    longitude: null,
    setMetadata: (name, lat, lng) => 
      set(state => ({ 
        metadata: { 
          ...state.metadata, 
          locationName: name, 
          latitude: lat, 
          longitude: lng 
        } 
      }))
  }
}));

const CalculatorSection: React.FC<{
  noAutoLocationRequest?: boolean;
}> = ({ noAutoLocationRequest = false }) => {
  const { t } = useLanguage();
  const [siqsCalculated, setSiqsCalculated] = useState<number | null>(null);
  const [locationData, setLocationData] = useState<any>(null);
  
  const currentSiqs = currentSiqsStore(state => state.value);
  const locationMetadata = currentSiqsStore(state => state.metadata);
  
  // Create simulated weather data for the SIQS Summary component
  useEffect(() => {
    if (siqsCalculated !== null && locationMetadata.latitude && locationMetadata.longitude) {
      const { start, end } = calculateAstronomicalNight(
        locationMetadata.latitude, 
        locationMetadata.longitude
      );
      
      setLocationData({
        name: locationMetadata.locationName,
        latitude: locationMetadata.latitude,
        longitude: locationMetadata.longitude,
        timestamp: new Date().toISOString(),
        weatherData: {
          temperature: 15,
          humidity: 60,
          windSpeed: 10,
          clearSkyRate: 70
        },
        siqsResult: {
          score: siqsCalculated,
          isViable: siqsCalculated >= 2.5
        }
      });
    }
  }, [siqsCalculated, locationMetadata]);
  
  const handleSiqsCalculated = (siqs: number | null) => {
    setSiqsCalculated(siqs);
    currentSiqsStore.getState().setValue(siqs);
  };

  return (
    <section id="calculator" className="py-16 px-4 relative">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t("SIQS Calculator", "SIQS计算器")}
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t(
              "Calculate the Sky Imaging Quality Score for any location on Earth.",
              "计算地球上任何位置的天空成像质量评分。"
            )}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <SIQSCalculator
              hideRecommendedPoints={false}
              noAutoLocationRequest={noAutoLocationRequest}
              onSiqsCalculated={handleSiqsCalculated}
            />
          </div>
          
          <div className="flex flex-col justify-center">
            {locationData && locationData.siqsResult && (
              <SIQSSummary 
                siqsResult={locationData.siqsResult} 
                weatherData={locationData.weatherData}
                locationData={locationData}
              />
            )}
            {!locationData && (
              <div className="glassmorphism-strong rounded-xl p-6 text-center">
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default CalculatorSection;
