
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "../ui/button";
import { MapPin } from "lucide-react";

interface EmptyRecommendationsProps {
  userLocation: { latitude: number; longitude: number } | null;
  hideEmptyMessage?: boolean;
}

const EmptyRecommendations: React.FC<EmptyRecommendationsProps> = ({
  userLocation,
  hideEmptyMessage = false
}) => {
  const { t } = useLanguage();
  
  if (hideEmptyMessage) {
    return null;
  }
  
  return (
    <div className="mt-2 text-center py-6">
      <p className="text-sm text-muted-foreground">
        {t(
          "No recommended photo points found nearby.",
          "在附近找不到推荐的摄影点。"
        )}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {t(
          "Try expanding your search radius.",
          "尝试扩大您的搜索半径。"
        )}
      </p>
      
      {userLocation && (
        <Button 
          variant="outline" 
          size="sm"
          className="mt-4 bg-gradient-to-r from-blue-500/20 to-green-500/20 hover:from-blue-500/30 hover:to-green-500/30"
          onClick={() => {
            // Trigger event to find more locations
            document.dispatchEvent(
              new CustomEvent('expand-search-radius', { detail: { radius: 1000 } })
            );
          }}
        >
          <MapPin className="h-3.5 w-3.5 mr-1.5" />
          {t("Expand Search", "扩大搜索")}
        </Button>
      )}
    </div>
  );
};

export default EmptyRecommendations;
