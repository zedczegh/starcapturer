
import React from 'react';
import { Button } from "@/components/ui/button";
import { Map, Navigation, ChevronLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavigationButtonsProps {
  latitude: number;
  longitude: number;
  compact?: boolean;
  className?: string;
  showBackButton?: boolean;
  navigationLabel?: string;
  name?: string; // Add name property to the props interface
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  latitude,
  longitude,
  compact = false,
  className = "",
  showBackButton = true,
  navigationLabel,
  name
}) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const openGaodeMap = () => {
    const gaodeUrl = `https://uri.amap.com/navigation?to=${longitude},${latitude},${name || ''}&mode=car&src=lovableapp`;
    window.open(gaodeUrl, '_blank');
  };
  
  const openGoogleMap = () => {
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(googleUrl, '_blank');
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {showBackButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("Back", "返回")}
        </Button>
      )}

      <div className="flex gap-2 ml-auto">
        {/* Primary navigation buttons */}
        {language === "zh" ? (
          <Button
            onClick={openGaodeMap}
            variant="secondary"
            size="sm"
            className="bg-gradient-to-r from-blue-500/20 to-green-500/20 hover:from-blue-500/30 hover:to-green-500/30"
          >
            <Navigation className="h-4 w-4 mr-1" />
            {navigationLabel || t("Navigate", "导航")}
          </Button>
        ) : (
          <Button
            onClick={openGoogleMap}
            variant="secondary" 
            size="sm"
            className="bg-gradient-to-r from-blue-500/20 to-green-500/20 hover:from-blue-500/30 hover:to-green-500/30"
          >
            <Navigation className="h-4 w-4 mr-1" />
            {navigationLabel || t("Navigate", "导航")}
          </Button>
        )}

        {!compact && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigate("/map", { 
                state: { 
                  latitude, 
                  longitude 
                } 
              });
            }}
          >
            <Map className="h-4 w-4 mr-1" />
            {t("Show On Map", "在地图上显示")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default NavigationButtons;
