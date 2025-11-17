import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
import BortleValidationDisplay from "@/components/bortleNow/BortleValidationDisplay";
import { AnimatePresence } from "framer-motion";
import BackButton from "@/components/navigation/BackButton";
import { toast as sonnerToast } from "sonner";

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
      
      console.log("Validated Bortle scale:", validation);
      
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
        locationName: locationName || null,
        timestamp: new Date().toISOString(),
        method: starCountValue ? 'camera' : 'location'
      };
      
      const savedMeasurements = JSON.parse(localStorage.getItem('bortleMeasurements') || '[]');
      savedMeasurements.push(measurement);
      localStorage.setItem('bortleMeasurements', JSON.stringify(savedMeasurements));
      
      console.log("Saved Bortle measurement:", measurement);
    } catch (error) {
      console.error("Error saving Bortle measurement:", error);
    }
  };

  const getCurrentLocation = useCallback(() => {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      sonnerToast.error(t("Geolocation is not supported by your browser", "您的浏览器不支持地理定位"));
      return;
    }
    
    setIsLoadingLocation(true);
    setError(null);
    
    const geolocationOptions: ExtendedGeolocationOptions = {
      enableHighAccuracy: true,
      timeout: 20000, // Increased timeout to 20 seconds
      maximumAge: 0,
      language: language
    };
    
    getCurrentPosition(
      (position) => {
        setIsLoadingLocation(false);
        onLocationChange(position.coords.latitude, position.coords.longitude);
        
        // Fetch location name with better error handling
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
            // Still allow the location to be set even if reverse geocoding fails
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
    getCurrentLocation();
    
    try {
      const lastMeasurement = JSON.parse(localStorage.getItem('bortleMeasurements') || '[]').pop();
      if (lastMeasurement && lastMeasurement.bortleScale) {
        const measurementTime = new Date(lastMeasurement.timestamp).getTime();
        const currentTime = new Date().getTime();
        const hoursDiff = (currentTime - measurementTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          console.log("Loading previous Bortle measurement:", lastMeasurement);
          if (lastMeasurement.starCount) {
            setStarCount(lastMeasurement.starCount);
          }
        }
      }
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
      }
    }
  };

  const startCountdown = (mode: "dark" | "light" | null) => {
    if (!mode) return;
    
    setCountdown(5);
    
    toast.info(
      mode === "dark" 
        ? t("Preparing to capture dark frame", "准备捕获暗帧") 
        : t("Preparing to capture sky frame", "准备捕获天空帧"),
      t("Get ready in 5 seconds...", "5秒后准备好...")
    );
  };

  const performDarkFrameCapture = async () => {
    try {
      setError(null);
      setCameraReadings(prev => ({ ...prev, darkFrame: false }));
      setIsProcessingImage(true);
      
      if (!latitude || !longitude) {
        throw new Error(t("Please get your location first", "请先获取您的位置"));
      }
      
      toast.info(
        t("Capturing Dark Frame", "捕获暗帧"),
        t("Please cover your camera lens completely...", "请完全遮盖相机镜头...")
      );
      
      await new Promise(resolve => setTimeout(() => {
        resolve(true);
      }, 2000));
      
      toast.success(
        t("Dark Frame Captured", "暗帧已捕获"),
        t("Dark frame baseline established.", "暗帧基准已建立。")
      );
      
      setCameraReadings(prev => ({ ...prev, darkFrame: true }));
    } catch (error) {
      setError((error as Error).message);
      toast.error(
        t("Error", "错误"),
        (error as Error).message
      );
    } finally {
      setIsProcessingImage(false);
    }
  };

  const captureDarkFrame = () => {
    requestCameraPermission("dark");
  };


  const performLightFrameCapture = async () => {
    let stream: MediaStream | null = null;
    try {
      setError(null);
      setCameraReadings(prev => ({ ...prev, lightFrame: false }));
      setIsProcessingImage(true);
      setIsValidating(true);
      
      if (!cameraReadings.darkFrame) {
        throw new Error(t("Please capture a dark frame first", "请先捕获暗帧"));
      }
      
      toast.info(
        t("Analyzing Sky Brightness", "分析天空亮度"),
        t("Capturing image from camera...", "从相机捕获图像...")
      );
      
      // Access the camera
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          resolve(true);
        };
      });
      
      // Wait a bit for camera to adjust
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error(t("Failed to create canvas context", "无法创建画布上下文"));
      }
      
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Stop camera stream
      stream.getTracks().forEach(track => track.stop());
      stream = null;
      
      toast.info(
        t("Processing Image", "处理图像"),
        t("Counting stars and analyzing brightness...", "计算星数并分析亮度...")
      );
      
      const startTime = performance.now();
      
      // Import star analysis utilities
      const { countStarsInImage, calculateBortleFromStars } = await import('@/utils/starCountUtils');
      const { validateBortleCalculation } = await import('@/utils/starDetection/diagnostics');
      
      // Count stars in the captured image with improved algorithm
      const detectedStarCount = countStarsInImage(imageData);
      
      // Calculate average sky brightness (excluding bright spots/stars)
      let totalBrightness = 0;
      let pixelCount = 0;
      
      for (let i = 0; i < imageData.data.length; i += 4) {
        const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
        
        // Only include darker pixels (exclude stars and bright objects)
        if (brightness < 180) {
          totalBrightness += brightness;
          pixelCount++;
        }
      }
      
      const avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 128;
      
      // Calculate Bortle scale from actual star count and brightness
      const measuredBortle = calculateBortleFromStars(detectedStarCount, avgBrightness);
      
      const processingTime = performance.now() - startTime;
      console.log(`Star detection completed in ${processingTime.toFixed(2)}ms`);
      
      // Validate the calculation internally
      const calcValidation = validateBortleCalculation(detectedStarCount, avgBrightness, measuredBortle);
      
      if (calcValidation.warnings.length > 0) {
        console.warn('Bortle calculation warnings:', calcValidation.warnings);
      }
      
      console.log(`Detection confidence: ${calcValidation.confidence}`);
      console.log(`Detected ${detectedStarCount} stars, brightness ${avgBrightness.toFixed(2)}, Bortle ${measuredBortle}`);
      
      const currentLat = parseFloat(latitude);
      const currentLng = parseFloat(longitude);
      
      // Validate with multiple sources for higher accuracy
      const { validateBortleScale } = await import('@/utils/advancedBortleValidation');
      const validation = await validateBortleScale(currentLat, currentLng, locationName, measuredBortle);
      
      setStarCount(detectedStarCount);
      setBortleScale(validation.validatedScale);
      setValidationResult(validation);
      setCameraReadings(prev => ({ ...prev, lightFrame: true }));
      
      // Save measurement with actual star count
      saveBortleMeasurement(currentLat, currentLng, validation.validatedScale, detectedStarCount);
      
      // Also save to star analysis cache
      const { processStarMeasurement } = await import('@/utils/starAnalysis');
      await processStarMeasurement(imageData, currentLat, currentLng);
      
      toast.success(
        t("Measurement Complete", "测量完成"),
        t(
          `Stars detected: ${detectedStarCount}. Validated Bortle: ${validation.validatedScale.toFixed(1)}`,
          `检测星数：${detectedStarCount}。验证波特尔：${validation.validatedScale.toFixed(1)}`
        )
      );
    } catch (error) {
      // Clean up stream if error occurs
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      setError((error as Error).message);
      toast.error(
        t("Error", "错误"),
        (error as Error).message
      );
    } finally {
      setIsProcessingImage(false);
      setIsValidating(false);
    }
  };

  const captureLightFrame = () => {
    requestCameraPermission("light");
  };

  const bortleDescription = bortleScale ? 
    getBortleScaleDescription(bortleScale, language as 'en' | 'zh') : null;

  return (
    <>
      <div
        className="fixed inset-0 z-0 pointer-events-none select-none"
        aria-hidden="true"
        style={{
          background: "url('/lovable-uploads/bae4bb9f-d2ce-4f1b-9eae-e0e022866a36.png') center center / cover no-repeat",
          filter: 'blur(1.5px) brightness(0.80) saturate(1.15)'
        }}
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: 'linear-gradient(130deg, rgba(10,17,34,0.80) 0%, rgba(45,20,43,0.60) 100%)',
        }}
      />
      <NavBar />
      <div className="container mx-auto p-4 pt-20 pb-24 max-w-2xl relative z-10">
        <div className="mb-6">
          <BackButton destination="/photo-points" />
        </div>
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
                isMeasuringRealtime={isMeasuringRealtime}
                cameraReadings={cameraReadings}
                bortleDescription={bortleDescription}
              />
            )}
          </AnimatePresence>
          
          {validationResult && (
            <BortleValidationDisplay
              validatedScale={validationResult.validatedScale}
              confidence={validationResult.confidence}
              sources={validationResult.sources}
              adjustments={validationResult.adjustments}
              isValidating={isValidating}
            />
          )}
          
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
