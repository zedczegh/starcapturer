
import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Locate } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LocationControlButtonProps {
  gettingUserLocation: boolean;
  onClick: () => void;
}

const LocationControlButton: React.FC<LocationControlButtonProps> = ({ 
  gettingUserLocation, 
  onClick 
}) => {
  const { t } = useLanguage();

  return (
    <Button 
      variant="outline" 
      className="w-full mb-4 flex items-center justify-center gap-2 sci-fi-btn bg-cosmic-800/70 border-primary/30 text-primary-foreground hover:bg-primary/20" 
      onClick={onClick}
      disabled={gettingUserLocation}
    >
      <Locate className="h-4 w-4" />
      {gettingUserLocation 
        ? t("Retrieving location data...", "获取位置数据中...") 
        : t("Use my current location", "使用我的当前位置")}
    </Button>
  );
};

export default LocationControlButton;
