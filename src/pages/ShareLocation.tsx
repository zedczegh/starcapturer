
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import ShareLocationForm from "@/components/ShareLocationForm";
import { toast } from "@/components/ui/use-toast";
import { getBortleScaleFromDatabase } from "@/data/bortleScaleDatabase";
import { findNearestLocationsInDatabase } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, MapPinOff } from "lucide-react";

const ShareLocation = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; name?: string } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  useEffect(() => {
    // Attempt to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          
          try {
            // Use our database to get location name
            const nearbyLocations = findNearestLocationsInDatabase(latitude, longitude, 30);
            
            let locationName;
            if (nearbyLocations && nearbyLocations.length > 0 && nearbyLocations[0].distance < 30) {
              // Use the name from our database
              locationName = nearbyLocations[0].name;
              if (nearbyLocations[0].country) {
                locationName += `, ${nearbyLocations[0].country}`;
              }
            } else {
              // Try to get the name from OpenStreetMap
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`
              );
              
              if (response.ok) {
                const data = await response.json();
                if (data.display_name) {
                  if (data.address) {
                    const parts = [];
                    if (data.address.city || data.address.town || data.address.village) {
                      parts.push(data.address.city || data.address.town || data.address.village);
                    }
                    if (data.address.state || data.address.province) {
                      parts.push(data.address.state || data.address.province);
                    }
                    if (data.address.country) {
                      parts.push(data.address.country);
                    }
                    
                    if (parts.length > 0) {
                      locationName = parts.join(', ');
                    } else {
                      locationName = data.display_name;
                    }
                  } else {
                    locationName = data.display_name;
                  }
                } else {
                  // Fallback to coordinates
                  locationName = `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                }
              } else {
                // Fallback to coordinates
                locationName = `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
              }
            }
            
            setUserLocation(prev => prev ? { ...prev, name: locationName } : null);
            
            // Also get the Bortle scale value for this location
            const bortleScale = getBortleScaleFromDatabase(latitude, longitude);
            console.log(`Bortle scale for ${locationName}: ${bortleScale}`);
            
          } catch (error) {
            console.error("Error getting location name:", error);
            setUserLocation(prev => prev ? { 
              ...prev, 
              name: `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            } : null);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          
          let errorMessage = "";
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = t(
                "Location access was denied. Please enable location services in your browser settings.",
                "位置访问被拒绝。请在浏览器设置中启用位置服务。"
              );
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = t(
                "Location information is unavailable. Please try again later.",
                "位置信息不可用。请稍后再试。"
              );
              break;
            case error.TIMEOUT:
              errorMessage = t(
                "The request to get your location timed out. Please check your connection and try again.",
                "获取位置请求超时。请检查您的连接并重试。"
              );
              break;
            default:
              errorMessage = t(
                "An unknown error occurred while trying to get your location.",
                "尝试获取您的位置时发生未知错误。"
              );
          }
          
          setLocationError(errorMessage);
          
          toast({
            title: "Location Access Failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
      );
    } else {
      const noGeoMessage = t(
        "Geolocation is not supported by your browser. You can still enter coordinates manually.",
        "您的浏览器不支持地理定位。您仍然可以手动输入坐标。"
      );
      
      setLocationError(noGeoMessage);
      
      toast({
        title: "Geolocation Not Supported",
        description: noGeoMessage,
        variant: "destructive",
      });
    }
  }, []);
  
  return (
    <div className="min-h-screen">
      <NavBar />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">{t("Share Your Astrophotography Spot", "分享您的天文摄影地点")}</h1>
          <p className="text-muted-foreground mb-8">
            {t(
              "Help fellow astrophotographers discover amazing locations by sharing your favorite spots for stargazing and astrophotography. Your contributions will be visible to the community as recommended photo points.",
              "通过分享您喜爱的观星和天文摄影地点，帮助其他天文摄影爱好者发现精彩位置。您的贡献将作为推荐的摄影点向社区展示。"
            )}
          </p>
          
          {locationError && (
            <Card className="bg-destructive/10 border-destructive/30 p-4 mb-6">
              <div className="flex items-start gap-3">
                <MapPinOff className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-destructive mb-1">{t("Location Access Error", "位置访问错误")}</h3>
                  <p className="text-sm text-muted-foreground">{locationError}</p>
                </div>
              </div>
            </Card>
          )}
          
          {userLocation && !locationError && (
            <Card className="bg-primary/10 border-primary/30 p-4 mb-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-primary mb-1">{t("Current Location Detected", "已检测到当前位置")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {userLocation.name || `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`}
                  </p>
                </div>
              </div>
            </Card>
          )}
          
          <ShareLocationForm userLocation={userLocation} />
        </div>
      </main>
    </div>
  );
};

export default ShareLocation;
