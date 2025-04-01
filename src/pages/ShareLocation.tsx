import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import { MapPin, Loader2 } from "lucide-react";

interface ShareLocationProps {
  // No props needed for this component
}

const ShareLocation = () => {
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [placeDetails, setPlaceDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { getPosition, loading: geoLoading } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate inputs
    if (!locationName || !latitude || !longitude) {
      toast.error(t("Please fill in all fields.", "请填写所有字段。"));
      setIsSubmitting(false);
      return;
    }

    // Validate latitude and longitude
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      toast.error(t("Invalid latitude or longitude.", "无效的纬度或经度。"));
      setIsSubmitting(false);
      return;
    }

    // Here you would typically send the data to your backend
    const locationData = {
      name: locationName,
      latitude: lat,
      longitude: lng,
      placeDetails: placeDetails,
    };

    console.log("Submitting location data:", locationData);

    // Simulate a successful submission
    setTimeout(() => {
      toast.success(t("Location shared successfully!", "位置分享成功！"));
      setIsSubmitting(false);
      navigate('/'); // Redirect to home or another appropriate route
    }, 1500);
  };

  const handleUseCurrentLocation = async () => {
    try {
      await getPosition();
      toast.success(t("Location acquired!", "获取位置成功！"));
    } catch (error: any) {
      toast.error(t("Failed to get location: ", "获取位置失败：") + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-cosmic-950 bg-[url('/src/assets/star-field-bg.jpg')] bg-cover bg-fixed bg-center bg-no-repeat">
      <div className="container mx-auto px-4 py-24">
        <Card className="max-w-md mx-auto bg-cosmic-900/70 border border-cosmic-700/50 text-white shadow-lg">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="locationName">{t("Location Name", "位置名称")}</Label>
                <Input
                  id="locationName"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder={t("e.g., Milky Way Point", "例如，银河点")}
                  className="bg-cosmic-800/30 border-cosmic-700/40"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="latitude">{t("Latitude", "纬度")}</Label>
                <Input
                  id="latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g., 40.7128"
                  className="bg-cosmic-800/30 border-cosmic-700/40"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="longitude">{t("Longitude", "经度")}</Label>
                <Input
                  id="longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g., -74.0060"
                  className="bg-cosmic-800/30 border-cosmic-700/40"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="placeDetails">{t("Place Details", "地点详情")}</Label>
                <Textarea
                  id="placeDetails"
                  value={placeDetails}
                  onChange={(e) => setPlaceDetails(e.target.value)}
                  placeholder={t("Describe the location (optional)", "描述位置（可选）")}
                  className="bg-cosmic-800/30 border-cosmic-700/40 resize-none"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <Button
                type="button"
                variant="secondary"
                onClick={handleUseCurrentLocation}
                disabled={geoLoading || isSubmitting}
                className="bg-cosmic-800 hover:bg-cosmic-700 border border-cosmic-600/30"
              >
                {geoLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("Getting Location", "获取位置")}
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    {t("Use My Location", "使用我的位置")}
                  </>
                )}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-white hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("Submitting...", "提交中...")}
                  </>
                ) : (
                  t("Share Location", "分享位置")
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ShareLocation;
