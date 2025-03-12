import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { fetchWeatherData, fetchLightPollutionData } from "@/lib/api";
import { Search, Loader2, MapPin, CheckCircle2, XCircle, AlertTriangle, Award } from "lucide-react";
import LocationMap from "@/components/LocationMap";

interface SIQSCalculatorProps {
  className?: string;
  hideRecommendedPoints?: boolean;
  noAutoLocationRequest?: boolean;
}

const SIQSCalculator: React.FC<SIQSCalculatorProps> = ({ className, hideRecommendedPoints, noAutoLocationRequest }) => {
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [cloudCover, setCloudCover] = useState(0);
  const [bortleScale, setBortleScale] = useState(4);
  const [seeingConditions, setSeeingConditions] = useState(3);
  const [windSpeed, setWindSpeed] = useState(10);
  const [humidity, setHumidity] = useState(50);
  const [moonPhase, setMoonPhase] = useState(0);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [siqsResult, setSiqsResult] = useState<any>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!noAutoLocationRequest) {
      handleGetLocation();
    }
  }, []);

  useEffect(() => {
    if (autoUpdate && latitude !== null && longitude !== null) {
      handleCalculateSIQS();
    }
  }, [latitude, longitude, cloudCover, bortleScale, seeingConditions, windSpeed, humidity, moonPhase, autoUpdate]);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLocationName(t("My Location", "我的位置"));
          
          try {
            const weatherData = await fetchWeatherData({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            
            if (weatherData) {
              setCloudCover(weatherData.cloudCover);
              setWindSpeed(weatherData.windSpeed);
              setHumidity(weatherData.humidity);
            }
            
            const lightPollutionData = await fetchLightPollutionData(position.coords.latitude, position.coords.longitude);
            if (lightPollutionData) {
              setBortleScale(lightPollutionData.bortleScale);
            }
          } catch (error) {
            console.error("Error fetching initial data:", error);
            toast({
              variant: "destructive",
              title: t("Error Fetching Data", "获取数据出错"),
              description: t("Could not retrieve weather or light pollution data for your location.", "无法检索您所在位置的天气或光污染数据。"),
            });
          } finally {
            setLocationLoading(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationLoading(false);
          toast({
            variant: "destructive",
            title: t("Location Error", "定位错误"),
            description: t("Could not retrieve your location. Please enter it manually.", "无法检索您的位置。请手动输入。"),
          });
        }
      );
    } else {
      toast({
        variant: "destructive",
        title: t("Geolocation Not Supported", "不支持地理定位"),
        description: t("Your browser does not support geolocation. Please enter your location manually.", "您的浏览器不支持地理定位。请手动输入您的位置。"),
      });
    }
  };

  const handleCalculateSIQS = async () => {
    if (latitude === null || longitude === null) {
      toast({
        variant: "destructive",
        title: t("Location Required", "需要位置"),
        description: t("Please enter a valid latitude and longitude.", "请输入有效的纬度和经度。"),
      });
      return;
    }

    setLoading(true);
    try {
      const siqs = calculateSIQS({
        cloudCover,
        bortleScale,
        seeingConditions,
        windSpeed,
        humidity,
        moonPhase,
      });
      setSiqsResult(siqs);
    } catch (error) {
      console.error("Error calculating SIQS:", error);
      toast({
        variant: "destructive",
        title: t("Calculation Error", "计算错误"),
        description: t("Failed to calculate SIQS. Please check your inputs and try again.", "无法计算SIQS。请检查您的输入并重试。"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationUpdate = async (newLocation: { name: string; latitude: number; longitude: number }) => {
    setLatitude(newLocation.latitude);
    setLongitude(newLocation.longitude);
    setLocationName(newLocation.name);
    
    try {
      const weatherData = await fetchWeatherData({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      });
      
      if (weatherData) {
        setCloudCover(weatherData.cloudCover);
        setWindSpeed(weatherData.windSpeed);
        setHumidity(weatherData.humidity);
      }
      
      const lightPollutionData = await fetchLightPollutionData(newLocation.latitude, newLocation.longitude);
      if (lightPollutionData) {
        setBortleScale(lightPollutionData.bortleScale);
      }
      
      toast({
        title: t("Location Updated", "位置已更新"),
        description: t("Weather and light pollution data updated for the new location.", "已更新新位置的天气和光污染数据。"),
      });
    } catch (error) {
      console.error("Error fetching data for new location:", error);
      toast({
        variant: "destructive",
        title: t("Error Fetching Data", "获取数据出错"),
        description: t("Could not retrieve weather or light pollution data for the new location.", "无法检索新位置的天气或光污染数据。"),
      });
    }
  };

  const handleViewDetails = () => {
    if (latitude === null || longitude === null) {
      toast({
        variant: "destructive",
        title: t("Location Required", "需要位置"),
        description: t("Please enter a valid latitude and longitude.", "请输入有效的纬度和经度。"),
      });
      return;
    }
    
    const locationId = Date.now().toString();
    
    navigate(`/location/${locationId}`, { 
      state: {
        name: locationName,
        latitude,
        longitude,
        cloudCover,
        bortleScale,
        seeingConditions,
        windSpeed,
        humidity,
        moonPhase,
        siqsResult,
        timestamp: new Date().toISOString()
      }
    });
  };

  const getRecommendationMessage = (score: number) => {
    if (score >= 8) return t("Grab your rig and run!", "带上你的设备立刻出发！");
    if (score >= 6) return t("Yeah! Should give it a go, eh?", "不错！值得一试，对吧？");
    if (score >= 5) return t("Meh... be realistic.", "嗯...还是现实点吧。");
    return t("Uh... let me think twice.", "呃...再考虑一下吧。");
  };

  const getScoreIcon = (score: number) => {
    if (score >= 7) return <Award className="h-6 w-6 text-green-400" />;
    if (score >= 4) return <CheckCircle2 className="h-6 w-6 text-yellow-300" />;
    return <AlertTriangle className="h-6 w-6 text-red-400" />;
  };

  return (
    <div className={`glassmorphism p-6 rounded-lg ${className}`}>
      <h2 className="text-xl font-semibold mb-4">{t("SIQS Calculator", "SIQS计算器")}</h2>
      
      <div className="mb-4">
        <Label htmlFor="locationName" className="text-sm">{t("Location Name", "位置名称")}</Label>
        <div className="relative">
          <Input
            type="text"
            id="locationName"
            placeholder={t("Enter location name", "输入位置名称")}
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className="mb-2"
          />
          {locationLoading && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="latitude" className="text-sm">{t("Latitude", "纬度")}</Label>
          <Label htmlFor="longitude" className="text-sm">{t("Longitude", "经度")}</Label>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            id="latitude"
            placeholder={t("Latitude", "纬度")}
            value={latitude !== null ? latitude.toString() : ""}
            onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : null)}
            className="w-1/2"
          />
          <Input
            type="number"
            id="longitude"
            placeholder={t("Longitude", "经度")}
            value={longitude !== null ? longitude.toString() : ""}
            onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : null)}
            className="w-1/2"
          />
        </div>
      </div>
      
      <div className="mb-4">
        <LocationMap
          latitude={latitude || 0}
          longitude={longitude || 0}
          name={locationName || t("Unnamed Location", "未命名位置")}
          onLocationUpdate={handleLocationUpdate}
          editable={true}
        />
      </div>

      <div className="mb-4">
        <Label htmlFor="cloudCover" className="block text-sm font-medium text-gray-700">{t("Cloud Cover (%)", "云量(%)")}</Label>
        <Slider
          id="cloudCover"
          defaultValue={[cloudCover]}
          max={100}
          step={1}
          onValueChange={(value) => setCloudCover(value[0])}
          className="mb-2"
        />
        <p className="text-sm text-gray-500">{cloudCover}%</p>
      </div>

      <div className="mb-4">
        <Label htmlFor="bortleScale" className="block text-sm font-medium text-gray-700">{t("Bortle Scale (1-9)", "Bortle等级 (1-9)")}</Label>
        <Slider
          id="bortleScale"
          defaultValue={[bortleScale]}
          max={9}
          min={1}
          step={1}
          onValueChange={(value) => setBortleScale(value[0])}
          className="mb-2"
        />
        <p className="text-sm text-gray-500">{bortleScale}</p>
      </div>

      <div className="mb-4">
        <Label htmlFor="seeingConditions" className="block text-sm font-medium text-gray-700">{t("Seeing Conditions (1-5)", "视宁度 (1-5)")}</Label>
        <Slider
          id="seeingConditions"
          defaultValue={[seeingConditions]}
          max={5}
          min={1}
          step={1}
          onValueChange={(value) => setSeeingConditions(value[0])}
          className="mb-2"
        />
        <p className="text-sm text-gray-500">{seeingConditions}</p>
      </div>

      <div className="mb-4">
        <Label htmlFor="windSpeed" className="block text-sm font-medium text-gray-700">{t("Wind Speed (mph)", "风速 (mph)")}</Label>
        <Slider
          id="windSpeed"
          defaultValue={[windSpeed]}
          max={50}
          step={1}
          onValueChange={(value) => setWindSpeed(value[0])}
          className="mb-2"
        />
        <p className="text-sm text-gray-500">{windSpeed} mph</p>
      </div>

      <div className="mb-4">
        <Label htmlFor="humidity" className="block text-sm font-medium text-gray-700">{t("Humidity (%)", "湿度 (%)")}</Label>
        <Slider
          id="humidity"
          defaultValue={[humidity]}
          max={100}
          step={1}
          onValueChange={(value) => setHumidity(value[0])}
          className="mb-2"
        />
        <p className="text-sm text-gray-500">{humidity}%</p>
      </div>

      <div className="mb-4">
        <Label htmlFor="moonPhase" className="block text-sm font-medium text-gray-700">{t("Moon Phase (0-1)", "月相 (0-1)")}</Label>
        <Slider
          id="moonPhase"
          defaultValue={[moonPhase]}
          max={1}
          step={0.01}
          onValueChange={(value) => setMoonPhase(value[0])}
          className="mb-2"
        />
        <p className="text-sm text-gray-500">{moonPhase.toFixed(2)}</p>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Switch id="auto-update" checked={autoUpdate} onCheckedChange={setAutoUpdate} />
        <Label htmlFor="auto-update">{t("Auto-Update", "自动更新")}</Label>
      </div>

      <div className="flex justify-between">
        <Button onClick={handleCalculateSIQS} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("Calculating...", "计算中...")}
            </>
          ) : (
            t("Calculate SIQS", "计算SIQS")
          )}
        </Button>
        
        <Button variant="secondary" onClick={handleViewDetails}>
          {t("View Details", "查看详情")}
        </Button>
      </div>

      {siqsResult && (
        <div className="mt-6 p-4 border rounded-md">
          <h3 className="text-lg font-semibold mb-2">{t("SIQS Result", "SIQS结果")}</h3>
          <div className="flex items-center gap-2 mb-2">
            {getScoreIcon(siqsResult.score)}
            <p className="text-xl font-bold">
              {siqsResult.score.toFixed(1)}/10
            </p>
          </div>
          <p className="text-sm text-gray-500">{getRecommendationMessage(siqsResult.score)}</p>
        </div>
      )}
    </div>
  );
};

export default SIQSCalculator;
