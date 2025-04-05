
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationDataSection from "./LocationDataSection";
import SIQSDataSection from "./SIQSDataSection";
import WeatherForecastSection from "../forecast/WeatherForecastSection";
import LocationQuickActions from "./LocationQuickActions";
import LocationEditDialog from "./LocationEditDialog";
import WeatherDataSection from "./WeatherDataSection";
import MapView from "./map/MapView";
import LongRangeForecastSection from "../forecast/LongRangeForecastSection";
import { calculateBortleToSQM } from "@/utils/bortleUtils";
import BortleScaleUpdater from "./BortleScaleUpdater";
import { updateUserProvidedBortleScale } from "@/lib/api/pollution";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { useToast } from "@/components/ui/use-toast";

interface LocationDetailsContentProps {
  locationData: any;
  setLocationData: React.Dispatch<React.SetStateAction<any>>;
  onLocationUpdate: (location: any) => Promise<void>;
}

const LocationDetailsContent: React.FC<LocationDetailsContentProps> = ({
  locationData,
  setLocationData,
  onLocationUpdate,
}) => {
  const { language, t } = useLanguage();
  const [isMapViewActive, setIsMapViewActive] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  // Set up locationName for use in the component
  const locationName = locationData && (locationData.name || locationData.locationName || "");

  // Calculate SQM from Bortle scale
  const sqmValue = locationData?.bortleScale ? calculateBortleToSQM(locationData.bortleScale) : null;

  // Function to update location
  const handleUpdateLocation = (data: any) => {
    return onLocationUpdate({
      ...locationData,
      ...data,
      manuallyEdited: true
    });
  };
  
  // Function to handle Bortle scale updates
  const handleBortleScaleUpdate = (newBortleScale: number) => {
    if (!locationData || newBortleScale === locationData.bortleScale) return;
    
    // Update the local state
    const updatedLocationData = {
      ...locationData,
      bortleScale: newBortleScale
    };
    
    // Recalculate SIQS if we have the required data
    if (locationData.weatherData && locationData.seeingConditions !== undefined) {
      const moonPhase = locationData.moonPhase || 0;
      const siqsResult = calculateSIQS({
        cloudCover: locationData.weatherData.cloudCover,
        bortleScale: newBortleScale,
        seeingConditions: locationData.seeingConditions,
        windSpeed: locationData.weatherData.windSpeed,
        humidity: locationData.weatherData.humidity,
        moonPhase,
        precipitation: locationData.weatherData.precipitation,
        weatherCondition: locationData.weatherData.weatherCondition,
        aqi: locationData.weatherData.aqi
      });
      
      updatedLocationData.siqsResult = siqsResult;
      
      toast({
        title: t ? t("SIQS Recalculated", "SIQS已重新计算") : "SIQS Recalculated",
        description: t 
          ? t("Sky quality score has been updated with your light pollution data", "天空质量评分已使用您提供的光污染数据更新") 
          : "Sky quality score has been updated with your light pollution data",
      });
    }
    
    // Update the full location data
    setLocationData(updatedLocationData);
    
    // Also save this Bortle scale to the service
    updateUserProvidedBortleScale(
      locationData.latitude,
      locationData.longitude,
      newBortleScale,
      'observation'
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {!locationData ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-400">{t ? t("No location selected", "未选择位置") : "No location selected"}</p>
        </div>
      ) : (
        <>
          <div className="bg-cosmic-900/70 p-4 sm:p-6 rounded-lg shadow-lg backdrop-blur-md">
            <div className="flex flex-col lg:flex-row justify-between">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold mb-2">{locationName}</h1>
                <div className="text-sm text-gray-300 mb-4">
                  {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                </div>

                <LocationDataSection
                  locationData={locationData}
                  language={language}
                  t={t}
                  sqmValue={sqmValue}
                />
                
                {locationData.latitude && locationData.longitude && locationData.bortleScale && (
                  <BortleScaleUpdater
                    latitude={locationData.latitude}
                    longitude={locationData.longitude}
                    currentBortleScale={locationData.bortleScale}
                    onBortleScaleUpdate={handleBortleScaleUpdate}
                  />
                )}
              </div>

              <div className="mt-4 lg:mt-0">
                <SIQSDataSection locationData={locationData} t={t} language={language} />
              </div>
            </div>

            <LocationQuickActions
              locationData={locationData}
              setShowEditDialog={setShowEditDialog}
              setIsMapViewActive={setIsMapViewActive}
              t={t}
            />
          </div>

          {locationData.weatherData && <WeatherDataSection locationData={locationData} language={language} t={t} />}

          {isMapViewActive && (
            <div className="bg-cosmic-900/70 p-4 sm:p-6 rounded-lg shadow-lg backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4">{t ? t("Map View", "地图视图") : "Map View"}</h2>
              <MapView
                latitude={locationData.latitude}
                longitude={locationData.longitude}
                name={locationName}
                bortleScale={locationData.bortleScale}
              />
            </div>
          )}

          <WeatherForecastSection
            locationData={locationData}
            language={language}
          />

          <LongRangeForecastSection
            locationData={locationData}
            language={language}
          />

          <LocationEditDialog
            isOpen={showEditDialog}
            onClose={() => setShowEditDialog(false)}
            locationData={locationData}
            onUpdateLocation={handleUpdateLocation}
            language={language}
          />
        </>
      )}
    </div>
  );
};

export default LocationDetailsContent;
