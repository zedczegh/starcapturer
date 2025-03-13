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
import { fetchWeatherData, fetchForecastData, determineWeatherCondition, fetchLightPollutionData, getLocationNameFromCoordinates } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import MapSelector, { Location } from "@/components/MapSelector";
import LongRangeForecast from "@/components/LongRangeForecast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarRange, Calendar, MapPin, Locate, Navigation, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  const [gettingUserLocation, setGettingUserLocation] = useState(false);
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
            "基于位置坐标已更新光污染级��。"
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
                      "无法加载延长天气预报。请尝试刷新。")
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
        aqi: weatherData.aqi, // Include AQI in SIQS calculation if available
        weatherCondition: weatherData.weatherCondition
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

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t("Geolocation Error", "定位错误"), {
        description: t("Geolocation is not supported by your browser.", "您的浏览器不支持地理定位。")
      });
      return;
    }

    setGettingUserLocation(true);
    toast.info(t("Getting Your Location", "正在获取您的位置"), { 
      description: t("Please wait while we determine your current location...", "请等待，我们正在确定您的当前位置...")
    });

    const locationTimeout = setTimeout(() => {
      setGettingUserLocation(false);
      toast.error(t("Location Timeout", "位置请求超时"), {
        description: t("Could not get your location in time. Please try again or use another method.", 
                      "无法及时获取您的位置。请重试或使用其他方法。")
      });
    }, 15000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(locationTimeout);
        try {
          const { latitude, longitude } = position.coords;
          
          // Get location name
          const locationName = await getLocationNameFromCoordinates(latitude, longitude, language === 'zh' ? 'zh' : 'en');
          
          // Update with current location
          await handleLocationUpdate({
            name: locationName,
            latitude,
            longitude
          });
          
          toast.success(t("Location Updated", "位置已更新"), {
            description: t("Using your current location.", "使用您的当前位置。")
          });
        } catch (error) {
          console.error("Error getting current location:", error);
          toast.error(t("Location Error", "位置错误"), {
            description: t("Failed to get your current location.", "无法获取您的当前位置。")
          });
        } finally {
          setGettingUserLocation(false);
        }
      },
      (error) => {
        clearTimeout(locationTimeout);
        console.error("Geolocation error:", error);
        let errorMessage = t("Unknown error occurred.", "发生了未知错误。");
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t("You denied the request for geolocation.", "您拒绝了地理定位请求。");
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = t("Location information is unavailable.", "位置信息不可用。");
            break;
          case error.TIMEOUT:
            errorMessage = t("The request to get location timed out.", "获取位置请求超时。");
            break;
        }
        
        toast.error(t("Geolocation Error", "定位错误"), {
          description: errorMessage
        });
        
        setGettingUserLocation(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  const handleManualCoordinates = () => {
    if (locationData) {
      const lat = prompt(t("Enter latitude (-90 to 90):", "输入纬度（-90至90）:"), locationData.latitude.toString());
      const lng = prompt(t("Enter longitude (-180 to 180):", "输入经度（-180至180）:"), locationData.longitude.toString());
      
      if (lat && lng) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        
        if (!isNaN(latitude) && !isNaN(longitude) && 
            latitude >= -90 && latitude <= 90 && 
            longitude >= -180 && longitude <= 180) {
          
          (async () => {
            try {
              const name = await getLocationNameFromCoordinates(latitude, longitude, language === 'zh' ? 'zh' : 'en');
              handleLocationUpdate({
                name,
                latitude,
                longitude
              });
            } catch (error) {
              const fallbackName = t(
                `Location at ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`,
                `位置：${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`
              );
              handleLocationUpdate({
                name: fallbackName,
                latitude,
                longitude
              });
            }
          })();
        } else {
          toast.error(t("Invalid Coordinates", "无效坐标"), {
            description: t(
              "Please enter valid coordinates: latitude (-90 to 90) and longitude (-180 to 180).",
              "请输入有效坐标：纬度（-90至90）和经度（-180至180）。"
            )
          });
        }
      }
    }
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
      determineWeatherCondition(locationData?.weatherData?.cloudCover || 0),
    aqi: locationData?.weatherData?.aqi // Pass AQI to WeatherConditions component
  };

  const formatMoonPhase = (phase: number) => {
    const { t } = useLanguage();
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
    const { t } = useLanguage();
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
          <div className="text-center max-w-md p-6 bg-cosmic-900/60 backdrop-blur-sm rounded-lg border border-cosmic-700/30 shadow-lg">
            <h1 className="text-2xl font-bold mb-4">{t("Location Not Found", "位置未找到")}</h1>
            <p className="text-muted-foreground mb-6">
              {t("The location information you're looking for doesn't exist or has expired. Redirecting you to the home page...", 
                 "您正在查找的位置信息不存在或已过期。正在将您重定向到首页...")}
            </p>
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
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
                  determineWeatherCondition(locationData.weatherData?.cloudCover || 0),
                aqi: locationData.weatherData?.aqi // Pass AQI to component
              }}
              moonPhase={formatMoonPhase(locationData.moonPhase || 0)}
              bortleScale={locationData.bortleScale || 4}
              seeingConditions={formatSeeingConditions(locationData.seeingConditions || 3)}
            />
          </div>
          
          <div className="space-y-8">
            <div className="relative z-60">
              <Card className="shadow-md overflow-hidden border-cosmic-700/40 bg-cosmic-900/60 backdrop-blur-md hover:shadow-cosmic-700/20 transition-all hover:shadow-lg">
                <CardHeader className="pb-2 bg-cosmic-800/40 border-b border-cosmic-700/30">
                  <CardTitle className="text-xl flex items-center text-primary/90">
                    <MapPin className="mr-2 h-5 w-5" />
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
                  <div className="p-4 border-t border-border/30 space-y-4">
                    <div className="flex flex-col md:flex-row gap-3">
                      <Button 
                        variant="outline" 
                        className="group flex-1 flex items-center justify-center gap-2 bg-cosmic-800/50 border-cosmic-700/30 hover:bg-cosmic-700/50 transition-all" 
                        onClick={handleGetCurrentLocation}
                        disabled={gettingUserLocation}
                      >
                        <Locate className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        {gettingUserLocation 
                          ? t("Getting location...", "获取位置中...") 
                          : t("Use my current location", "使用我的当前位置")}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="group flex-1 flex items-center justify-center gap-2 bg-cosmic-800/50 border-cosmic-700/30 hover:bg-cosmic-700/50 transition-all" 
                        onClick={handleManualCoordinates}
                      >
                        <Navigation className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        {t("Enter coordinates", "输入坐标")}
                      </Button>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-3">
                        {t("Search for another location", "搜索其他位置")}
                      </div>
                      <MapSelector onSelectLocation={handleLocationSearch} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Tabs defaultValue="hourly" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4 bg-cosmic-800/60 backdrop-blur-md border border-cosmic-700/30">
                <TabsTrigger value="hourly" className="flex items-center gap-2 data-[state=active]:bg-cosmic-700/70">
                  <Calendar className="h-4 w-4" />
                  {t("Hourly Forecast", "小时预报")}
                </TabsTrigger>
                <TabsTrigger value="extended" className="flex items-center gap-2 data-[state=active]:bg-cosmic-700/70">
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
        
        <div className="mt-10 flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => {
              toast.info(t("Refreshing Data", "正在刷新数据"), {
                description: t("Updating all data for this location", "正在更新此位置的所有数据")
              });
              fetchLocationForecast();
              fetchLongRangeForecast();
              updateLightPollutionData();
            }}
            className="bg-cosmic-800/40 border-cosmic-700/30 hover:bg-cosmic-700/60 transition-all group"
          >
            <RefreshCcw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-700" />
            {t("Refresh All Data", "刷新所有数据")}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default LocationDetails;
