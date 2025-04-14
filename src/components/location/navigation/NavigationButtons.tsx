
import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Copy, 
  Navigation, 
  Globe, 
  Map,
  ChevronDown, 
  ChevronUp 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import CopyLocationButton from "../CopyLocationButton";
import { 
  generateGoogleMapUrl, 
  generateAppleMapUrl, 
  generateGaodeMapUrl, 
  generateBaiduMapUrl 
} from "@/utils/mapUtils";
import { toast } from "sonner";

interface NavigationButtonsProps {
  latitude: number;
  longitude: number;
  locationName: string;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({ 
  latitude, 
  longitude, 
  locationName 
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenMap = (mapType: string) => {
    let url = "";
    
    switch (mapType) {
      case "google":
        url = generateGoogleMapUrl(latitude, longitude, locationName);
        break;
      case "apple":
        url = generateAppleMapUrl(latitude, longitude, locationName);
        break;
      case "gaode":
        url = generateGaodeMapUrl(latitude, longitude, locationName);
        break;
      case "baidu":
        url = generateBaiduMapUrl(latitude, longitude, locationName);
        break;
      default:
        url = generateGoogleMapUrl(latitude, longitude, locationName);
    }

    // Open the URL in a new tab
    window.open(url, "_blank");
    
    // Show success toast
    toast.success(
      t("Map link opened", "地图链接已打开"),
      { description: t("Opening navigation in a new tab", "在新标签页中打开导航") }
    );

    // Close popover
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <CopyLocationButton 
        latitude={latitude} 
        longitude={longitude} 
        name={locationName} 
        size="icon" 
        variant="outline" 
      />

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" aria-label={t("Navigation options", "导航选项")}>
            <Navigation className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-2">
          <div className="space-y-2">
            <h3 className="font-medium text-sm mb-2">
              {t("Open with map app", "使用地图应用打开")}
            </h3>
            
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                className="justify-start"
                onClick={() => handleOpenMap("google")}
              >
                <Globe className="mr-2 h-4 w-4" />
                {t("Google Maps", "Google 地图")}
              </Button>
              
              <Button 
                variant="secondary" 
                size="sm" 
                className="justify-start"
                onClick={() => handleOpenMap("apple")}
              >
                <Map className="mr-2 h-4 w-4" />
                {t("Apple Maps", "Apple 地图")}
              </Button>

              <Button 
                variant="secondary" 
                size="sm" 
                className="justify-start"
                onClick={() => handleOpenMap("gaode")}
              >
                <Navigation className="mr-2 h-4 w-4" />
                {t("Gaode Maps", "高德地图")}
              </Button>

              <Button 
                variant="secondary" 
                size="sm" 
                className="justify-start"
                onClick={() => handleOpenMap("baidu")}
              >
                <Map className="mr-2 h-4 w-4" />
                {t("Baidu Maps", "百度地图")}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default NavigationButtons;
