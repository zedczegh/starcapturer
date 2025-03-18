
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LocationDetailsHeaderProps {
  name?: string;
  timestamp?: string;
  onRefresh?: () => void;
  loading?: boolean;
  className?: string;
}

const LocationDetailsHeader: React.FC<LocationDetailsHeaderProps> = ({ 
  name, 
  timestamp, 
  onRefresh, 
  loading,
  className
}) => {
  const { t } = useLanguage();
  
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex flex-col items-center justify-between">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center justify-center mb-2">
            <Sparkles className="h-6 w-6 mr-2 text-primary" /> 
            {name || t("Location Details", "位置详情")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t(
              "View detailed analysis and forecasts for astrophotography at this location.",
              "查看此地点的天文摄影详细分析和预报。"
            )}
          </p>
        </div>
        
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh} 
            disabled={loading}
            className="flex items-center gap-2 mt-4"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t("Refresh", "刷新")}
          </Button>
        )}
      </div>
      
      {timestamp && (
        <p className="text-sm text-muted-foreground mt-3 text-center">
          {t("Last updated", "最后更新")}: {new Date(timestamp).toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default LocationDetailsHeader;
