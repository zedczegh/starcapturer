import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCurrentPosition, ExtendedGeolocationOptions } from "@/utils/geolocationUtils";
import { useBortleUpdater } from "@/hooks/location/useBortleUpdater";
import BortleNowHeader from "@/components/bortleNow/BortleNowHeader";
import LocationSection from "@/components/bortleNow/LocationSection";
import BortleScaleDisplay from "@/components/bortleNow/BortleScaleDisplay";
import CameraMeasurementSection from "@/components/bortleNow/CameraMeasurementSection";
import CameraPermissionDialog from "@/components/bortleNow/CameraPermissionDialog";
import CountdownOverlay from "@/components/bortleNow/CountdownOverlay";
import BortleValidationDisplay from "@/components/bortleNow/BortleValidationDisplay";
import { AnimatePresence } from "framer-motion";
import { toast as sonnerToast } from "sonner";

interface BortleNowTabProps {
  initialLatitude?: number;
  initialLongitude?: number;
  locationName?: string;
}

const BortleNowTab: React.FC<BortleNowTabProps> = ({
  initialLatitude,
  initialLongitude,
  locationName: initialLocationName
}) => {
  const [latitude, setLatitude] = useState(initialLatitude?.toFixed(6) || "");
  const [longitude, setLongitude] = useState(initialLongitude?.toFixed(6) || "");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isMeasuringRealtime, setIsMeasuringRealtime] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState(initialLocationName || "");
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { updateBortleScale } = useBortleUpdater();
  
  const [bortleScale, setBortleScale] = useState<number | null>(null);
  const [starCount, setStarCount] = useState<number | null>(null);
  const [cameraReadings, setCameraReadings] = useState<{
    darkFrame: boolean;
    lightFrame: boolean;
  }>({
    darkFrame: false,
    lightFrame: false,
  });
  
  const [showCameraPermissionDialog, setShowCameraPermissionDialog] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [cameraMode, setCameraMode] = useState<"dark" | "light" | null>(null);
  
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const [validationResult, setValidationResult] = useState<{
    validatedScale: number;
    confidence: 'high' | 'medium' | 'low';
    sources: string[];
    adjustments: string[];
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const onLocationChange = useCallback((lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    
    updateBortleFromLocation(lat, lng);
  }, []);

  const updateBortleFromLocation = async (lat: number, lng: number) => {
    try {
      setIsMeasuringRealtime(true);
      setIsValidating(true);
      
      const updatedBortle = await updateBortleScale(lat, lng, locationName, null);
      
      const { validateBortleScale } = await import('@/utils/advancedBortleValidation');
      const validation = await validateBortleScale(lat, lng, locationName, updatedBortle);
      
      setValidationResult(validation);
      setBortleScale(validation.validatedScale);
      
      saveBortleMeasurement(lat, lng, validation.validatedScale, null);
    } catch (err) {
      console.error("Error updating Bortle scale:", err);
    } finally {
      setIsMeasuringRealtime(false);
      setIsValidating(false);
    }
  };

  const saveBortleMeasurement = (
    lat: number, 
    lng: number, 
    bortleValue: number, 
    starCountValue: number | null
  ) => {
    try {
      const measurement = {
        latitude: lat,
        longitude: lng,
        bortleScale: bortleValue,
        starCount: starCountValue,
        timestamp: new Date().toISOString(),
        method: starCountValue ? 'camera' : 'location'
      };
      
      const savedMeasurements = JSON.parse(localStorage.getItem('bortleMeasurements') || '[]');
      savedMeasurements.push(measurement);
      localStorage.setItem('bortleMeasurements', JSON.stringify(savedMeasurements));
    } catch (error) {
      console.error("Error saving Bortle measurement:", error);
    }
  };

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      sonnerToast.error(t("Geolocation is not supported by your browser", "您的浏览器不支持地理定位"));
      return;
    }
    
    setIsLoadingLocation(true);
    setError(null);
    
    const geolocationOptions: ExtendedGeolocationOptions = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
      language: language
    };
    
    getCurrentPosition(
      (position) => {
        setIsLoadingLocation(false);
        onLocationChange(position.coords.latitude, position.coords.longitude);
        
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json&accept-language=${language}`, {
          headers: {
            'User-Agent': 'StarCaptureApp/1.0',
            'Accept': 'application/json'
          }
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            if (data.display_name) {
              setLocationName(data.display_name.split(',').slice(0, 2).join(','));
            }
          })
          .catch(err => {
            console.error("Error fetching location name:", err);
            setLocationName(t('Unknown Location', '未知位置'));
          });
      },
      (error) => {
        setIsLoadingLocation(false);
        const errorMessage = error.code === 1 ? 
          t("Location access denied. Please enable location permissions.", "位置访问被拒绝。请启用位置权限。") :
          error.code === 2 ?
          t("Location unavailable. Please check your connection.", "位置不可用。请检查您的连接。") :
          error.code === 3 ?
          t("Location request timed out. Please try again.", "位置请求超时。请重试。") :
          error.message;
        setError(errorMessage);
        sonnerToast.error(errorMessage);
      },
      geolocationOptions
    );
  }, [language, onLocationChange, t]);

  useEffect(() => {
    if (initialLatitude && initialLongitude) {
      updateBortleFromLocation(initialLatitude, initialLongitude);
    } else {
      getCurrentLocation();
    }
    
    try {
      const lastMeasurement = JSON.parse(localStorage.getItem('bortleMeasurements') || '[]').pop();
      if (lastMeasurement && lastMeasurement.bortleScale) {
        const measurementTime = new Date(lastMeasurement.timestamp).getTime();
        const currentTime = new Date().getTime();
        const hoursDiff = (currentTime - measurementTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          if (lastMeasurement.starCount) {
            setStarCount(lastMeasurement.starCount);
          }
        }
      }
    } catch (error) {
      console.error("Error loading saved measurements:", error);
    }
  }, [initialLatitude, initialLongitude]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      handleCountdownComplete();
    }
  }, [countdown]);

  const handleCountdownComplete = async () => {
    setCountdown(null);
    if (cameraMode === "dark") {
      setCameraReadings(prev => ({ ...prev, darkFrame: true }));
    } else if (cameraMode === "light") {
      setCameraReadings(prev => ({ ...prev, lightFrame: true }));
    }
  };

  const handleCameraPermissionGranted = () => {
    setCameraPermissionGranted(true);
    setShowCameraPermissionDialog(false);
  };

  const handleStartMeasurement = async (mode: "dark" | "light") => {
    setCameraMode(mode);
    setCountdown(3);
  };

  const handleRetryCamera = () => {
    setCameraReadings({ darkFrame: false, lightFrame: false });
    setStarCount(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900/50 to-slate-900 pointer-events-none" />
      
      <div className="container mx-auto px-4 py-8 relative z-10 max-w-4xl">
        <BortleNowHeader />
        
        {error && (
          <div className="text-red-500 mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30 text-center">
            {error}
          </div>
        )}
        
        <LocationSection
          latitude={latitude}
          longitude={longitude}
          locationName={locationName}
          setLatitude={setLatitude}
          setLongitude={setLongitude}
          isLoadingLocation={isLoadingLocation}
        />
        
        <BortleScaleDisplay
          bortleScale={bortleScale}
          starCount={starCount}
          isMeasuringRealtime={isMeasuringRealtime}
          cameraReadings={cameraReadings}
          bortleDescription={validationResult ? `${validationResult.confidence} confidence` : null}
        />
        
        {validationResult && (
          <BortleValidationDisplay
            validatedScale={validationResult.validatedScale}
            confidence={validationResult.confidence}
            sources={validationResult.sources}
            adjustments={validationResult.adjustments}
            isValidating={isValidating}
          />
        )}
        
        <CameraMeasurementSection
          isProcessingImage={isProcessingImage}
          isMeasuringRealtime={isMeasuringRealtime}
          cameraReadings={cameraReadings}
          countdown={countdown}
          captureDarkFrame={() => handleStartMeasurement("dark")}
          captureLightFrame={() => handleStartMeasurement("light")}
        />
        
        <CameraPermissionDialog
          open={showCameraPermissionDialog}
          onPermissionResponse={(granted) => {
            if (granted) {
              handleCameraPermissionGranted();
            } else {
              setShowCameraPermissionDialog(false);
            }
          }}
        />
        
        <AnimatePresence>
          {countdown !== null && (
            <CountdownOverlay countdown={countdown} cameraMode={cameraMode} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BortleNowTab;
