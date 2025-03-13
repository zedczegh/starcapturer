
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { fetchWeatherData, getLocationNameFromCoordinates, fetchLightPollutionData } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { MapPin, Loader2, Info, SlidersHorizontal } from "lucide-react";
import MapSelector from "./MapSelector";
import RecommendedPhotoPoints from "./RecommendedPhotoPoints";
import { useLanguage } from "@/contexts/LanguageContext";
import { getRecommendationMessage } from "./SIQSSummary";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface WeatherData {
  cloudCover: number;
  windSpeed: number;
  humidity: number;
  temperature?: number;
  precipitation?: number;
  weatherCondition?: string;
  aqi?: number;
}

interface SIQSCalculatorProps {
  className?: string;
  hideRecommendedPoints?: boolean;
  noAutoLocationRequest?: boolean;
}

const SIQSCalculator: React.FC<SIQSCalculatorProps> = ({ 
  className,
  hideRecommendedPoints = false,
  noAutoLocationRequest = false
}) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [bortleScale, setBortleScale] = useState(4);
  const [seeingConditions, setSeeingConditions] = useState(2);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [siqsScore, setSiqsScore] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const locationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (locationName && !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      calculateSIQSForLocation(lat, lng, locationName, true);
    }
  }, [latitude, longitude, locationName, bortleScale, seeingConditions]);
  
  const handleUseCurrentLocation = () => {
    if (loading) return;
    
    if (navigator.geolocation) {
      setLoading(true);
      setStatusMessage(t("Waiting for permission and location data...", "等待位置权限和数据..."));
      
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }
      
      locationTimeoutRef.current = setTimeout(() => {
        if (loading) {
          setLoading(false);
          setStatusMessage(t("Location request timed out. Please try again or enter coordinates manually.", 
            "位置请求超时。请重试或手动输入坐标。"));
        }
      }, 15000);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (locationTimeoutRef.current) {
            clearTimeout(locationTimeoutRef.current);
            locationTimeoutRef.current = null;
          }
          
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setLatitude(lat.toFixed(6));
          setLongitude(lng.toFixed(6));
          setUserLocation({ latitude: lat, longitude: lng });
          
          try {
            const name = await getLocationNameFromCoordinates(lat, lng, language);
            console.log("Got location name:", name);
            setLocationName(name);
            
            try {
              const lightPollutionData = await fetchLightPollutionData(lat, lng);
              if (lightPollutionData && lightPollutionData.bortleScale) {
                setBortleScale(lightPollutionData.bortleScale);
                console.log("Got Bortle scale:", lightPollutionData.bortleScale);
              }
            } catch (lightError) {
              console.error("Error fetching light pollution data:", lightError);
              // Continue with default Bortle scale
            }
            
            setShowAdvancedSettings(true);
            setLoading(false);
            setStatusMessage(t("Location found: ", "位置已找到：") + name);
          } catch (error) {
            console.error("Error getting location name:", error);
            const fallbackName = t(
              `Location at ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
              `位置：${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`
            );
            setLocationName(fallbackName);
            setShowAdvancedSettings(true);
            setLoading(false);
            setStatusMessage(t("Location found: ", "位置已找到：") + fallbackName);
          }
        },
        (error) => {
          if (locationTimeoutRef.current) {
            clearTimeout(locationTimeoutRef.current);
            locationTimeoutRef.current = null;
          }
          
          setLoading(false);
          
          let errorMessage = "";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = t(
                "Location permission denied. Please check your browser settings.",
                "位置权限被拒绝。请检查您的浏览器设置。"
              );
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = t(
                "Location information is unavailable. Try another method.",
                "位置信息不可用。请尝试其他方法。"
              );
              break;
            case error.TIMEOUT:
              errorMessage = t(
                "Location request timed out. Please try again.",
                "位置请求超时。请重试。"
              );
              break;
            default:
              errorMessage = t(
                "An unknown error occurred while getting your location.",
                "获取位置时发生未知错误。"
              );
          }
          
          setStatusMessage(errorMessage);
          console.error("Geolocation error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0
        }
      );
    } else {
      setStatusMessage(t("Your browser doesn't support geolocation. Please enter coordinates manually.",
        "您的浏览器不支持地理位置，请手动输入坐标。"));
    }
  };
  
  const handleLocationSelect = async (location: { name: string; latitude: number; longitude: number; placeDetails?: string }) => {
    setLocationName(location.name);
    setLatitude(location.latitude.toFixed(6));
    setLongitude(location.longitude.toFixed(6));
    
    try {
      const lightPollutionData = await fetchLightPollutionData(location.latitude, location.longitude);
      if (lightPollutionData && lightPollutionData.bortleScale) {
        setBortleScale(lightPollutionData.bortleScale);
        console.log("Got Bortle scale for selected location:", lightPollutionData.bortleScale);
      }
    } catch (error) {
      console.error("Error fetching light pollution data for selected location:", error);
      const estimatedBortleScale = estimateBortleScale(location.name);
      setBortleScale(estimatedBortleScale);
    }
    
    setStatusMessage(t("Selected location: ", "已选择位置：") + location.name);
    setShowAdvancedSettings(true);
  };
  
  const estimateBortleScale = (locationName: string): number => {
    const lowercaseName = locationName.toLowerCase();
    
    if (
      lowercaseName.includes('city') || 
      lowercaseName.includes('downtown') || 
      lowercaseName.includes('urban') ||
      lowercaseName.includes('metro')
    ) {
      return 8;
    }
    
    if (
      lowercaseName.includes('suburb') || 
      lowercaseName.includes('residential') || 
      lowercaseName.includes('town')
    ) {
      return 6;
    }
    
    if (
      lowercaseName.includes('rural') || 
      lowercaseName.includes('village') || 
      lowercaseName.includes('countryside')
    ) {
      return 4;
    }
    
    if (
      lowercaseName.includes('park') || 
      lowercaseName.includes('forest') || 
      lowercaseName.includes('national') ||
      lowercaseName.includes('desert') ||
      lowercaseName.includes('mountain') ||
      lowercaseName.includes('remote') ||
      lowercaseName.includes('wilderness')
    ) {
      return 3;
    }
    
    return 5;
  };
  
  const handleRecommendedPointSelect = (point: { name: string; latitude: number; longitude: number }) => {
    setLocationName(point.name);
    setLatitude(point.latitude.toFixed(6));
    setLongitude(point.longitude.toFixed(6));
    
    setShowAdvancedSettings(true);
    setStatusMessage(t("Selected recommended location: ", "已选择推荐位置：") + point.name);
  };
  
  const validateInputs = (): boolean => {
    if (!locationName.trim()) {
      setStatusMessage(language === 'en' ? "Please enter a location name." : "请输入位置名称。");
      return false;
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setStatusMessage(language === 'en' 
        ? "Please enter a valid latitude (-90 to 90)." 
        : "请输入有效的纬度（-90至90）。");
      return false;
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setStatusMessage(language === 'en' 
        ? "Please enter a valid longitude (-180 to 180)." 
        : "请输入有效的经度（-180至180）。");
      return false;
    }
    
    return true;
  };
  
  const getCurrentMoonPhase = (): number => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    const c = 365.25 * year;
    const e = 30.6 * month;
    const jd = c + e + day - 694039.09;
    const moonPhase = (jd % 29.53) / 29.53;
    
    return moonPhase;
  };
  
  const calculateSIQSForLocation = async (lat: number, lng: number, name: string, displayOnly: boolean = false) => {
    if (isCalculating) return;
    
    setIsCalculating(true);
    displayOnly ? null : setLoading(true);
    
    try {
      const data = await fetchWeatherData({
        latitude: lat,
        longitude: lng,
      });
      
      if (!data) {
        setStatusMessage(t("Could not retrieve weather data. Please try again.", "无法获取天气数据，请重试。"));
        setIsCalculating(false);
        displayOnly ? null : setLoading(false);
        return;
      }
      
      setWeatherData(data);
      
      let actualBortleScale = bortleScale;
      if (!displayOnly || actualBortleScale === 4) {
        try {
          const lightPollutionData = await fetchLightPollutionData(lat, lng);
          if (lightPollutionData && lightPollutionData.bortleScale) {
            actualBortleScale = lightPollutionData.bortleScale;
            if (!displayOnly) {
              setBortleScale(actualBortleScale);
            }
          }
        } catch (lightError) {
          console.error("Error fetching light pollution data in SIQS calculation:", lightError);
          // Continue with current Bortle scale value
        }
      }
      
      const moonPhase = getCurrentMoonPhase();
      
      const siqsResult = calculateSIQS({
        cloudCover: data.cloudCover,
        bortleScale: actualBortleScale,
        seeingConditions,
        windSpeed: data.windSpeed,
        humidity: data.humidity,
        moonPhase,
        precipitation: data.precipitation,
        weatherCondition: data.weatherCondition,
        aqi: data.aqi
      });
      
      if (displayOnly) {
        setSiqsScore(siqsResult.score * 10);
        setIsCalculating(false);
        return;
      }
      
      const locationId = Date.now().toString();
      
      const locationData = {
        id: locationId,
        name: name,
        latitude: lat,
        longitude: lng,
        bortleScale: actualBortleScale,
        seeingConditions,
        weatherData: data,
        siqsResult,
        moonPhase,
        timestamp: new Date().toISOString(),
      };
      
      console.log("Navigating to location details with data:", locationData);
      
      navigate(`/location/${locationId}`, { state: locationData });
    } catch (error) {
      console.error("Error calculating SIQS:", error);
      setStatusMessage(t("An error occurred while calculating SIQS. Please try again.", "计算SIQS时发生错误，请重试。"));
      setIsCalculating(false);
      displayOnly ? null : setLoading(false);
    }
  };
  
  const handleCalculate = () => {
    if (!validateInputs()) return;
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng) || !locationName) {
      setStatusMessage(t("Please enter a valid location with coordinates.", "请输入有效的位置和坐标。"));
      return;
    }
    
    calculateSIQSForLocation(lat, lng, locationName);
  };

  const getRecommendationMessageLocal = (siqsScore: number): string => {
    return getRecommendationMessage(siqsScore / 10, language);
  };

  const getBortleScaleDescription = (value: number): string => {
    const descriptions = [
      t("1: Excellent dark-sky site, no light pollution", "1: 极佳的暗空环境，无光污染"),
      t("2: Typical truly dark site, Milky Way casts shadows", "2: 真正的黑暗区域，银河可投下阴影"),
      t("3: Rural sky, some light pollution but Milky Way still visible", "3: 乡村天空，有一些光污染但仍能看到银河"),
      t("4: Rural/suburban transition, Milky Way visible but lacks detail", "4: 乡村/郊区过渡区，能看到银河但缺乏细节"),
      t("5: Suburban sky, Milky Way very dim or invisible", "5: 郊区天空，银河非常暗或不可见"),
      t("6: Bright suburban sky, no Milky Way, only brightest constellations visible", "6: 明亮的郊区天空，看不到银河，只能看到最明亮的星座"),
      t("7: Suburban/urban transition, most stars washed out", "7: 郊区/城市过渡区，大多数恒星被洗掉"),
      t("8: Urban sky, few stars visible, planets still visible", "8: 城市天空，可见少量恒星，行星仍然可见"),
      t("9: Inner-city sky, only brightest stars and planets visible", "9: 市中心天空，只有最明亮的恒星和行星可见")
    ];
    return descriptions[value - 1] || t("Unknown", "未知");
  };

  const getSeeingDescription = (value: number): string => {
    const descriptions = [
      t("1: Perfect seeing, stars perfectly still", "1: 完美视宁度，恒星完全静止"),
      t("1.5: Excellent seeing, stars mostly still", "1.5: 极佳视宁度，恒星几乎静止"),
      t("2: Good seeing, slight twinkling", "2: 良好视宁度，轻微闪烁"),
      t("2.5: Average seeing, moderate twinkling", "2.5: 一般视宁度，中等闪烁"),
      t("3: Fair seeing, noticeable twinkling", "3: 尚可视宁度，明显闪烁"),
      t("3.5: Below average seeing, significant twinkling", "3.5: 低于平均视宁度，明显闪烁"),
      t("4: Poor seeing, constant twinkling", "4: 较差视宁度，持续闪烁"),
      t("4.5: Very poor seeing, images blurry", "4.5: 非常差的视宁度，图像模糊"),
      t("5: Terrible seeing, imaging nearly impossible", "5: 极差视宁度，几乎无法成像")
    ];
    
    const index = Math.round((value - 1) * 2);
    return descriptions[index] || t("Unknown", "未知");
  };
  
  useEffect(() => {
    return () => {
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <div className={`glassmorphism rounded-xl p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">
          {t("Calculate Stellar Imaging Quality Score", "计算恒星成像质量评分")}
        </h2>
      </div>
      
      {statusMessage && (
        <div className="mb-4 p-3 bg-background/70 border border-border rounded-md text-sm">
          {statusMessage}
        </div>
      )}
      
      {siqsScore !== null && (
        <div className="mb-6 p-4 glass-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">
              {t("Estimated SIQS Score", "预估SIQS评分")}
            </h3>
            <div className="flex items-center">
              <span className={`text-2xl font-bold ${
                siqsScore >= 80 ? 'text-green-400' : 
                siqsScore >= 60 ? 'text-green-300' : 
                siqsScore >= 40 ? 'text-yellow-300' : 
                siqsScore >= 20 ? 'text-orange-300' : 'text-red-400'
              }`}>{(siqsScore / 10).toFixed(1)}</span>
              <span className="text-lg text-muted-foreground">/10</span>
            </div>
          </div>
          <div className="w-full h-3 bg-cosmic-800/50 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                siqsScore >= 80 ? 'score-excellent' : 
                siqsScore >= 60 ? 'score-good' : 
                siqsScore >= 40 ? 'score-average' : 
                siqsScore >= 20 ? 'score-poor' : 'score-bad'}`} 
              style={{ width: `${siqsScore}%` }}
            />
          </div>
          
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{t("Poor", "差")}</span>
            <span>{t("Average", "一般")}</span>
            <span>{t("Excellent", "优秀")}</span>
          </div>
          
          <p className="text-sm mt-3 font-medium italic text-center">
            "{getRecommendationMessageLocal(siqsScore)}"
          </p>
          
          <p className="text-xs text-muted-foreground mt-3">
            {language === 'en' 
              ? "This is an estimated score based on current data. For detailed analysis with forecast data, click \"See More Details\" below." 
              : "这是根据当前数据的预估评分。要获取基于预测数据的详细分析，请点击下方的\"查看更多详情\"。"}
          </p>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="flex flex-col space-y-3">
          <Button 
            variant={locationName ? "default" : "outline"}
            type="button" 
            onClick={handleUseCurrentLocation}
            disabled={loading}
            className={`w-full hover-card transition-colors ${locationName ? 'bg-primary' : 'hover:bg-primary/10'}`}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="mr-2 h-4 w-4" />
            )}
            {locationName ? (
              <span className="truncate max-w-[90%]">
                {locationName}
              </span>
            ) : (
              t("Use My Location", "使用我的位置")
            )}
          </Button>
          
          <div className="relative mt-2">
            <MapSelector onSelectLocation={handleLocationSelect} />
          </div>
        </div>
        
        <div className="pt-2 pb-2">
          <hr className="border-cosmic-800/30" />
        </div>
        
        {!hideRecommendedPoints && (
          <RecommendedPhotoPoints 
            onSelectPoint={handleRecommendedPointSelect}
            userLocation={userLocation}
          />
        )}
        
        {locationName && (
          <div className="space-y-4 animate-fade-in">
            <Button
              type="button"
              onClick={handleCalculate}
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-primary/80 to-primary hover:opacity-90"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                t("See More Details", "查看更多详情")
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SIQSCalculator;
