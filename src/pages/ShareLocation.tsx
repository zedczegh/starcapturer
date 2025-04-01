
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { shareAstroSpot } from '@/lib/api/astroSpots';
import NavBar from '@/components/NavBar';
import LocationPicker from '@/components/location/LocationPicker';
import LightPollutionIndicator from '@/components/location/LightPollutionIndicator';
import { fetchWeatherData } from '@/lib/api/weather';
import { fetchLightPollutionData } from '@/lib/api/pollution';
import { calculateSIQS } from '@/lib/calculateSIQS';
import LocationQuality from '@/components/photoPoints/LocationQuality';
import PhotoGuidelines from '@/components/photoPoints/PhotoGuidelines';
// Remove the incorrect import
// import RecommendedPhotoPoints from '@/components/RecommendedPhotoPoints';

// New interface to properly define what RecommendedPhotoPoints expects
interface LocationData {
  latitude: number;
  longitude: number;
  name?: string;
}

const ShareLocation: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photographer, setPhotographer] = useState('');
  const [coordinates, setCoordinates] = useState<{latitude: number; longitude: number} | null>(null);
  const [bortleScale, setBortleScale] = useState<number | null>(null);
  const [siqs, setSiqs] = useState<number | null>(null);
  const [qualityChecked, setQualityChecked] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  
  const { coords, loading: geoLoading } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    language
  });
  
  useEffect(() => {
    // Set initial coordinates from geolocation if available
    if (coords && !coordinates) {
      setCoordinates({
        latitude: coords.latitude,
        longitude: coords.longitude
      });
    }
  }, [coords, coordinates]);
  
  // Check location quality when coordinates change
  useEffect(() => {
    const checkLocationQuality = async () => {
      if (!coordinates) return;
      
      try {
        // Get light pollution data
        const pollutionData = await fetchLightPollutionData(
          coordinates.latitude,
          coordinates.longitude
        );
        
        if (pollutionData) {
          setBortleScale(pollutionData.bortleScale);
        }
        
        // Get weather data
        const weather = await fetchWeatherData({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        });
        
        setCurrentWeather(weather);
        
        // Calculate SIQS if we have both weather and pollution data
        if (weather && pollutionData) {
          const siqsResult = calculateSIQS({
            cloudCover: weather.cloudCover,
            bortleScale: pollutionData.bortleScale || 5,
            seeingConditions: 3, // Default value
            windSpeed: weather.windSpeed,
            humidity: weather.humidity,
            moonPhase: 0, // Default value
            precipitation: weather.precipitation,
            weatherCondition: weather.weatherCondition,
            aqi: weather.aqi
          });
          
          setSiqs(siqsResult.score);
          setQualityChecked(true);
        }
      } catch (error) {
        console.error("Error checking location quality:", error);
      }
    };
    
    checkLocationQuality();
  }, [coordinates]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!coordinates) {
      toast.error(
        language === "en" ? "Location required" : "需要位置", 
        { description: language === "en" ? "Please select a location" : "请选择一个位置" }
      );
      return;
    }
    
    if (!name.trim()) {
      toast.error(
        language === "en" ? "Name required" : "需要名称", 
        { description: language === "en" ? "Please enter a name for this location" : "请输入此位置的名称" }
      );
      return;
    }
    
    setSubmitting(true);
    
    try {
      const spotData = {
        name,
        chineseName: language === "zh" ? name : undefined,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        bortleScale: bortleScale || 5,
        siqs: siqs || undefined,
        description: description.trim() || undefined,
        photographer: photographer.trim() || undefined,
        timestamp: new Date().toISOString()
      };
      
      const result = await shareAstroSpot(spotData);
      
      if (result.success) {
        toast.success(
          language === "en" ? "Location shared" : "位置已分享", 
          { description: language === "en" ? "Your astronomy spot has been shared successfully" : "您的天文观测点已成功分享" }
        );
        
        // Navigate to the photo points page
        navigate("/photo-points");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error sharing location:", error);
      toast.error(
        language === "en" ? "Sharing failed" : "分享失败", 
        { description: language === "en" ? "Could not share your location. Please try again." : "无法分享您的位置。请重试。" }
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  // This is correct - the proper usage for RecommendedPhotoPoints component
  const locationData = coordinates ? {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude
  } : null;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-cosmic-900">
      <NavBar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">
            {t("Share Astronomy Location", "分享天文位置")}
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6 glassmorphism">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="location-name">{t("Location Name", "位置名称")}</Label>
                    <Input 
                      id="location-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("e.g. Mountain Viewpoint", "例如：山顶观景点")}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>{t("Location Coordinates", "位置坐标")}</Label>
                    <LocationPicker 
                      coordinates={coordinates}
                      setCoordinates={setCoordinates}
                      className="mt-1"
                    />
                    
                    {bortleScale !== null && (
                      <div className="mt-2">
                        <LightPollutionIndicator 
                          bortleScale={bortleScale} 
                          showDescription={true}
                          compact={true}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="photographer">{t("Photographer (Optional)", "摄影师（可选）")}</Label>
                    <Input 
                      id="photographer"
                      value={photographer}
                      onChange={(e) => setPhotographer(e.target.value)}
                      placeholder={t("Your name or handle", "您的名字或代号")}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">{t("Description (Optional)", "描述（可选）")}</Label>
                    <Textarea 
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t("Details about this location...", "关于此位置的详细信息...")}
                      className="mt-1 h-24"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={submitting || !coordinates}
                    className="w-full"
                  >
                    {submitting ? 
                      t("Sharing...", "正在分享...") : 
                      t("Share Location", "分享位置")}
                  </Button>
                </form>
              </Card>
            </div>
            
            <div className="space-y-6">
              <LocationQuality 
                bortleScale={bortleScale}
                siqs={siqs}
                weather={currentWeather}
                isChecking={!qualityChecked && coordinates !== null}
              />
              
              <PhotoGuidelines />
              
              {/* Fix the RecommendedPhotoPoints usage by passing locationData instead of userLocation */}
              {/* Commenting out as we'll add a proper import and usage once we have the correct component
              {coordinates && (
                <RecommendedPhotoPoints
                  locationData={locationData}
                  hideEmptyMessage={true}
                />
              )}
              */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareLocation;
