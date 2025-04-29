
import React from 'react';
import { Button } from "@/components/ui/button";
import { Map, Navigation, ChevronLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import GaodeMapLink from "../maps/GaodeMapLink";
import GoogleMapLink from "../maps/GoogleMapLink";

interface NavigationButtonsProps {
  latitude: number;
  longitude: number;
  compact?: boolean;
  className?: string;
  showBackButton?: boolean;
  navigationLabel?: string;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  latitude,
  longitude,
  compact = false,
  className = "",
  showBackButton = true,
  navigationLabel
}) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
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
          <GaodeMapLink
            latitude={latitude}
            longitude={longitude}
            label={navigationLabel || t("Navigate", "导航")}
            variant="secondary"
            size="sm"
            className="bg-gradient-to-r from-blue-500/20 to-green-500/20 hover:from-blue-500/30 hover:to-green-500/30"
            icon={<Navigation className="h-4 w-4 mr-1" />}
          />
        ) : (
          <GoogleMapLink
            latitude={latitude}
            longitude={longitude}
            label={navigationLabel || t("Navigate", "导航")}
            variant="secondary" 
            size="sm"
            className="bg-gradient-to-r from-blue-500/20 to-green-500/20 hover:from-blue-500/30 hover:to-green-500/30"
            icon={<Navigation className="h-4 w-4 mr-1" />}
          />
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
