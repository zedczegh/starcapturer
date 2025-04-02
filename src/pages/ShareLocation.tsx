
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { ExtendedGeolocationOptions, getCurrentPosition } from "@/utils/geolocationUtils";

const ShareLocation: React.FC = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  
  const onLocationChange = useCallback((lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
  }, []);

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
  }, [language, onLocationChange]);

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

    // Here you would typically send the data to your backend
    console.log({ name, description, latitude, longitude });

    // Show a success message
    toast({
      title: t("Success", "成功"),
      description: t("Location shared successfully!", "位置分享成功！"),
    });

    // Redirect to home page
    navigate('/');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t("Bortle Now", "实时光污染")}</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
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
          <Button type="button" variant="secondary" onClick={getCurrentLocation} disabled={isLoadingLocation}>
            {isLoadingLocation ? t("Loading...", "加载中...") : t("Get Current Location", "获取当前位置")}
          </Button>
          <Button type="submit">{t("Share Location", "分享位置")}</Button>
        </div>
      </form>
    </div>
  );
};

export default ShareLocation;
