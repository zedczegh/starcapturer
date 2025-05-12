
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationFaultedMessage from "../LocationFaultedMessage";

interface LocationFaultedViewProps {
  onManualRefresh: () => void;
  isRetrying: boolean;
}

const LocationFaultedView: React.FC<LocationFaultedViewProps> = ({
  onManualRefresh,
  isRetrying
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="p-4 text-center">
      <LocationFaultedMessage show />
      <Button 
        variant="outline" 
        className="mt-4"
        onClick={onManualRefresh}
        disabled={isRetrying}
      >
        {isRetrying ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            {t("Retrying...", "重试中...")}
          </>
        ) : (
          t("Retry Loading Data", "重试加载数据")
        )}
      </Button>
    </div>
  );
};

export default LocationFaultedView;
