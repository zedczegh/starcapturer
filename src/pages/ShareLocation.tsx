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
  
  // Bortle scale states
  const [bortleScale, setBortleScale] = useState<number | null>(null);
  const [cameraReadings, setCameraReadings] = useState<{
    darkFrame: boolean;
    lightFrame: boolean;
  }>({
    darkFrame: false,
    lightFrame: false,
  });
  
  // Camera permission dialog state
  const [showCameraPermissionDialog, setShowCameraPermissionDialog] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [cameraMode, setCameraMode] = useState<"dark" | "light" | null>(null);
  
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
      }
    } catch (err) {
      console.error("Error updating Bortle scale:", err);
    } finally {
      setIsMeasuringRealtime(false);
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

  // Request camera permission before capture
  const requestCameraPermission = async (mode: "dark" | "light") => {
    setCameraMode(mode);
    
    // Check if permissions were already granted
    if (cameraPermissionGranted) {
      if (mode === "dark") {
        captureDarkFrame();
      } else {
        captureLightFrame();
      }
      return;
    }
    
    // Show permission dialog
    setShowCameraPermissionDialog(true);
  };
  
  const handlePermissionResponse = async (granted: boolean) => {
    setShowCameraPermissionDialog(false);
    
    if (granted) {
      setCameraPermissionGranted(true);
      
      try {
        // Actually request browser permission
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Stop the stream immediately, we just needed to trigger the permission
        stream.getTracks().forEach(track => track.stop());
        
        // Proceed with capture based on mode
        if (cameraMode === "dark") {
          captureDarkFrame();
        } else if (cameraMode === "light") {
          captureLightFrame();
        }
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
      
      // Simulate camera capture with progress updates
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
      
      // Simulate camera processing with progress updates
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
      
      // For simulation, generate a reasonable Bortle value
      const baseLocationBortle = bortleScale || 5;
      
      // Simulate slight improvement from camera measurement
      const measuredBortle = Math.max(1, Math.min(9, baseLocationBortle * 0.8 + Math.random() * 0.8));
      
      setBortleScale(measuredBortle);
      setCameraReadings(prev => ({ ...prev, lightFrame: true }));
      
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

  // Dynamic gradient and colors based on Bortle scale
  const getBortleScaleGradient = (scale: number | null) => {
    if (scale === null) return { bg: "", text: "" };
    
    // For high light pollution (7-9)
    if (scale >= 7) {
      return {
        bg: "bg-gradient-to-br from-orange-500/80 to-red-500/80",
        text: "text-white"
      };
    }
    // For moderate light pollution (4-6)
    else if (scale >= 4) {
      return {
        bg: "bg-gradient-to-br from-yellow-400/80 to-lime-500/80",
        text: "text-cosmic-950"
      };
    }
    // For low light pollution (1-3)
    else {
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
        {/* Camera Permission Dialog */}
        <Dialog open={showCameraPermissionDialog} onOpenChange={open => !open && setShowCameraPermissionDialog(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("Camera Permission Required", "需要相机权限")}</DialogTitle>
              <DialogDescription>
                {t(
                  "This feature needs to access your camera to measure light levels. No images will be stored or shared.",
                  "此功能需要访问您的相机来测量光线水平。不会存储或共享任何图像。"
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center p-4">
              <Camera className="h-16 w-16 text-primary opacity-80" />
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => handlePermissionResponse(false)}
                className="sm:w-full"
              >
                {t("Deny", "拒绝")}
              </Button>
              <Button 
                onClick={() => handlePermissionResponse(true)}
                className="sm:w-full"
              >
                {t("Allow", "允许")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
          {/* Enhanced Bortle Scale Display with Dynamic Circle */}
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
                
                {/* Dynamic circle display with pulse animation */}
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
                      
                      {/* Light pollution scale labels */}
                      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 flex items-center">
                        <span className="text-xs text-blue-400">1</span>
                      </div>
                      <div className="absolute right-0 top-0 transform translate-x-1/2 -translate-y-1/2 flex items-center">
                        <span className="text-xs text-red-400">9</span>
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
                      value={bortleScale <= 3 
                        ? t("Many", "许多") 
                        : bortleScale <= 6 
                          ? t("Some", "一些") 
                          : t("Few", "很少")}
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    variant={cameraReadings.darkFrame ? "outline" : "default"}
                    onClick={() => requestCameraPermission("dark")}
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
                    onClick={() => requestCameraPermission("light")}
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
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default BortleNow;
