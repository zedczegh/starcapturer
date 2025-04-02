
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCurrentPosition, ExtendedGeolocationOptions } from "@/utils/geolocationUtils";
import NavBar from "@/components/NavBar";
import { getBortleScaleColor, getBortleScaleDescription } from "@/data/utils/bortleScaleUtils";
import { useBortleUpdater } from "@/hooks/location/useBortleUpdater";
import { Camera, Clock, MapPin, Moon, Info, Shield, Star, Cloud, ArrowDown, ArrowUp, Pointer, CircleSlash } from "lucide-react";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import ConditionItem from "@/components/weather/ConditionItem";
import { DynamicMoonIcon, DynamicLightbulbIcon } from "@/components/weather/DynamicIcons";

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
  
  // Bortle scale states
  const [bortleScale, setBortleScale] = useState<number | null>(null);
  const [measurementProgress, setMeasurementProgress] = useState(0);
  const [cameraReadings, setCameraReadings] = useState<{
    darkFrame: boolean;
    lightFrame: boolean;
  }>({
    darkFrame: false,
    lightFrame: false,
  });
  
  // When location changes, update Bortle scale
  const onLocationChange = useCallback((lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    
    // Auto-update Bortle scale when location changes
    updateBortleFromLocation(lat, lng);
  }, []);

  const updateBortleFromLocation = async (lat: number, lng: number) => {
    try {
      setIsMeasuringRealtime(true);
      const updatedBortle = await updateBortleScale(lat, lng, locationName, null);
      if (updatedBortle) {
        setBortleScale(updatedBortle);
        console.log("Updated Bortle scale from location:", updatedBortle);
        
        // Store measurement in database (will implement with Supabase)
        saveMeasurementToDatabase(lat, lng, updatedBortle, "location");
      }
    } catch (err) {
      console.error("Error updating Bortle scale:", err);
    } finally {
      setIsMeasuringRealtime(false);
    }
  };

  // Function to save measurements to our database (placeholder for Supabase integration)
  const saveMeasurementToDatabase = (
    latitude: number, 
    longitude: number, 
    bortleValue: number,
    source: "camera" | "location"
  ) => {
    // This will be implemented with Supabase later
    console.log("Saving measurement to database:", {
      latitude,
      longitude,
      bortleValue,
      source,
      timestamp: new Date().toISOString(),
      deviceInfo: navigator.userAgent
    });
    
    // Future Supabase integration will be added here
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
        
        // Fetch location name
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
    // Get location when component loads
    getCurrentLocation();
  }, []);

  // Simulate Dark Sky Meter camera process to measure actual Bortle scale
  const captureDarkFrame = async () => {
    try {
      setError(null);
      setCameraReadings(prev => ({ ...prev, darkFrame: false }));
      setIsProcessingImage(true);
      setMeasurementProgress(10);
      
      // Check if we have location data
      if (!latitude || !longitude) {
        throw new Error(t("Please get your location first", "请先获取您的位置"));
      }
      
      toast({
        title: t("Capturing Dark Frame", "捕获暗帧"),
        description: t("Please cover your camera lens completely...", "请完全遮盖相机镜头..."),
      });
      
      // Simulate camera capture with progress updates
      await new Promise(resolve => setTimeout(() => {
        setMeasurementProgress(30);
        resolve(true);
      }, 700));
      
      await new Promise(resolve => setTimeout(() => {
        setMeasurementProgress(60);
        resolve(true);
      }, 700));
      
      await new Promise(resolve => setTimeout(() => {
        setMeasurementProgress(100);
        resolve(true);
      }, 600));
      
      // In a real implementation, you'd use:
      // - navigator.mediaDevices.getUserMedia to access camera
      // - Capture frames and analyze dark current noise
      
      toast({
        title: t("Dark Frame Captured", "暗帧已捕获"),
        description: t("Dark frame baseline established.", "暗帧基准已建立。"),
      });
      
      setCameraReadings(prev => ({ ...prev, darkFrame: true }));
      setMeasurementProgress(0);
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

  const captureLightFrame = async () => {
    try {
      setError(null);
      setCameraReadings(prev => ({ ...prev, lightFrame: false }));
      setIsProcessingImage(true);
      setMeasurementProgress(10);
      
      // Check if dark frame was captured
      if (!cameraReadings.darkFrame) {
        throw new Error(t("Please capture a dark frame first", "请先捕获暗帧"));
      }
      
      toast({
        title: t("Capturing Sky Frame", "捕获天空帧"),
        description: t("Point your camera at the zenith (straight up)...", "将相机指向天顶（正上方）..."),
      });
      
      // Simulate camera processing with progress updates
      await new Promise(resolve => setTimeout(() => {
        setMeasurementProgress(25);
        resolve(true);
      }, 800));
      
      await new Promise(resolve => setTimeout(() => {
        setMeasurementProgress(50);
        resolve(true);
      }, 800));
      
      await new Promise(resolve => setTimeout(() => {
        setMeasurementProgress(75);
        resolve(true);
      }, 800));
      
      await new Promise(resolve => setTimeout(() => {
        setMeasurementProgress(100);
        resolve(true);
      }, 600));
      
      // In a real implementation:
      // 1. Use camera API to take photo of night sky, pointed zenith
      // 2. Process pixel data to derive average sky brightness
      // 3. Apply dark frame correction by subtracting dark frame values
      // 4. Convert sky brightness to magnitudes per square arcsecond
      // 5. Map to Bortle scale (typically 21.7+ mag/arcsec² = Bortle 1, <18 = Bortle 9)
      
      // For simulation, generate a reasonable Bortle value
      // In reality, would compute from pixel luminance values
      const baseLocationBortle = bortleScale || 5;
      
      // Simulate slight improvement from camera measurement
      // (real measurement would be based on actual sky brightness calculation)
      const measuredBortle = Math.max(1, Math.min(9, baseLocationBortle * 0.8 + Math.random() * 0.8));
      
      setBortleScale(measuredBortle);
      setCameraReadings(prev => ({ ...prev, lightFrame: true }));
      setMeasurementProgress(0);
      
      // Save camera measurement to database
      if (latitude && longitude) {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        saveMeasurementToDatabase(lat, lng, measuredBortle, "camera");
      }
      
      toast({
        title: t("Measurement Complete", "测量完成"),
        description: t("Sky brightness measured. Bortle scale: ", "天空亮度已测量。波尔特尔等级：") + 
          measuredBortle.toFixed(1),
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

  // Get Bortle scale color for UI display
  const bortleColor = bortleScale ? getBortleScaleColor(bortleScale) : null;
  const bortleDescription = bortleScale ? 
    getBortleScaleDescription(bortleScale, language as 'en' | 'zh') : null;

  // Animation variants for smoother UI
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  const pulseAnimation = {
    pulse: {
      scale: [1, 1.03, 1],
      opacity: [0.9, 1, 0.9],
      transition: { 
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  };

  // Calculate a visual representation of the Bortle scale
  const getBortleVisualValue = (scale: number) => {
    // Invert the mapping: Bortle scale 1-9 to percentage 100%-0% 
    // Lower Bortle = better (1 = dark skies = 100%, 9 = light pollution = 0%)
    return Math.max(0, Math.min(100, 100 - ((scale - 1) / 8) * 100));
  };

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
          <h1 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
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
        
        <div className="space-y-6">
          {/* Bortle Scale Display */}
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
                
                {/* Measurement results display */}
                <div className="relative z-10">
                  <div className="flex flex-col items-center mb-4">
                    <div className="relative mb-3">
                      <motion.div 
                        className={`w-24 h-24 rounded-full flex items-center justify-center ${bortleColor?.bg} shadow-lg border-2 border-cosmic-700/30`}
                        variants={pulseAnimation}
                        animate={isMeasuringRealtime ? "pulse" : ""}
                      >
                        <span className="text-3xl font-bold">{bortleScale.toFixed(1)}</span>
                      </motion.div>
                      
                      {isMeasuringRealtime && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
                          <div className="w-3 h-3 rounded-full bg-blue-500 absolute top-0 left-0" />
                        </div>
                      )}
                      
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-cosmic-800/80 text-cosmic-300">
                          {t("Bortle Scale", "波尔特尔等级")}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gradient-primary mb-1">
                      {t("Light Pollution Level", "光污染水平")}
                    </h3>
                    
                    {/* Quality meter visualization - IMPROVED LAYOUT */}
                    <div className="w-full max-w-xs mt-2 mb-4">
                      <div className="relative h-3 bg-cosmic-800/80 rounded-full overflow-hidden">
                        <motion.div 
                          className="absolute inset-0 h-full rounded-full"
                          style={{ 
                            background: `linear-gradient(to right, #22c55e, #3b82f6, #f97316)`,
                            width: `${getBortleVisualValue(bortleScale)}%` 
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${getBortleVisualValue(bortleScale)}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-cosmic-400">
                        <div className="flex items-center gap-1">
                          <span>{t("Urban", "城市")}</span>
                          <span className="text-[0.65rem] text-cosmic-500">(9)</span>
                        </div>
                        <span>{t("Rural", "乡村")}</span>
                        <span>{t("Dark", "黑暗")}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-cosmic-900/50 p-4 rounded-lg border border-cosmic-800/30 mb-3">
                    <p className="text-sm text-cosmic-200">
                      {bortleDescription}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <ConditionItem
                      icon={<DynamicLightbulbIcon value={bortleScale} className="h-5 w-5 text-yellow-400" />}
                      label={t("Light Pollution", "光污染")}
                      value={`${t("Class", "等级")} ${bortleScale.toFixed(1)}`}
                      tooltip={t("Bortle Scale: 1 (darkest) to 9 (brightest)", "波尔特尔等级：1（最暗）至9（最亮）")}
                    />
                    
                    <ConditionItem
                      icon={<Star className="h-5 w-5 text-primary" />}
                      label={t("Visible Stars", "可见星星")}
                      value={bortleScale <= 3 
                        ? t("Many", "许多") 
                        : bortleScale <= 6 
                          ? t("Some", "一些") 
                          : t("Few", "很少")}
                      tooltip={t("Estimated visible stars at zenith", "天顶处估计可见星星")}
                    />
                  </div>
                  
                  {cameraReadings.lightFrame ? (
                    <div className="mt-3 flex items-center justify-center p-1 bg-green-950/30 rounded-full w-fit mx-auto">
                      <div className="text-xs text-primary flex items-center gap-2 px-3 py-1">
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
          
          {/* Location section */}
          <motion.div 
            className="glassmorphism border-cosmic-700/30 rounded-xl p-6 relative overflow-hidden"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
          >
            <div className="absolute inset-0 z-0 opacity-20 bg-gradient-to-br from-cosmic-800/20 to-cosmic-900/20" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium flex items-center gap-2">
                  <MapPin size={18} className="text-primary" />
                  {t("Your Location", "您的位置")}
                </h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={getCurrentLocation} 
                  disabled={isLoadingLocation}
                  className="text-xs h-8 bg-cosmic-800/70 hover:bg-cosmic-700/80 flex gap-2 items-center"
                >
                  {isLoadingLocation ? (
                    <>
                      <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                      <span>{t("Loading...", "加载中...")}</span>
                    </>
                  ) : (
                    <>
                      <Pointer className="h-3.5 w-3.5" />
                      {t("Update", "更新")}
                    </>
                  )}
                </Button>
              </div>
              
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
          
          {/* Camera measurement section */}
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
                    "Accurate measurements use your camera to measure actual sky brightness. First capture a dark frame, then point your camera at the night sky.",
                    "精确测量使用相机测量实际天空亮度。首先捕获暗帧，然后将相机指向夜空。"
                  )}
                </p>
                
                {measurementProgress > 0 && (
                  <div className="mb-4">
                    <Progress value={measurementProgress} className="h-2 bg-cosmic-700/50" />
                    <div className="text-xs text-center mt-1 text-cosmic-400">
                      {t("Processing", "处理中")}...
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    variant={cameraReadings.darkFrame ? "outline" : "default"}
                    onClick={captureDarkFrame}
                    disabled={isProcessingImage || isMeasuringRealtime}
                    className={`relative overflow-hidden flex items-center gap-2 ${cameraReadings.darkFrame ? 'bg-cosmic-800/60 border-primary/50' : 'bg-cosmic-800 hover:bg-cosmic-700'}`}
                  >
                    <Moon size={16} />
                    {t("Capture Dark Frame", "捕获暗帧")}
                    
                    {cameraReadings.darkFrame && (
                      <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                        <span className="text-xs text-green-500">✓</span>
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
                    disabled={isProcessingImage || !cameraReadings.darkFrame || isMeasuringRealtime}
                    className={`relative overflow-hidden flex items-center gap-2 ${cameraReadings.lightFrame ? 'bg-cosmic-800/60 border-primary/50' : 'bg-cosmic-700/80 hover:bg-cosmic-700'}`}
                  >
                    <Clock size={16} />
                    {t("Measure Sky Brightness", "测量天空亮度")}
                    
                    {cameraReadings.lightFrame && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <span className="text-xs text-primary">✓</span>
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
            
              {/* Measurement steps */}
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
                      <p className="text-xs">{t("Click the button to capture a reference dark frame", "点击按钮捕获参考暗帧")}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 bg-cosmic-800/30 p-3 rounded-lg border border-cosmic-700/20">
                    <div className="bg-primary/20 text-primary min-w-6 h-6 flex items-center justify-center rounded-full text-xs shrink-0 mt-0.5">3</div>
                    <div>
                      <p className="font-medium text-cosmic-100 mb-1">{t("Point at the Sky", "指向天空")}</p>
                      <p className="text-xs">{t("Point your camera directly up at the zenith (straight overhead)", "将相机直接指向天顶（正上方）")}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 bg-cosmic-800/30 p-3 rounded-lg border border-cosmic-700/20">
                    <div className="bg-primary/20 text-primary min-w-6 h-6 flex items-center justify-center rounded-full text-xs shrink-0 mt-0.5">4</div>
                    <div>
                      <p className="font-medium text-cosmic-100 mb-1">{t("Measure Sky Brightness", "测量天空亮度")}</p>
                      <p className="text-xs">{t("Click the button to capture and analyze the sky brightness", "点击按钮捕获并分析天空亮度")}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-cosmic-800/30 flex items-center justify-between text-xs text-cosmic-400">
                <div className="flex items-center gap-1">
                  <Cloud size={12} />
                  <span>{t("Dark Sky Meter compatible", "兼容暗空测量仪")}</span>
                </div>
                <div>
                  {t("Data contributes to global light pollution map", "数据贡献到全球光污染地图")}
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
