
import React from "react";
import { Button } from "@/components/ui/button";
import { Share2, MapPin, CalendarRange, Edit, Map } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LocationQuickActionsProps {
  locationData: any;
  setShowEditDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMapViewActive: React.Dispatch<React.SetStateAction<boolean>>;
  t: any;
}

const LocationQuickActions: React.FC<LocationQuickActionsProps> = ({
  locationData,
  setShowEditDialog,
  setIsMapViewActive,
  t
}) => {
  const navigate = useNavigate();

  const handleNavigateToForecast = () => {
    if (locationData?.id) {
      navigate(`/forecast/${locationData.id}`, { state: locationData });
    }
  };

  const handleToggleMapView = () => {
    setIsMapViewActive(prev => !prev);
  };

  const handleShare = async () => {
    if (navigator.share && locationData) {
      try {
        await navigator.share({
          title: `${locationData.name} - SIQS: ${locationData?.siqsResult?.score?.toFixed(1) || 'N/A'}`,
          text: `Check out this astronomy location with SIQS score ${locationData?.siqsResult?.score?.toFixed(1) || 'N/A'}!`,
          url: window.location.href
        });
      } catch (error) {
        console.error("Error sharing location:", error);
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert(t ? t("URL copied to clipboard", "网址已复制到剪贴板") : "URL copied to clipboard");
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleMapView}
        className="flex items-center gap-1 bg-cosmic-800/40 hover:bg-cosmic-800/60"
      >
        <Map className="h-4 w-4" />
        {t ? t("Toggle Map", "切换地图") : "Toggle Map"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNavigateToForecast}
        className="flex items-center gap-1 bg-cosmic-800/40 hover:bg-cosmic-800/60"
      >
        <CalendarRange className="h-4 w-4" />
        {t ? t("Forecast", "天气预报") : "Forecast"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowEditDialog(true)}
        className="flex items-center gap-1 bg-cosmic-800/40 hover:bg-cosmic-800/60"
      >
        <Edit className="h-4 w-4" />
        {t ? t("Edit", "编辑") : "Edit"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="flex items-center gap-1 bg-cosmic-800/40 hover:bg-cosmic-800/60"
      >
        <Share2 className="h-4 w-4" />
        {t ? t("Share", "分享") : "Share"}
      </Button>
    </div>
  );
};

export default LocationQuickActions;
