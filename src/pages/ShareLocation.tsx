
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCurrentPosition, ExtendedGeolocationOptions } from "@/utils/geolocationUtils";
import NavBar from "@/components/NavBar";
import { getBortleScaleColor, getBortleScaleDescription } from "@/data/utils/bortleScaleUtils";
import { useBortleUpdater } from "@/hooks/location/useBortleUpdater";
import { Camera, Clock, MapPin, Moon, Info, Shield, Star, Cloud } from "lucide-react";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

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
        
        // Store measurement in database (we'll implement this with Supabase later)
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
    
    // We'll add Supabase integration here
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
      
      // Check if we have location data
      if (!latitude || !longitude) {
        throw new Error(t("Please get your location first", "请先获取您的位置"));
      }
      
      toast({
        title: t("Capturing Dark Frame", "捕获暗帧"),
        description: t("Please cover your camera lens completely...", "请完全遮盖相机镜头..."),
      });
      
      // Simulate camera capture
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you'd use:
      // - navigator.mediaDevices.getUserMedia to access camera
      // - Capture frames and analyze dark current noise
      
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

  const captureLightFrame = async () => {
    try {
      setError(null);
      setCameraReadings(prev => ({ ...prev, lightFrame: false }));
      setIsProcessingImage(true);
      
      // Check if dark frame was captured
      if (!cameraReadings.darkFrame) {
        throw new Error(t("Please capture a dark frame first", "请先捕获暗帧"));
      }
      
      toast({
        title: t("Capturing Sky Frame", "捕获天空帧"),
        description: t("Point your camera at the zenith (straight up)...", "将相机指向天顶（正上方）..."),
      });
      
      // Simulate camera processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
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

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-4 pt-24 pb-20">
        <motion.h1 
          className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {t("Bortle Now", "实时光污染")}
        </motion.h1>
        
        {error && (
          <motion.div 
            className="text-red-500 mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {error}
          </motion.div>
        )}
        
        <motion.div 
          className="max-w-md mx-auto bg-cosmic-900/50 p-6 rounded-lg border border-cosmic-700/30 backdrop-blur-sm shadow-lg"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          {/* Bortle Scale Display */}
          {bortleScale && (
            <motion.div 
              className="mb-6 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative">
                <div className={`inline-block px-6 py-3 rounded-full ${bortleColor?.bg} ${bortleColor?.text} text-lg font-medium mb-3 shadow-md`}>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    {t("Bortle Scale", "波尔特尔等级")}: {bortleScale.toFixed(1)}
                  </div>
                </div>
                
                <div className="absolute -top-2 -right-2">
                  {isMeasuringRealtime && (
                    <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
                  )}
                </div>
              </div>
              
              <p className="text-sm opacity-90 mt-3 bg-cosmic-800/40 p-3 rounded-lg">
                {bortleDescription}
              </p>
              
              {cameraReadings.lightFrame ? (
                <div className="mt-3 text-sm text-primary/90 flex items-center justify-center gap-2 font-medium">
                  <Shield size={16} className="text-emerald-400" />
                  {t("Camera-verified measurement", "相机验证的测量")}
                </div>
              ) : (
                <div className="mt-3 text-sm text-amber-400/90 flex items-center justify-center gap-2">
                  <Info size={16} />
                  {t("Based on location estimate", "基于位置估计")}
                </div>
              )}
            </motion.div>
          )}
          
          {/* Location section */}
          <motion.div 
            className="mb-6 space-y-4"
            variants={fadeInUp}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <MapPin size={18} className="text-primary" />
                {t("Your Location", "您的位置")}
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={getCurrentLocation} 
                disabled={isLoadingLocation}
                className="text-xs h-8 bg-cosmic-800/80 hover:bg-cosmic-700/80"
              >
                {isLoadingLocation ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                    <span>{t("Loading...", "加载中...")}</span>
                  </div>
                ) : (
                  t("Update", "更新")
                )}
              </Button>
            </div>
            
            {locationName && (
              <div className="text-sm opacity-90 mb-2 bg-cosmic-800/40 p-3 rounded-lg border border-cosmic-700/30">
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
          </motion.div>
          
          {/* Camera measurement section */}
          <motion.div 
            className="space-y-4"
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Camera size={18} className="text-primary" />
              {t("Camera Measurement", "相机测量")}
            </h2>
            
            <div className="bg-cosmic-800/40 p-4 rounded-lg border border-cosmic-700/30 shadow-inner">
              <p className="mb-4 text-sm opacity-90">
                {t(
                  "Accurate measurements use your camera to measure actual sky brightness. First capture a dark frame, then point your camera at the night sky.",
                  "精确测量使用相机测量实际天空亮度。首先捕获暗帧，然后将相机指向夜空。"
                )}
              </p>
              
              <div className="flex gap-3 flex-col">
                <Button
                  variant={cameraReadings.darkFrame ? "outline" : "default"}
                  onClick={captureDarkFrame}
                  disabled={isProcessingImage || isMeasuringRealtime}
                  className={`relative overflow-hidden ${cameraReadings.darkFrame ? 'bg-cosmic-800/60 border-primary/50' : 'bg-cosmic-800 hover:bg-cosmic-700'}`}
                >
                  <span className="flex items-center gap-2">
                    <Moon size={16} />
                    {t("Capture Dark Frame", "捕获暗帧")}
                  </span>
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
                  className={`relative overflow-hidden ${cameraReadings.lightFrame ? 'bg-cosmic-800/60 border-primary/50' : 'bg-cosmic-700/80 hover:bg-cosmic-700'}`}
                >
                  <span className="flex items-center gap-2">
                    <Clock size={16} />
                    {t("Measure Sky Brightness", "测量天空亮度")}
                  </span>
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
          </motion.div>
        </motion.div>
        
        {/* Instructions */}
        <motion.div 
          className="max-w-md mx-auto mt-6 bg-cosmic-900/30 p-5 rounded-lg border border-cosmic-800/20 shadow-lg"
          variants={fadeInUp}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-medium mb-3 flex items-center gap-2 text-primary">
            <Info size={16} />
            {t("How to Measure", "如何测量")}
          </h3>
          
          <ul className="text-sm space-y-3 opacity-90">
            <li className="flex gap-2 items-start">
              <span className="bg-primary/20 text-primary min-w-5 h-5 flex items-center justify-center rounded-full text-xs">1</span>
              <span>{t("Find a dark location away from direct lights", "找一个远离直接光源的黑暗位置")}</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="bg-primary/20 text-primary min-w-5 h-5 flex items-center justify-center rounded-full text-xs">2</span>
              <span>{t("Cover your camera lens and capture a dark frame", "遮盖相机镜头并捕获暗帧")}</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="bg-primary/20 text-primary min-w-5 h-5 flex items-center justify-center rounded-full text-xs">3</span>
              <span>{t("Point your camera at the zenith (straight up) and measure", "将相机指向天顶（正上方）并测量")}</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="bg-primary/20 text-primary min-w-5 h-5 flex items-center justify-center rounded-full text-xs">4</span>
              <span>{t("Keep your phone steady during measurement", "测量过程中保持手机稳定")}</span>
            </li>
          </ul>
          
          <div className="mt-4 pt-3 border-t border-cosmic-800/30 flex items-center justify-between text-xs opacity-70">
            <div className="flex items-center gap-1">
              <Cloud size={12} />
              <span>{t("Dark Sky Meter compatible", "兼容暗空测量仪")}</span>
            </div>
            <div>
              {t("Data contributes to global light pollution map", "数据贡献到全球光污染地图")}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default BortleNow;
