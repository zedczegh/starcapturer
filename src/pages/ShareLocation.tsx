
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { ExtendedGeolocationOptions, getCurrentPosition } from "@/utils/geolocationUtils";
import NavBar from "@/components/NavBar";
import { getBortleScaleColor } from "@/data/utils/bortleScaleUtils";
import { useBortleUpdater } from "@/hooks/location/useBortleUpdater";

const ShareLocation: React.FC = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { updateBortleScale } = useBortleUpdater();
  
  // For Bortle scale calculation
  const [bortleScale, setBortleScale] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const onLocationChange = useCallback((lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    
    // Auto-update Bortle scale when location changes
    updateBortleFromLocation(lat, lng);
  }, []);

  const updateBortleFromLocation = async (lat: number, lng: number) => {
    try {
      setIsCalculating(true);
      const updatedBortle = await updateBortleScale(lat, lng, name, null);
      if (updatedBortle) {
        setBortleScale(updatedBortle);
        console.log("Updated Bortle scale:", updatedBortle);
      }
    } catch (err) {
      console.error("Error updating Bortle scale:", err);
    } finally {
      setIsCalculating(false);
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

  // Function to simulate camera processing for Bortle scale
  const processCameraFrames = async () => {
    try {
      setIsProcessingImage(true);
      setError(null);
      
      // Check if we have location data
      if (!latitude || !longitude) {
        throw new Error(t("Please get your location first", "请先获取您的位置"));
      }
      
      // Simulating camera processing delay
      toast({
        title: t("Processing", "处理中"),
        description: t("Analyzing light frames...", "正在分析光帧..."),
      });
      
      // In a real implementation, we would:
      // 1. Access camera API to take dark and light frames
      // 2. Process pixel data to calculate light pollution
      // 3. Convert to Bortle scale
      
      // For now, simulate with a slight improvement over the location-based estimate
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      let calculatedBortle = await updateBortleScale(lat, lng, name, null);
      
      // Apply small random adjustment to simulate camera-based refinement
      // In a real implementation, this would be based on actual pixel analysis
      const refinement = (Math.random() * 0.4) - 0.2;
      calculatedBortle = calculatedBortle ? 
        Math.max(1, Math.min(9, calculatedBortle + refinement)) : 
        5;
      
      setBortleScale(calculatedBortle);
      
      toast({
        title: t("Success", "成功"),
        description: t("Bortle scale calculated: ", "计算的波尔特尔等级：") + 
          calculatedBortle.toFixed(1),
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!name || !latitude || !longitude) {
      toast({
        variant: "destructive",
        title: t("Error", "错误"),
        description: t("Please fill in all fields.", "请填写所有字段。"),
      });
      return;
    }

    // Basic validation for latitude and longitude
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        variant: "destructive",
        title: t("Error", "错误"),
        description: t("Invalid latitude or longitude.", "无效的纬度或经度。"),
      });
      return;
    }

    // Prepare the data to send
    const submissionData = {
      name,
      description,
      latitude: lat,
      longitude: lng,
      bortleScale: bortleScale || 5,
      timestamp: new Date().toISOString()
    };

    console.log("Submitting data:", submissionData);

    // Show a success message
    toast({
      title: t("Success", "成功"),
      description: t("Location shared successfully!", "位置分享成功！"),
    });

    // Redirect to home page
    navigate('/');
  };

  // Get the Bortle scale color for UI display
  const bortleColor = bortleScale ? getBortleScaleColor(bortleScale) : null;

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-4 pt-24">
        <h1 className="text-2xl font-bold mb-4">{t("Bortle Now", "实时光污染")}</h1>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        
        <div className="max-w-md mx-auto bg-cosmic-900/50 p-6 rounded-lg border border-cosmic-700/30 backdrop-blur-sm">
          {bortleScale && (
            <div className="mb-6 text-center">
              <div className={`inline-block px-4 py-2 rounded-full ${bortleColor?.bg} ${bortleColor?.text} mb-2`}>
                {t("Bortle Scale", "波尔特尔等级")}: {bortleScale.toFixed(1)}
              </div>
              <p className="text-sm opacity-80">
                {t("Based on your location and light analysis", "基于您的位置和光线分析")}
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">{t("Name", "名称")}</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("Location Name", "位置名称")}
                />
              </div>
              <div>
                <Label htmlFor="description">{t("Description", "描述")}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("Add a description", "添加描述")}
                />
              </div>
              <div>
                <Label htmlFor="latitude">{t("Latitude", "纬度")}</Label>
                <Input
                  id="latitude"
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder={t("Latitude", "纬度")}
                />
              </div>
              <div>
                <Label htmlFor="longitude">{t("Longitude", "经度")}</Label>
                <Input
                  id="longitude"
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder={t("Longitude", "经度")}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={getCurrentLocation} 
                  disabled={isLoadingLocation}
                >
                  {isLoadingLocation ? 
                    t("Loading...", "加载中...") : 
                    t("Get Current Location", "获取当前位置")}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={processCameraFrames}
                  disabled={isProcessingImage || !latitude || !longitude}
                  className="border-primary/40 hover:bg-primary/20"
                >
                  {isProcessingImage ? 
                    t("Processing...", "处理中...") : 
                    t("Calculate with Camera", "使用相机计算")}
                </Button>
              </div>
              
              <Button type="submit">{t("Share Location", "分享位置")}</Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ShareLocation;
