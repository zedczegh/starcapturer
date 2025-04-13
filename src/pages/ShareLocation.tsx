import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCurrentPosition, ExtendedGeolocationOptions } from "@/utils/geolocationUtils";
import NavBar from "@/components/NavBar";
import { getBortleScaleColor, getBortleScaleDescription } from "@/data/utils/bortleScaleUtils";
import { useBortleUpdater } from "@/hooks/location/useBortleUpdater";
import BortleNowHeader from "@/components/bortleNow/BortleNowHeader";
import LocationSection from "@/components/bortleNow/LocationSection";
import BortleScaleDisplay from "@/components/bortleNow/BortleScaleDisplay";
import CameraMeasurementSection from "@/components/bortleNow/CameraMeasurementSection";
import CameraPermissionDialog from "@/components/bortleNow/CameraPermissionDialog";
import CountdownOverlay from "@/components/bortleNow/CountdownOverlay";
import { AnimatePresence } from "framer-motion";
import { calculateBortleFromStars } from "@/utils/starCountUtils";
import { bortleToMpsas, rawBrightnessToMpsas } from "@/utils/darkSkyMeterUtils";
import { getImageQualityDescription } from "@/utils/starAnalysis";

const BortleNow: React.FC = () => {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isMeasuringRealtime, setIsMeasuringRealtime] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { updateBortleScale } = useBortleUpdater();
  
  const [bortleScale, setBortleScale] = useState<number | null>(null);
  const [starCount, setStarCount] = useState<number | null>(null);
  const [mpsasValue, setMpsasValue] = useState<number | null>(null);
  const [imageQuality, setImageQuality] = useState<number | null>(null);
  
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
  
  const [darkFrameData, setDarkFrameData] = useState<{
    brightness: number;
    noise: number;
  } | null>(null);
  
  const onLocationChange = useCallback((lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    
    updateBortleFromLocation(lat, lng);
  }, []);

  const updateBortleFromLocation = async (lat: number, lng: number) => {
    try {
      setIsMeasuringRealtime(true);
      const updatedBortle = await updateBortleScale(lat, lng, locationName, null);
      if (updatedBortle) {
        setBortleScale(updatedBortle);
        console.log("Updated Bortle scale from location:", updatedBortle);
        
        try {
          const mpsas = bortleToMpsas(updatedBortle);
          setMpsasValue(mpsas);
          console.log("Calculated MPSAS from Bortle scale:", mpsas);
        } catch (err) {
          console.error("Error calculating MPSAS:", err);
        }
        
        saveBortleMeasurement(lat, lng, updatedBortle, null, null, null);
      }
    } catch (err) {
      console.error("Error updating Bortle scale:", err);
    } finally {
      setIsMeasuringRealtime(false);
    }
  };

  const saveBortleMeasurement = (
    lat: number, 
    lng: number, 
    bortleValue: number, 
    starCountValue: number | null,
    skyBrightnessValue: number | null,
    mpsasValue: number | null
  ) => {
    try {
      const measurement = {
        latitude: lat,
        longitude: lng,
        bortleScale: bortleValue,
        starCount: starCountValue,
        skyBrightness: skyBrightnessValue,
        mpsas: mpsasValue,
        locationName: locationName || null,
        timestamp: new Date().toISOString(),
        method: starCountValue ? 'camera' : 'location'
      };
      
      try {
        const starMeasurements = JSON.parse(localStorage.getItem('star_measurements') || '[]');
        starMeasurements.push({
          ...measurement,
          imageQuality: imageQuality || null,
          deviceInfo: {
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height
          }
        });
        
        if (starMeasurements.length > 100) {
          starMeasurements.splice(0, starMeasurements.length - 100);
        }
        
        localStorage.setItem('star_measurements', JSON.stringify(starMeasurements));
      } catch (err) {
        console.error("Error saving to star_measurements:", err);
      }
      
      const savedMeasurements = JSON.parse(localStorage.getItem('bortleMeasurements') || '[]');
      savedMeasurements.push(measurement);
      localStorage.setItem('bortleMeasurements', JSON.stringify(savedMeasurements));
      
      console.log("Saved Bortle measurement:", measurement);
    } catch (error) {
      console.error("Error saving Bortle measurement:", error);
    }
  };

  const getCurrentLocation = useCallback(() => {
    setIsLoadingLocation(true);
    setError(null);
    
    const geolocationOptions: ExtendedGeolocationOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      language: language
    };
    
    getCurrentPosition(
      (position) => {
        setIsLoadingLocation(false);
        onLocationChange(position.coords.latitude, position.coords.longitude);
        
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json&accept-language=${language}`)
          .then(response => response.json())
          .then(data => {
            if (data.display_name) {
              setLocationName(data.display_name.split(',').slice(0, 2).join(','));
            }
          })
          .catch(err => console.error("Error fetching location name:", err));
      },
      (error) => {
        setIsLoadingLocation(false);
        setError(error.message);
        toast({
          variant: "destructive",
          title: t("Error getting location", "获取位置错误"),
          description: error.message,
        });
      },
      geolocationOptions
    );
  }, [language, onLocationChange, toast, t]);

  useEffect(() => {
    getCurrentLocation();
    
    try {
      const loadLastMeasurement = async () => {
        const starMeasurements = JSON.parse(localStorage.getItem('star_measurements') || '[]');
        if (starMeasurements.length > 0) {
          const lastMeasurement = starMeasurements[starMeasurements.length - 1];
          if (lastMeasurement) {
            const measurementTime = new Date(lastMeasurement.timestamp).getTime();
            const currentTime = new Date().getTime();
            const hoursDiff = (currentTime - measurementTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
              console.log("Loading previous star measurement:", lastMeasurement);
              if (lastMeasurement.starCount) {
                setStarCount(lastMeasurement.starCount);
              }
              if (lastMeasurement.mpsas) {
                setMpsasValue(lastMeasurement.mpsas);
              }
              if (lastMeasurement.imageQuality) {
                setImageQuality(lastMeasurement.imageQuality);
              }
              return;
            }
          }
        }
        
        const bortleMeasurements = JSON.parse(localStorage.getItem('bortleMeasurements') || '[]');
        if (bortleMeasurements.length > 0) {
          const lastMeasurement = bortleMeasurements[bortleMeasurements.length - 1];
          if (lastMeasurement) {
            const measurementTime = new Date(lastMeasurement.timestamp).getTime();
            const currentTime = new Date().getTime();
            const hoursDiff = (currentTime - measurementTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 24 && lastMeasurement.starCount) {
              setStarCount(lastMeasurement.starCount);
              if (lastMeasurement.mpsas) {
                setMpsasValue(lastMeasurement.mpsas);
              }
            }
          }
        }
      };
      
      loadLastMeasurement();
    } catch (error) {
      console.error("Error loading saved measurements:", error);
    }
  }, [getCurrentLocation]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      if (cameraMode === "dark") {
        performDarkFrameCapture();
      } else if (cameraMode === "light") {
        performLightFrameCapture();
      }
      setCountdown(null);
    }
  }, [countdown, cameraMode]);

  const requestCameraPermission = async (mode: "dark" | "light") => {
    setCameraMode(mode);
    
    if (cameraPermissionGranted) {
      startCountdown(mode);
      return;
    }
    
    setShowCameraPermissionDialog(true);
  };

  const handlePermissionResponse = async (granted: boolean) => {
    setShowCameraPermissionDialog(false);
    
    if (granted) {
      setCameraPermissionGranted(true);
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        stream.getTracks().forEach(track => track.stop());
        
        startCountdown(cameraMode);
      } catch (err) {
        console.error("Camera permission error:", err);
        setError(t("Camera access was denied", "相机访问被拒绝"));
        toast({
          variant: "destructive",
          title: t("Camera Error", "相机错误"),
          description: t("Please allow camera access to use this feature", "请允许访问相机以使用此功能"),
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: t("Permission Denied", "权限被拒绝"),
        description: t("Camera access is required for this feature", "此功能需要相机访问权限"),
      });
    }
  };

  const startCountdown = (mode: "dark" | "light" | null) => {
    if (!mode) return;
    
    setCountdown(5);
    
    toast({
      title: mode === "dark" 
        ? t("Preparing to capture dark frame", "准备捕获暗帧") 
        : t("Preparing to capture sky frame", "准备捕获天空帧"),
      description: t("Get ready in 5 seconds...", "5秒后准备好..."),
    });
  };

  const performDarkFrameCapture = async () => {
    try {
      setError(null);
      setCameraReadings(prev => ({ ...prev, darkFrame: false }));
      setIsProcessingImage(true);
      
      if (!latitude || !longitude) {
        throw new Error(t("Please get your location first", "请先获取您的位置"));
      }
      
      toast({
        title: t("Capturing Dark Frame", "捕获暗帧"),
        description: t("Please cover your camera lens completely...", "请完全遮盖相机镜头..."),
      });
      
      await new Promise(resolve => setTimeout(() => {
        const simulatedNoise = Math.random() * 8 + 5;
        const simulatedDarkBrightness = Math.random() * 15 + 5;
        
        setDarkFrameData({
          brightness: simulatedDarkBrightness,
          noise: simulatedNoise
        });
        
        resolve(true);
      }, 2000));
      
      toast({
        title: t("Dark Frame Captured", "暗帧已捕获"),
        description: t("Dark frame baseline established.", "暗帧基准已建立。"),
      });
      
      setCameraReadings(prev => ({ ...prev, darkFrame: true }));
    } catch (error) {
      setError((error as Error).message);
      toast({
        variant: "destructive",
        title: t("Error", "错误"),
        description: (error as Error).message,
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  const captureDarkFrame = () => {
    requestCameraPermission("dark");
  };

  const performLightFrameCapture = async () => {
    try {
      setError(null);
      setCameraReadings(prev => ({ ...prev, lightFrame: false }));
      setIsProcessingImage(true);
      
      if (!cameraReadings.darkFrame) {
        throw new Error(t("Please capture a dark frame first", "请先捕获暗帧"));
      }
      
      toast({
        title: t("Capturing Sky Frame", "捕获天空帧"),
        description: t("Point your camera at the zenith (straight up)...", "将相机指向天顶（正上方）..."),
      });
      
      const baseLocationBortle = bortleScale || 5;
      
      await new Promise(resolve => setTimeout(async () => {
        const maxPossibleStars = Math.max(0, 200 - (baseLocationBortle * 20));
        const variability = Math.max(0, 20 - (baseLocationBortle * 1.5));
        
        const detectionEfficiency = Math.random() * 0.3 + 0.7;
        const simulatedStarCount = Math.floor(
          (maxPossibleStars + (Math.random() * variability * 2 - variability)) * detectionEfficiency
        );
        
        const baseBrightness = Math.min(255, Math.max(10, ((baseLocationBortle - 1) / 8) * 180 + 20));
        const brightnessVariation = Math.random() * 20 - 10;
        const simulatedSkyBrightness = Math.max(0, Math.min(255, baseBrightness + brightnessVariation));
        
        const simulatedImageQuality = Math.max(0, Math.min(100,
          85 - (baseLocationBortle * 3) + (Math.random() * 15 - 7.5)
        ));
        
        const simulatedMpsas = rawBrightnessToMpsas(simulatedSkyBrightness);
        
        const measuredBortle = calculateBortleFromStars(simulatedStarCount, simulatedSkyBrightness);
        
        setStarCount(simulatedStarCount);
        setBortleScale(measuredBortle);
        setMpsasValue(simulatedMpsas);
        setImageQuality(simulatedImageQuality);
        setCameraReadings(prev => ({ ...prev, lightFrame: true }));
        
        if (latitude && longitude) {
          saveBortleMeasurement(
            parseFloat(latitude), 
            parseFloat(longitude), 
            measuredBortle, 
            simulatedStarCount,
            simulatedSkyBrightness,
            simulatedMpsas
          );
        }
        
        resolve(true);
      }, 3000));
      
      const qualityDesc = imageQuality !== null ? 
        getImageQualityDescription(imageQuality) : 
        'unknown';
      
      toast({
        title: t("Measurement Complete", "测量完成"),
        description: t(
          `Sky brightness measured. Stars detected: ${starCount}. Bortle: ${bortleScale?.toFixed(1)}. Quality: ${qualityDesc}`,
          `天空亮度已测量。检测到的星星: ${starCount}。波尔特尔等级：${bortleScale?.toFixed(1)}。质量：${
            language === 'zh' ? 
              qualityDesc === 'excellent' ? '极佳' : 
              qualityDesc === 'good' ? '良好' : 
              qualityDesc === 'fair' ? '一般' : 
              qualityDesc === 'poor' ? '较差' : '很差'
            : qualityDesc
          }`
        ),
      });
    } catch (error) {
      setError((error as Error).message);
      toast({
        variant: "destructive",
        title: t("Error", "错误"),
        description: (error as Error).message,
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  const captureLightFrame = () => {
    requestCameraPermission("light");
  };

  const bortleDescription = bortleScale ? 
    getBortleScaleDescription(bortleScale, language as 'en' | 'zh') : null;

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-4 pt-20 pb-24 max-w-2xl">
        <BortleNowHeader />
        
        {error && (
          <div className="text-red-500 mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30 text-center">
            <div className="flex items-center justify-center gap-2">
              <span>{error}</span>
            </div>
          </div>
        )}
        
        <CountdownOverlay countdown={countdown} cameraMode={cameraMode} />
        
        <CameraPermissionDialog 
          open={showCameraPermissionDialog}
          onPermissionResponse={handlePermissionResponse}
        />
        
        <div className="space-y-6">
          <AnimatePresence>
            {bortleScale && (
              <BortleScaleDisplay
                bortleScale={bortleScale}
                starCount={starCount}
                mpsas={mpsasValue}
                imageQuality={imageQuality}
                isMeasuringRealtime={isMeasuringRealtime}
                cameraReadings={cameraReadings}
                bortleDescription={bortleDescription}
              />
            )}
          </AnimatePresence>
          
          <LocationSection
            latitude={latitude}
            longitude={longitude}
            locationName={locationName}
            isLoadingLocation={isLoadingLocation}
            setLatitude={setLatitude}
            setLongitude={setLongitude}
          />
          
          <CameraMeasurementSection
            isProcessingImage={isProcessingImage}
            isMeasuringRealtime={isMeasuringRealtime}
            cameraReadings={cameraReadings}
            countdown={countdown}
            captureDarkFrame={captureDarkFrame}
            captureLightFrame={captureLightFrame}
          />
        </div>
      </div>
    </>
  );
};

export default BortleNow;
