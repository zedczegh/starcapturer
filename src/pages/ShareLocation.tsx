import React, { useState, useEffect } from "react";
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Loader2, CheckCircle } from "lucide-react";
import BackButton from "@/components/navigation/BackButton";

const ShareLocation: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [description, setDescription] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Get user's current location
  const getUserLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(5));
        setLongitude(position.coords.longitude.toFixed(5));
        setLocationLoading(false);
      },
      (error) => {
        setLocationError(error.message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Handle sharing the location
  const handleShareLocation = async () => {
    setShareLoading(true);
    setShareSuccess(false);

    // Simulate API call
    setTimeout(() => {
      setShareLoading(false);
      setShareSuccess(true);
      toast.success(t("Location shared successfully!", "地点分享成功！"));

      // Redirect to home page after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }, 2000);
  };

  // Page title - using Helmet for proper title handling
  const pageTitle = t("Share Location | Sky Viewer", "分享地点 | 天空观测");

  return (
    <div className="min-h-screen bg-cosmic-950 bg-[url('/src/assets/star-field-bg.jpg')] bg-cover bg-fixed bg-center bg-no-repeat">
      {/* Use Helmet component for setting page title */}
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>

      <div className="pt-20 md:pt-28 pb-20">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <div className="mb-6">
            <BackButton destination="/" />
          </div>

          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-3xl font-bold mb-3">
              {t("Share Your Location", "分享您的地点")}
            </h1>
            <p className="text-muted-foreground max-w-xl">
              {t(
                "Help others discover great stargazing spots by sharing your favorite locations.",
                "通过分享您最喜欢的地点，帮助其他人发现绝佳的观星地点。"
              )}
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {shareSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-lg font-semibold">
                  {t("Location Shared!", "地点已分享！")}
                </p>
                <p className="text-muted-foreground">
                  {t("Thank you for contributing to the community.", "感谢您为社区做出贡献。")}
                </p>
              </div>
            ) : (
              <form className="space-y-4">
                <div>
                  <Label htmlFor="locationName">{t("Location Name", "地点名称")}</Label>
                  <Input
                    type="text"
                    id="locationName"
                    placeholder={t("Enter location name", "输入地点名称")}
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="latitude">{t("Latitude", "纬度")}</Label>
                    <Label htmlFor="longitude">{t("Longitude", "经度")}</Label>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      id="latitude"
                      placeholder={t("Latitude", "纬度")}
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                    />
                    <Input
                      type="number"
                      id="longitude"
                      placeholder={t("Longitude", "经度")}
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                    />
                  </div>
                  {!latitude && !longitude && (
                    <Button
                      variant="outline"
                      className="w-full mt-2 flex items-center justify-center gap-2"
                      onClick={getUserLocation}
                      disabled={locationLoading}
                    >
                      {locationLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("Detecting Location...", "检测位置中...")}
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4" />
                          {t("Use Current Location", "使用当前位置")}
                        </>
                      )}
                    </Button>
                  )}
                  {locationError && (
                    <p className="text-red-500 text-sm mt-1">{locationError}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="description">{t("Description", "描述")}</Label>
                  <Textarea
                    id="description"
                    placeholder={t("Describe the location", "描述该地点")}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleShareLocation}
                  disabled={shareLoading}
                >
                  {shareLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t("Sharing Location...", "分享地点中...")}
                    </>
                  ) : (
                    t("Share Location", "分享地点")
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareLocation;
