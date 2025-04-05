
import React from "react";
import { Badge } from "@/components/ui/badge";
import LightPollutionIndicator from "@/components/location/LightPollutionIndicator";
import { formatDate } from "@/utils/formatDate";

interface LocationDataSectionProps {
  locationData: any;
  language: string;
  t: any;
  sqmValue: number | null;
}

const LocationDataSection: React.FC<LocationDataSectionProps> = ({
  locationData,
  language,
  t,
  sqmValue
}) => {
  const timestamp = locationData.timestamp ? new Date(locationData.timestamp) : new Date();
  const formattedDate = formatDate(timestamp, language);

  return (
    <div className="space-y-3">
      {/* Bortle Scale and SQM */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <LightPollutionIndicator
          bortleScale={locationData.bortleScale}
          size="lg"
          showBortleNumber={true}
        />
        
        {sqmValue && (
          <Badge variant="outline" className="bg-cosmic-800/50 text-gray-300 px-2">
            SQM: {sqmValue.toFixed(1)} mag/arcsec²
          </Badge>
        )}
      </div>
      
      {/* Date and Source */}
      <div className="text-sm text-gray-400 flex flex-col gap-1">
        <div>
          {t ? t("Added", "添加时间") : "Added"}: {formattedDate}
        </div>
        
        {locationData.fromCalculator && (
          <Badge variant="outline" className="bg-cosmic-800/20 border-cosmic-700 text-gray-300 w-fit">
            {t ? t("From Calculator", "来自计算器") : "From Calculator"}
          </Badge>
        )}
        
        {locationData.fromPhotoPoints && (
          <Badge variant="outline" className="bg-cosmic-800/20 border-cosmic-700 text-gray-300 w-fit">
            {t ? t("From Photo Points", "来自摄影点") : "From Photo Points"}
          </Badge>
        )}
        
        {locationData.isDarkSkyReserve && (
          <Badge variant="outline" className="bg-blue-900/30 border-blue-700/50 text-blue-300 w-fit">
            {t ? t("Dark Sky Reserve", "暗夜保护区") : "Dark Sky Reserve"}
          </Badge>
        )}
        
        {locationData.certification && (
          <Badge variant="outline" className="bg-indigo-900/30 border-indigo-700/50 text-indigo-300 w-fit">
            {locationData.certification}
          </Badge>
        )}
        
        {locationData.manuallyEdited && (
          <Badge variant="outline" className="bg-amber-900/30 border-amber-700/50 text-amber-300 w-fit">
            {t ? t("Manually Edited", "手动编辑") : "Manually Edited"}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default LocationDataSection;
