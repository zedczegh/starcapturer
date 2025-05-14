
import React from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import PhotoLocationCard from "./PhotoLocationCard";
import { useLanguage } from "@/contexts/LanguageContext";

interface DarkSkyLocationsProps {
  locations: SharedAstroSpot[];
  loading?: boolean;
  onClick?: (location: SharedAstroSpot) => void;
}

const DarkSkyLocations: React.FC<DarkSkyLocationsProps> = ({
  locations,
  loading = false,
  onClick
}) => {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <span className="loading loading-spinner"></span>
      </div>
    );
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-medium">
          {t("No Dark Sky Locations", "没有暗夜保护区")}
        </h3>
        <p className="text-muted-foreground mt-2">
          {t(
            "No certified dark sky locations found in this region.",
            "在此区域未找到认证的暗夜保护区。"
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {locations.map((location) => (
        <PhotoLocationCard
          key={location.id || `${location.latitude}-${location.longitude}`}
          location={location}
          onClick={() => onClick && onClick(location)}
        />
      ))}
    </div>
  );
};

export default DarkSkyLocations;
