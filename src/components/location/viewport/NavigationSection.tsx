
import React from "react";
import { Button } from "@/components/ui/button";
import { Search, RefreshCcw } from "lucide-react";
import NavigationButtons from "../navigation/NavigationButtons";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";

interface NavigationSectionProps {
  locationData: any;
  onOpenSearch: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const NavigationSection: React.FC<NavigationSectionProps> = ({
  locationData,
  onOpenSearch,
  onRefresh,
  refreshing
}) => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* Navigation app picker button */}
        {locationData?.latitude && locationData?.longitude && (
          <NavigationButtons 
            latitude={locationData.latitude}
            longitude={locationData.longitude}
            locationName={locationData?.name || ""}
          />
        )}
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex items-center gap-1 font-medium"
          onClick={onRefresh}
          disabled={refreshing}
          title={t("Refresh", "刷新")}
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className={isMobile ? "sr-only" : ""}>
            {t("Refresh", "刷新")}
          </span>
        </Button>
        <Button 
          variant="outline" 
          onClick={onOpenSearch}
          className="flex items-center gap-1 font-medium"
        >
          <Search className="h-4 w-4" />
          <span className={isMobile ? "sr-only" : ""}>
            {t("Search", "搜索")}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default NavigationSection;
