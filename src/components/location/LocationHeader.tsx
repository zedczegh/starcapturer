
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Share, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";

interface LocationHeaderProps {
  locationData: any;
  onShareLocation: () => void;
}

const LocationHeader: React.FC<LocationHeaderProps> = ({
  locationData,
  onShareLocation
}) => {
  const { t, language } = useLanguage();
  
  if (!locationData) return null;
  
  const timeAgo = locationData.timestamp 
    ? formatDistanceToNow(new Date(locationData.timestamp), { 
        addSuffix: true,
        locale: language === 'zh' ? zhCN : enUS
      })
    : '';
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
      <div className="mb-4 md:mb-0">
        <div className="flex items-center">
          <MapPin className="h-5 w-5 text-primary mr-2" />
          <h1 className="text-2xl font-bold">{locationData.name}</h1>
        </div>
        <div className="flex items-center mt-1.5 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 mr-1.5" />
          <span>
            {t("Updated", "更新于")} {timeAgo}
          </span>
        </div>
      </div>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={onShareLocation}
        className="flex items-center gap-2"
      >
        <Share className="h-4 w-4" />
        <span>{t("Share", "分享")}</span>
      </Button>
    </div>
  );
};

export default LocationHeader;
