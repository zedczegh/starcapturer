import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import LocationHeader from "@/components/location/LocationHeader";
import SIQSSummary from "@/components/SIQSSummary";
import WeatherConditions from "@/components/WeatherConditions";
import LocationMap from "@/components/LocationMap";
import ForecastTable from "@/components/ForecastTable";
import { toast } from "sonner";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { fetchWeatherData, fetchForecastData, determineWeatherCondition, fetchLightPollutionData } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import MapSelector, { Location } from "@/components/MapSelector";
import LongRangeForecast from "@/components/LongRangeForecast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarRange, Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LocationDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [locationData, setLocationData] = useState<any>(null);
  const [forecastData, setForecastData] = useState(null);
  const [longRangeForecast, setLongRangeForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [longRangeLoading, setLongRangeLoading] = useState(false);
  const { language, t } = useLanguage();

  useEffect(() => {
    if (!locationData && location.state) {
      console.log("Setting location data from state:", location.state);
      setLocationData(location.state);
    } else if (!locationData && !location.state) {
      console.error("Location data is missing", { params: id, locationState: location.state });
      toast.error(t("Location Not Found", "位置未找到"), {
        description: t("The requested location information is not available or has expired.", 
                       "请求的位置信息不可用或已过期。"),
      });
      
      const redirectTimer = setTimeout(() => {
        navigate("/");
      }, 3000);
      
      return () => clearTimeout(redirectTimer);
    } else if (locationData) {
      fetchLocationForecast();
      fetchLongRangeForecast();
      updateLightPollutionData();
    }
  }, [locationData, location.state, navigate, t, id]);

  const updateLightPollutionData = async () => {
    if (!locationData) return;
    
    try {
      const bortleData = await fetchLightPollutionData(locationData.latitude, locationData.longitude);
      
      if (bortleData && bortleData.bortleScale !== locationData.bortleScale) {
        const updatedLocationData = {
          ...locationData,
          bortleScale: bortleData.bortleScale
        };
        
        const moonPhase = locationData.moonPhase || 0;
        const siqsResult = calculateSIQS({
          cloudCover: locationData.weatherData.cloudCover,
          bortleScale: bortleData.bortleScale,
          seeingConditions: locationData.seeingConditions || 3,
          windSpeed: locationData.weatherData.windSpeed,
          humidity: locationData.weatherData.humidity,
          moonPhase,
        });
        
        setLocationData({
          ...updatedLocationData,
          siqsResult
        });
        
        toast.success(t("Light Pollution Data Updated", "光污染数据已更新"), {
          description: t(
            "Light pollution level has been updated based on location coordinates.",
            "基于位置坐标已更新光污染级别。"
          )
        });
      }
    } catch (error) {
      console.error("Error updating light pollution data:", error);
      // Silent failure for light pollution updates - use existing data
      // This prevents disrupting the user experience due to API issues
    }
  };

  const fetchLocationForecast = async () => {
    if (!locationData) return;
    
    setForecastLoading(true);
    try {
      const forecast = await fetchForecastData({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      });
      
      setForecastData(forecast);
      if (!forecast) {
        console.error("Forecast data not available or incomplete");
      }
    } catch (error) {
      console.error("Error fetching forecast:", error);
      toast.error(t("Forecast Error", "预报错误"), {
        description: t("Could not load weather forecast. Try refreshing.", 
                      "无法加载天气预报。请尝试刷新。")
      });
    } finally {
      setForecastLoading(false);
    }
  };

  const fetchLongRangeForecast = async () => {
    if (!locationData) return;
    
    setLongRangeLoading(true);
    try {
      const forecast = await fetchForecastData({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        days: 16 // Request 16 days including today
      });
      
      setLongRangeForecast(forecast);
      if (!forecast) {
        console.error("Long range forecast data not available or incomplete");
      }
    } catch (error) {
      console.error("Error fetching long range forecast:", error);
      toast.error(t("Forecast Error", "预报错误"), {
        description: t("Could not load extended forecast. Try refreshing.", 
                      "无法加载延��天气预报。请尝试刷新。")
      });
    } finally {
      setLongRangeLoading(false);
    }
  };

  const handleRefreshLongRangeForecast = () => {
    fetchLongRangeForecast();
    toast.info(t("Refreshing Extended Forecast", "正在刷新延长预报"), {
      description: t("Updating 15-day forecast data...", "正在更新15天预报数据...")
    });
  };

  const handleRefreshForecast = () => {
    fetchLocationForecast();
    toast.info(t("Refreshing Forecast", "正在刷新预报"), {
      description: t("Updating weather forecast data...", "正在更新天气预报数据...")
    });
  };

  const handleLocationUpdate = async (newLocation: { name: string; latitude: number; longitude: number }) => {
    setLoading(true);
    try {
      const weatherData = await fetchWeatherData({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      });

      if (!weatherData) {
        throw new Error("Failed to retrieve weather data for this location");
      }

      let bortleScale = locationData?.bortleScale || 4;
      try {
        const bortleData = await fetchLightPollutionData(newLocation.latitude, newLocation.longitude);
        if (bortleData?.bortleScale) {
          bortleScale = bortleData.bortleScale;
        }
      } catch (lightError) {
        console.error("Error fetching light pollution data during location update:", lightError);
        // Continue with existing or default bortle scale
      }
      
      const moonPhase = locationData?.moonPhase || 0;
      
      const siqsResult = calculateSIQS({
        cloudCover: weatherData.cloudCover,
        bortleScale: bortleScale,
        seeingConditions: locationData?.seeingConditions || 3,
        windSpeed: weatherData.windSpeed,
        humidity: weatherData.humidity,
        moonPhase,
      });

      const updatedLocationData = {
        ...locationData,
        ...newLocation,
        weatherData,
        bortleScale,
        siqsResult,
        timestamp: new Date().toISOString()
      };

      setLocationData(updatedLocationData);

      try {
        const forecast = await fetchForecastData({
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
        });
        
        setForecastData(forecast);
      } catch (forecastError) {
        console.error("Error fetching forecast during location update:", forecastError);
        // Continue without setting forecast data
      }

      const newLocationId = Date.now().toString();
      
      navigate(`/location/${newLocationId}`, { 
        state: updatedLocationData,
        replace: true 
      });

      toast.success(t("Location Updated", "位置已更新"), {
        description: t("SIQS score has been recalculated for the new location.", 
                       "已为新位置重新计算SIQS评分。"),
      });
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error(t("Update Error", "更新错误"), {
        description: t("Failed to update location and recalculate SIQS score. Please try again.", 
                      "无法更新位置并重新计算SIQS评分。请重试。"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSearch = (selectedLocation: Location) => {
    handleLocationUpdate({
      name: selectedLocation.name,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude
    });
    
    toast.success(t("Location Updated", "位置已更新"), {
      description: t(`Now viewing ${selectedLocation.name}`, `现在查看 ${selectedLocation.name}`)
    });
  };

  const siqsResult = locationData?.siqsResult || { 
    score: 0, 
    factors: [], 
    isViable: false 
  };
  
  const siqsScore = siqsResult.score;
  
  const weatherData = {
    temperature: locationData?.weatherData?.temperature || 0,
    humidity: locationData?.weatherData?.humidity || 0,
    cloudCover: locationData?.weatherData?.cloudCover || 0,
    windSpeed: locationData?.weatherData?.windSpeed || 0,
    precipitation: locationData?.weatherData?.precipitation || 0,
    time: locationData?.weatherData?.time || new Date().toISOString(),
    condition: locationData?.weatherData?.condition || 
      determineWeatherCondition(locationData?.weatherData?.cloudCover || 0)
  };

  const formatMoonPhase = (phase: number) => {
    if (typeof phase !== 'number') return t("Unknown", "未知");
    
    if (phase <= 0.05 || phase >= 0.95) return t("New Moon", "新月");
    if (phase < 0.25) return t("Waxing Crescent", "眉月");
    if (phase < 0.30) return t("First Quarter", "上弦月");
    if (phase < 0.45) return t("Waxing Gibbous", "盈凸月");
    if (phase < 0.55) return t("Full Moon", "满月");
    if (phase < 0.70) return t("Waning Gibbous", "亏凸月");
    if (phase < 0.80) return t("Last Quarter", "下弦月");
    return t("Waning Crescent", "残月");
  };

  const formatSeeingConditions = (value: number) => {
    if (typeof value !== 'number') return t("Average", "一般");
    
    if (value <= 1) return t("Excellent", "极佳");
    if (value <= 2) return t("Good", "良好");
    if (value <= 3) return t("Average", "一般");
    if (value <= 4) return t("Poor", "较差");
    return t("Very Poor", "非常差");
  };

  if (!locationData) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">{t("Location Not Found", "位置未找到")}</h1>
            <p className="text-muted-foreground mb-6">
              {t("The location information you're looking for doesn't exist or has expired. Redirecting you to the home page...", 
                 "您正在查找的位置信息不存在或已过期。正在将您重定向到首页...")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden sci-fi-scrollbar pb-16 md:pb-0">
      <NavBar />
      
      <main className="container mx-auto px-4 pt-28 pb-16">
        <LocationHeader 
          name={locationData.name}
          latitude={locationData.latitude}
          longitude={locationData.longitude}
          timestamp={locationData.timestamp}
          loading={loading}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <SIQSSummary
              siqs={locationData.siqsResult?.score || 0}
              factors={locationData.siqsResult?.factors || []}
              isViable={locationData.siqsResult?.isViable || false}
            />
            
            <WeatherConditions
              weatherData={{
                temperature: locationData.weatherData?.temperature || 0,
                humidity: locationData.weatherData?.humidity || 0,
                cloudCover: locationData.weatherData?.cloudCover || 0,
                windSpeed: locationData.weatherData?.windSpeed || 0,
                precipitation: locationData.weatherData?.precipitation || 0,
                time: locationData.weatherData?.time || new Date().toISOString(),
                condition: locationData.weatherData?.condition || 
                  determineWeatherCondition(locationData.weatherData?.cloudCover || 0)
              }}
              moonPhase={formatMoonPhase(locationData.moonPhase || 0)}
              bortleScale={locationData.bortleScale || 4}
              seeingConditions={formatSeeingConditions(locationData.seeingConditions || 3)}
            />
          </div>
          
          <div className="space-y-8">
            <div className="relative z-60">
              <Card className="shadow-md overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-primary/80" />
                    {t("Location", "位置")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <LocationMap
                    latitude={locationData.latitude}
                    longitude={locationData.longitude}
                    name={locationData.name || t("Unnamed Location", "未命名位置")}
                    onLocationUpdate={handleLocationUpdate}
                    editable={true}
                  />
                  <div className="p-4 border-t border-border/30">
                    <div className="text-sm text-muted-foreground mb-3">
                      {t("Search for another location", "搜索其他位置")}
                    </div>
                    <MapSelector onSelectLocation={handleLocationSearch} />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Tabs defaultValue="hourly" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="hourly" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("Hourly Forecast", "小时预报")}
                </TabsTrigger>
                <TabsTrigger value="extended" className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4" />
                  {t("15-Day Forecast", "15天预报")}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="hourly" className="mt-0">
                <ForecastTable 
                  forecastData={forecastData}
                  isLoading={forecastLoading}
                  onRefresh={handleRefreshForecast}
                />
              </TabsContent>
              
              <TabsContent value="extended" className="mt-0">
                <LongRangeForecast
                  forecastData={longRangeForecast}
                  isLoading={longRangeLoading}
                  onRefresh={handleRefreshLongRangeForecast}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LocationDetails;
