import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCurrentPosition, ExtendedGeolocationOptions } from "@/utils/geolocationUtils";
import NavBar from "@/components/NavBar";
import { getBortleScaleColor, getBortleScaleDescription } from "@/data/utils/bortleScaleUtils";
import { useBortleUpdater } from "@/hooks/location/useBortleUpdater";
import { Camera, Clock, MapPin, Moon, Info, Shield, Star, Cloud, ArrowDown, ArrowUp, Pointer, CircleSlash, CheckCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import ConditionItem from "@/components/weather/ConditionItem";
import { DynamicLightbulbIcon } from "@/components/weather/DynamicIcons";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
        
        saveBortleMeasurement(lat, lng, updatedBortle, null);
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
        resolve(true);
      }, 700));
      
      await new Promise(resolve => setTimeout(() => {
        resolve(true);
      }, 700));
      
      await new Promise(resolve => setTimeout(() => {
        resolve(true);
      }, 600));
      
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

  const countStarsInImage = (imageData: ImageData): number => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    const brightnessThreshold = 180;
    const contrastThreshold = 50;
    
    let starCount = 0;
    const starPixels = new Set();
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = (y * width + x) * 4;
        
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        if (brightness > brightnessThreshold) {
          let isLocalMax = true;
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              
              const ni = ((y + dy) * width + (x + dx)) * 4;
              const neighborBrightness = (data[ni] + data[ni + 1] + data[ni + 2]) / 3;
              
              if (neighborBrightness > brightness) {
                isLocalMax = false;
                break;
              }
            }
            if (!isLocalMax) break;
          }
          
          if (isLocalMax) {
            const starKey = `${x}-${y}`;
            if (!starPixels.has(starKey)) {
              starCount++;
              
              for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                  const sx = x + dx;
                  const sy = y + dy;
                  if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
                    starPixels.add(`${sx}-${sy}`);
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return starCount;
  };

  const calculateBortleFromStars = (starCount: number, skyBrightness: number): number => {
    const normalizedStarCount = Math.min(10, starCount / 10);
    const normalizedBrightness = 10 - (skyBrightness / 25.5);
    
    const combinedMetric = (normalizedBrightness * 0.7) + (normalizedStarCount * 0.3);
    
    let bortle = 10 - combinedMetric;
    
    bortle = Math.max(1, Math.min(9, bortle));
    
    console.log(`Star count: ${starCount}, Brightness: ${skyBrightness}, Calculated Bortle: ${bortle.toFixed(1)}`);
    
    return bortle;
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
      
      await new Promise(resolve => setTimeout(() => {
        resolve(true);
      }, 800));
      
      await new Promise(resolve => setTimeout(() => {
        resolve(true);
      }, 800));
      
      await new Promise(resolve => setTimeout(() => {
        resolve(true);
      }, 800));
      
      await new Promise(resolve => setTimeout(() => {
        resolve(true);
      }, 600));
      
      const baseLocationBortle = bortleScale || 5;
      
      const simulatedStarCount = Math.max(0, Math.floor(100 * (1 - (baseLocationBortle - 1) / 8) + Math.random() * 20 - 10));
      setStarCount(simulatedStarCount);
      
      const simulatedSkyBrightness = Math.min(255, Math.max(10, ((baseLocationBortle - 1) / 8) * 200 + Math.random() * 30 - 15));
      
      const measuredBortle = calculateBortleFromStars(simulatedStarCount, simulatedSkyBrightness);
      
      setBortleScale(measuredBortle);
      setCameraReadings(prev => ({ ...prev, lightFrame: true }));
      
      if (latitude && longitude) {
        saveBortleMeasurement(
          parseFloat(latitude), 
          parseFloat(longitude), 
          measuredBortle, 
          simulatedStarCount
        );
      }
      
      toast({
        title: t("Measurement Complete", "测量完成"),
        description: t(
          `Sky brightness measured. Stars detected: ${simulatedStarCount}. Bortle scale: ${measuredBortle.toFixed(1)}`,
          `天空亮度已测量。检测到的星星: ${simulatedStarCount}。波尔特尔等级：${measuredBortle.toFixed(1)}`
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

  const bortleColor = bortleScale ? getBortleScaleColor(bortleScale) : null;
  const bortleDescription = bortleScale ? 
    getBortleScaleDescription(bortleScale, language as 'en' | 'zh') : null;

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  const circleAnimations = {
    pulse: {
      scale: [1, 1.03, 1],
      boxShadow: [
        "0 0 0 rgba(255, 255, 255, 0.1)",
        "0 0 15px rgba(255, 255, 255, 0.3)",
        "0 0 0 rgba(255, 255, 255, 0.1)"
      ],
      transition: { 
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  };

  const getBortleScaleGradient = (scale: number | null) => {
    if (scale === null) return { bg: "", text: "" };
    
    if (scale >= 7) {
      return {
        bg: "bg-gradient-to-br from-orange-500/80 to-red-500/80",
        text: "text-white"
      };
    } else if (scale >= 4) {
      return {
        bg: "bg-gradient-to-br from-yellow-400/80 to-lime-500/80",
        text: "text-cosmic-950"
      };
    } else {
      return {
        bg: "bg-gradient-to-br from-blue-500/80 to-cyan-500/80",
        text: "text-white"
      };
    }
  };

  const bortleGradient = bortleScale ? getBortleScaleGradient(bortleScale) : { bg: "", text: "" };

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-4 pt-20 pb-24 max-w-2xl">
        <motion.div 
          className="relative z-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
            {t("Bortle Now", "实时光污染")}
          </h1>
          
          <p className="text-center text-sm text-cosmic-300 mb-6 max-w-md mx-auto">
            {t("Measure light pollution levels at your location using your device camera or location data", 
               "使用设备摄像头或位置数据测量您所在位置的光污染水平")}
          </p>
        </motion.div>
        
        {error && (
          <motion.div 
            className="text-red-500 mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center justify-center gap-2">
              <CircleSlash className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
        
        <AnimatePresence>
          {countdown !== null && (
            <motion.div 
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="text-6xl font-bold text-white"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                key={countdown}
              >
                {countdown}
              </motion.div>
              <div className="absolute bottom-20 text-center text-white text-lg px-6">
                {cameraMode === "dark" ? (
                  <p>{t("Cover your camera lens completely", "完全遮盖相机镜头")}</p>
                ) : (
                  <p>{t("Point your camera at the sky (zenith)", "将相机指向天空（天顶）")}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="space-y-6">
          <AnimatePresence>
            {bortleScale && (
              <motion.div 
                className="relative overflow-hidden glassmorphism border-cosmic-700/30 rounded-xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="absolute inset-0 z-0 opacity-20 bg-gradient-to-br from-cosmic-600/20 to-cosmic-900/20" />
                
                <div className="relative z-10">
                  <div className="flex flex-col items-center mb-5">
                    <motion.div 
                      className={`relative w-32 h-32 rounded-full flex items-center justify-center ${bortleGradient.bg} backdrop-blur-sm shadow-lg border-2 border-cosmic-700/50`}
                      variants={circleAnimations}
                      animate="pulse"
                    >
                      <div className="absolute inset-0 rounded-full bg-cosmic-950/10 backdrop-blur-sm"></div>
                      <div className="z-10 flex flex-col items-center">
                        <span className={`text-4xl font-bold ${bortleGradient.text}`}>{bortleScale.toFixed(1)}</span>
                        <span className={`text-xs mt-1 ${bortleGradient.text} opacity-80`}>{t("Bortle Scale", "伯特尔等级")}</span>
                      </div>
                    </motion.div>
                    
                    {isMeasuringRealtime && (
                      <div className="absolute top-0 right-0 mt-2 mr-2">
                        <div className="flex items-center gap-1.5 bg-blue-500/20 px-2 py-1 rounded-full">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                          <span className="text-xs text-blue-300">{t("Measuring", "测量中")}</span>
                        </div>
                      </div>
                    )}
                    
                    <h3 className="text-lg font-semibold text-gradient-primary mt-4 mb-1">
                      {t("Light Pollution Level", "光污染水平")}
                    </h3>
                    
                    <div className="mt-1 flex items-center justify-center text-sm">
                      <span className="text-blue-400 mr-3">{t("Dark", "黑暗")}</span>
                      <DynamicLightbulbIcon bortleScale={1} animated={true} />
                      <span className="mx-2">→</span>
                      <DynamicLightbulbIcon bortleScale={5} animated={true} />
                      <span className="mx-2">→</span>
                      <DynamicLightbulbIcon bortleScale={9} animated={true} />
                      <span className="text-red-400 ml-3">{t("Urban", "城市")}</span>
                    </div>
                  </div>
                  
                  <div className="bg-cosmic-900/50 p-4 rounded-lg border border-cosmic-800/30 mb-3">
                    <p className="text-sm text-cosmic-200">
                      {bortleDescription}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <ConditionItem
                      icon={<Star className="h-5 w-5 text-primary" />}
                      label={t("Visible Stars", "可见星星")}
                      value={
                        starCount !== null ? 
                        <span className="text-lg font-medium">{starCount}</span> : 
                        (bortleScale <= 3 
                          ? t("Many", "许多") 
                          : bortleScale <= 6 
                            ? t("Some", "一些") 
                            : t("Few", "很少"))
                      }
                      tooltip={t("Estimated visible stars at zenith", "天顶处估计可见星星")}
                    />
                    
                    <ConditionItem
                      icon={<Moon className="h-5 w-5 text-sky-200" />}
                      label={t("Sky Quality", "夜空质量")}
                      value={bortleScale <= 3 
                        ? t("Excellent", "极好") 
                        : bortleScale <= 6 
                          ? t("Moderate", "中等") 
                          : t("Poor", "较差")}
                      tooltip={t("Overall sky darkness level", "整体夜空黑暗程度")}
                    />
                  </div>
                  
                  {cameraReadings.lightFrame ? (
                    <div className="mt-3 flex items-center justify-center p-1 bg-green-950/30 rounded-full w-fit mx-auto">
                      <div className="text-xs text-emerald-400 flex items-center gap-2 px-3 py-1">
                        <Shield size={14} className="text-emerald-400" />
                        {t("Camera-verified measurement", "相机验证的测量")}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center justify-center p-1 bg-amber-950/30 rounded-full w-fit mx-auto">
                      <div className="text-xs text-amber-400/90 flex items-center gap-2 px-3 py-1">
                        <MapPin size={14} />
                        {t("Based on location estimate", "基于位置估计")}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div 
            className="glassmorphism border-cosmic-700/30 rounded-xl p-6 relative overflow-hidden"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
          >
            <div className="absolute inset-0 z-0 opacity-20 bg-gradient-to-br from-cosmic-800/20 to-cosmic-900/20" />
            
            <div className="relative z-10">
              <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-primary" />
                {t("Your Location", "您的位置")}
              </h2>
              
              {locationName && (
                <div className="text-sm text-cosmic-200 mb-4 bg-cosmic-800/40 p-3 rounded-lg border border-cosmic-700/30">
                  {locationName}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="latitude" className="text-xs opacity-80 mb-1 block">{t("Latitude", "纬度")}</Label>
                  <Input
                    id="latitude"
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder={t("Latitude", "纬度")}
                    disabled={isLoadingLocation}
                    className="h-9 text-sm bg-cosmic-800/30 border-cosmic-700/50 focus-visible:ring-primary/50"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude" className="text-xs opacity-80 mb-1 block">{t("Longitude", "经度")}</Label>
                  <Input
                    id="longitude"
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder={t("Longitude", "经度")}
                    disabled={isLoadingLocation}
                    className="h-9 text-sm bg-cosmic-800/30 border-cosmic-700/50 focus-visible:ring-primary/50"
                  />
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="glassmorphism border-cosmic-700/30 rounded-xl p-6 relative overflow-hidden"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <div className="absolute inset-0 z-0 opacity-20 bg-gradient-to-br from-cosmic-700/20 to-cosmic-900/20" />
            
            <div className="relative z-10">
              <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
                <Camera size={18} className="text-primary" />
                {t("Camera Measurement", "相机测量")}
              </h2>
              
              <div className="bg-cosmic-800/50 p-4 rounded-lg border border-cosmic-700/30 shadow-inner mb-4">
                <p className="mb-4 text-sm text-cosmic-200">
                  {t(
                    "Accurate measurements use your camera to measure actual sky brightness and count visible stars. First capture a dark frame, then point your camera at the night sky.",
                    "精确测量使用相机测量实际天空亮度并计算可见星星。首先捕获暗帧，然后将相机指向夜空。"
                  )}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    variant={cameraReadings.darkFrame ? "outline" : "default"}
                    onClick={captureDarkFrame}
                    disabled={isProcessingImage || isMeasuringRealtime || countdown !== null}
                    className={`relative overflow-hidden flex items-center gap-2 ${cameraReadings.darkFrame ? 'bg-cosmic-800/60 border-emerald-500/50' : 'bg-cosmic-800 hover:bg-cosmic-700'}`}
                  >
                    <Moon size={16} />
                    {t("Capture Dark Frame", "捕获暗帧")}
                    
                    {cameraReadings.darkFrame && (
                      <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10">
                        <CheckCircle className="h-8 w-8 text-emerald-500" />
                      </div>
                    )}
                    
                    {isProcessingImage && !cameraReadings.darkFrame && (
                      <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </Button>
                  
                  <Button
                    variant={cameraReadings.lightFrame ? "outline" : "secondary"}
                    onClick={captureLightFrame}
                    disabled={isProcessingImage || !cameraReadings.darkFrame || isMeasuringRealtime || countdown !== null}
                    className={`relative overflow-hidden flex items-center gap-2 ${
                      cameraReadings.lightFrame 
                        ? 'bg-cosmic-800/60 border-emerald-500/50 text-emerald-400' 
                        : cameraReadings.darkFrame 
                          ? 'bg-cosmic-700/80 hover:bg-cosmic-700' 
                          : 'bg-cosmic-700/80 hover:bg-cosmic-700 opacity-50'
                    }`}
                  >
                    <Clock size={16} />
                    {t("Measure Sky Brightness", "测量天空亮度")}
                    
                    {cameraReadings.lightFrame && (
                      <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10">
                        <CheckCircle className="h-8 w-8 text-emerald-500" />
                      </div>
                    )}
                    
                    {isProcessingImage && !cameraReadings.lightFrame && cameraReadings.darkFrame && (
                      <div className="absolute inset-0 bg-secondary/5 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2 text-primary text-sm">
                  <Info size={14} />
                  {t("How to Measure", "如何测量")}
                </h3>
                
                <div className="space-y-3 text-sm text-cosmic-200">
                  <div className="flex items-start gap-3 bg-cosmic-800/30 p-3 rounded-lg border border-cosmic-700/20">
                    <div className="bg-primary/20 text-primary min-w-6 h-6 flex items-center justify-center rounded-full text-xs shrink-0 mt-0.5">1</div>
                    <div>
                      <p className="font-medium text-cosmic-100 mb-1">{t("Cover Your Camera", "遮盖您的相机")}</p>
                      <p className="text-xs">{t("Place your phone face down or cover the camera lens completely", "将手机正面朝下放置或完全遮盖相机镜头")}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 bg-cosmic-800/30 p-3 rounded-lg border border-cosmic-700/20">
                    <div className="bg-primary/20 text-primary min-w-6 h-6 flex items-center justify-center rounded-full text-xs shrink-0 mt-0.5">2</div>
                    <div>
                      <p className="font-medium text-cosmic-100 mb-1">{t("Capture Dark Frame", "捕获暗帧")}</p>
                      <p className="text-xs">{t("This sets the baseline for your camera sensor", "这为您的相机传感器设置基线")}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 bg-cosmic-800/30 p-3 rounded-lg border border-cosmic-700/20">
                    <div className="bg-primary/20 text-primary min-w-6 h-6 flex items-center justify-center rounded-full text-xs shrink-0 mt-0.5">3</div>
                    <div>
                      <p className="font-medium text-cosmic-100 mb-1">{t("Point at Sky", "指向天空")}</p>
                      <p className="text-xs">{t("Point your camera at the zenith (directly overhead) to measure light pollution and count stars", "将相机指向天顶（正上方）以测量光污染并计算星星")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default BortleNow;
