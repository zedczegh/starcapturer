
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/use-toast";
import { fetchWeatherData, getLocationNameFromCoordinates } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { MapPin, Loader2, Info, SlidersHorizontal, Globe } from "lucide-react";
import MapSelector from "./MapSelector";
import RecommendedPhotoPoints from "./RecommendedPhotoPoints";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SIQSCalculatorProps {
  className?: string;
}

const SIQSCalculator: React.FC<SIQSCalculatorProps> = ({ className }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [bortleScale, setBortleScale] = useState(4);
  const [seeingConditions, setSeeingConditions] = useState(2);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [askedForLocation, setAskedForLocation] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [siqsScore, setSiqsScore] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [language, setLanguage] = useState<'en' | 'zh'>('en');
  
  useEffect(() => {
    if (!askedForLocation) {
      setAskedForLocation(true);
      
      const userConfirmText = language === 'en' 
        ? "Would you like to share your location to calculate your local SIQS and see nearby photo points?"
        : "您想分享您的位置以计算当地的SIQS并查看附近的拍摄点吗？";
        
      if (window.confirm(userConfirmText)) {
        handleUseCurrentLocation();
      }
    }
  }, []);

  useEffect(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (locationName && !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      calculateSIQSForLocation(lat, lng, locationName, true);
    }
  }, [latitude, longitude, locationName, bortleScale, seeingConditions]);
  
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setLatitude(lat.toFixed(6));
          setLongitude(lng.toFixed(6));
          setUserLocation({ latitude: lat, longitude: lng });
          
          try {
            const name = await getLocationNameFromCoordinates(lat, lng, language);
            console.log("Got location name:", name);
            setLocationName(name);
            
            setShowAdvancedSettings(true);
            
            toast({
              title: language === 'en' ? "Location Retrieved" : "已获取位置",
              description: language === 'en' 
                ? `Your current location: ${name}` 
                : `您当前的位置：${name}`,
            });
            
            setLoading(false);
          } catch (error) {
            console.error("Error getting location name:", error);
            const fallbackName = language === 'en'
              ? `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
              : `位置：${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setLocationName(fallbackName);
            setShowAdvancedSettings(true);
            setLoading(false);
          }
        },
        (error) => {
          setLoading(false);
          toast({
            title: language === 'en' ? "Location Error" : "位置错误",
            description: language === 'en'
              ? "Could not retrieve your location. Please enter coordinates manually."
              : "无法获取您的位置，请手动输入坐标。",
            variant: "destructive",
          });
          console.error("Geolocation error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      toast({
        title: language === 'en' ? "Geolocation Not Supported" : "不支持地理位置",
        description: language === 'en'
          ? "Your browser doesn't support geolocation. Please enter coordinates manually."
          : "您的浏览器不支持地理位置，请手动输入坐标。",
        variant: "destructive",
      });
    }
  };
  
  const handleLocationSelect = (location: { name: string; latitude: number; longitude: number }) => {
    setLocationName(location.name);
    setLatitude(location.latitude.toFixed(6));
    setLongitude(location.longitude.toFixed(6));
    
    const newBortleScale = estimateBortleScale(location.name);
    setBortleScale(newBortleScale);
    
    toast({
      title: language === 'en' ? "Location Selected" : "已选择位置",
      description: language === 'en' ? `Selected ${location.name}` : `已选择 ${location.name}`,
    });
    
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
    
    toast({
      title: "Location Selected",
      description: `Selected ${point.name}`,
    });
  };
  
  const validateInputs = (): boolean => {
    if (!locationName.trim()) {
      toast({
        title: language === 'en' ? "Input Error" : "输入错误",
        description: language === 'en' ? "Please enter a location name." : "请输入位置名称。",
        variant: "destructive",
      });
      return false;
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast({
        title: language === 'en' ? "Input Error" : "输入错误",
        description: language === 'en' 
          ? "Please enter a valid latitude (-90 to 90)." 
          : "请输入有效的纬度（-90至90）。",
        variant: "destructive",
      });
      return false;
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast({
        title: language === 'en' ? "Input Error" : "输入错误",
        description: language === 'en' 
          ? "Please enter a valid longitude (-180 to 180)." 
          : "请输入有效的经度（-180至180）。",
        variant: "destructive",
      });
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
      const weatherData = await fetchWeatherData({
        latitude: lat,
        longitude: lng,
      });
      
      if (!weatherData) {
        setIsCalculating(false);
        displayOnly ? null : setLoading(false);
        return;
      }
      
      const moonPhase = getCurrentMoonPhase();
      
      const siqsResult = calculateSIQS({
        cloudCover: weatherData.cloudCover,
        bortleScale,
        seeingConditions,
        windSpeed: weatherData.windSpeed,
        humidity: weatherData.humidity,
        moonPhase,
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
        bortleScale,
        seeingConditions,
        weatherData,
        siqsResult,
        moonPhase,
        timestamp: new Date().toISOString(),
      };
      
      navigate(`/location/${locationId}`, { state: locationData });
    } catch (error) {
      console.error("Error calculating SIQS:", error);
      toast({
        title: "Calculation Error",
        description: "An error occurred while calculating SIQS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
      displayOnly ? null : setLoading(false);
    }
  };
  
  const handleCalculate = () => {
    if (!validateInputs()) return;
    calculateSIQSForLocation(parseFloat(latitude), parseFloat(longitude), locationName);
  };

  const getBortleScaleDescription = (value: number): string => {
    const descriptions = language === 'en' ?
    [
      "1: Excellent dark-sky site, no light pollution",
      "2: Typical truly dark site, Milky Way casts shadows",
      "3: Rural sky, some light pollution but Milky Way still visible",
      "4: Rural/suburban transition, Milky Way visible but lacks detail",
      "5: Suburban sky, Milky Way very dim or invisible",
      "6: Bright suburban sky, no Milky Way, only brightest constellations visible",
      "7: Suburban/urban transition, most stars washed out",
      "8: Urban sky, few stars visible, planets still visible",
      "9: Inner-city sky, only brightest stars and planets visible"
    ] : [
      "1: 极佳的暗空环境，无光污染",
      "2: 真正的黑暗区域，银河可投下阴影",
      "3: 乡村天空，有一些光污染但仍能看到银河",
      "4: 乡村/郊区过渡区，能看到银河但缺乏细节",
      "5: 郊区天空，银河非常暗或不可见",
      "6: 明亮的郊区天空，看不到银河，只能看到最明亮的星座",
      "7: 郊区/城市过渡区，大多数恒星被洗掉",
      "8: 城市天空，可见少量恒星，行星仍可见",
      "9: 市中心天空，只有最明亮的恒星和行星可见"
    ];
    return descriptions[value - 1] || (language === 'en' ? "Unknown" : "未知");
  };

  const getSeeingDescription = (value: number): string => {
    const descriptions = language === 'en' ?
    [
      "1: Perfect seeing, stars perfectly still",
      "1.5: Excellent seeing, stars mostly still",
      "2: Good seeing, slight twinkling",
      "2.5: Average seeing, moderate twinkling",
      "3: Fair seeing, noticeable twinkling",
      "3.5: Below average seeing, significant twinkling",
      "4: Poor seeing, constant twinkling",
      "4.5: Very poor seeing, images blurry",
      "5: Terrible seeing, imaging nearly impossible"
    ] : [
      "1: 完美视宁度，恒星完全静止",
      "1.5: 极佳视宁度，恒星几乎静止",
      "2: 良好视宁度，轻微闪烁",
      "2.5: 一般视宁度，中等闪烁",
      "3: 尚可视宁度，明显闪烁",
      "3.5: 低于平均视宁度，明显闪烁",
      "4: 较差视宁度，持续闪烁",
      "4.5: 非常差的视宁度，图像模糊",
      "5: 极差视宁度，几乎无法成像"
    ];
    
    const index = Math.round((value - 1) * 2);
    return descriptions[index] || (language === 'en' ? "Unknown" : "未知");
  };
  
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };
  
  return (
    <div className={`glassmorphism rounded-xl p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">
          {language === 'en' ? "Calculate Stellar Imaging Quality Score" : "计算恒星成像质量评分"}
        </h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center" 
          onClick={toggleLanguage}
        >
          <Globe className="h-4 w-4 mr-1" />
          {language === 'en' ? "中文" : "English"}
        </Button>
      </div>
      
      {siqsScore !== null && (
        <div className="mb-6 p-4 glass-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">
              {language === 'en' ? "Estimated SIQS Score" : "预估SIQS评分"}
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
            <span>{language === 'en' ? "Poor" : "差"}</span>
            <span>{language === 'en' ? "Average" : "一般"}</span>
            <span>{language === 'en' ? "Excellent" : "优秀"}</span>
          </div>
          
          <p className="text-xs text-muted-foreground mt-3">
            {language === 'en' 
              ? "This is an estimated score based on current data. For detailed analysis with forecast data, click \"Calculate SIQS Score\" below." 
              : "这是根据当前数据的预估评分。要获取基于预测数据的详细分析，请点击下方的"计算SIQS评分"。"}
          </p>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="flex flex-col space-y-3">
          <Button 
            variant="outline" 
            type="button" 
            onClick={handleUseCurrentLocation}
            disabled={loading}
            className="w-full hover-card transition-colors hover:bg-primary/10"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="mr-2 h-4 w-4" />
            )}
            {language === 'en' ? "Use My Location" : "使用我的位置"}
          </Button>
          
          <div className="relative">
            <MapSelector onSelectLocation={handleLocationSelect} />
          </div>
        </div>
        
        <div className="pt-2 pb-2">
          <hr className="border-cosmic-800/30" />
        </div>
        
        <RecommendedPhotoPoints 
          onSelectPoint={handleRecommendedPointSelect}
          userLocation={userLocation}
          language={language}
        />
        
        {locationName && (
          <div className="space-y-4 animate-fade-in">
            <Label htmlFor="locationName">
              {language === 'en' ? "Selected Location" : "已选位置"}
            </Label>
            <div className="flex gap-2 mt-1.5 items-center">
              <Input
                id="locationName"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                disabled={loading}
                className="flex-1 bg-cosmic-800/30"
              />
            </div>
            
            <Collapsible
              open={showAdvancedSettings}
              onOpenChange={setShowAdvancedSettings}
              className="mt-4 border border-cosmic-600/30 rounded-lg p-4 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center">
                  <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                  {language === 'en' ? "Observation Settings" : "观测设置"}
                </h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0 hover:bg-primary/10">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              <CollapsibleContent className="mt-4 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="bortleScale" className="text-sm">
                      {language === 'en' ? "Bortle Scale (Light Pollution)" : "波特尔指数（光污染）"}
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <Info className="h-4 w-4" />
                            <span className="sr-only">Info</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="w-80 p-4 glass-card">
                          <p>
                            {language === 'en' 
                              ? "The Bortle scale measures the night sky's brightness, with 1 being darkest and 9 brightest. Urban areas typically range from 7-9."
                              : "波特尔指数衡量夜空的亮度，1级最暗，9级最亮。城市区域通常在7-9级。"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="bortleScale"
                      min={1}
                      max={9}
                      step={1}
                      value={[bortleScale]}
                      onValueChange={(value) => setBortleScale(value[0])}
                      className="flex-1"
                    />
                    <span className="bg-cosmic-800/50 w-8 text-center rounded py-1 text-sm">
                      {bortleScale}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getBortleScaleDescription(bortleScale)}
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="seeingConditions" className="text-sm">
                      {language === 'en' 
                        ? "Seeing Conditions (Atmospheric Stability)" 
                        : "视宁度（大气稳定性）"}
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <Info className="h-4 w-4" />
                            <span className="sr-only">Info</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="w-80 p-4 glass-card">
                          <p>
                            {language === 'en'
                              ? "Seeing conditions rate atmospheric turbulence from 1 (perfectly stable) to 5 (highly unstable). Affects image sharpness and detail."
                              : "视宁度衡量大气湍流程度，从1（完全稳定）到5（高度不稳定）。影响图像清晰度和细节。"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="seeingConditions"
                      min={1}
                      max={5}
                      step={0.5}
                      value={[seeingConditions]}
                      onValueChange={(value) => setSeeingConditions(value[0])}
                      className="flex-1"
                    />
                    <span className="bg-cosmic-800/50 w-8 text-center rounded py-1 text-sm">
                      {seeingConditions}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getSeeingDescription(seeingConditions)}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            <Button
              type="button"
              onClick={handleCalculate}
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-primary/80 to-primary hover:opacity-90"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                language === 'en' ? "Calculate SIQS Score" : "计算SIQS评分"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SIQSCalculator;
