
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface LocationHeaderProps {
  name: string;
  latitude: number;
  longitude: number;
  timestamp?: number;
  loading?: boolean;
  onRefresh?: () => void;
}

const LocationHeader = ({ 
  name, 
  latitude, 
  longitude, 
  timestamp, 
  loading,
  onRefresh 
}: LocationHeaderProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleGoBack = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/");
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
      toast.info(t("Refreshing Data", "刷新数据"), {
        description: t("Fetching latest weather and conditions...", "正在获取最新天气和条件..."),
        position: "top-center",
        duration: 3000,
        icon: <RefreshCw className="h-4 w-4 animate-spin" />
      });
    }
  };

  return (
    <div className="mb-8">
      <Button 
        variant="ghost" 
        onClick={handleGoBack}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("Back", "返回")}
      </Button>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">{name || t("Unnamed Location", "未命名位置")}</h1>
        
        <div className="flex flex-wrap gap-2">
          {onRefresh && (
            <Button 
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t("Refresh", "刷新")}
            </Button>
          )}
          <Button 
            onClick={() => navigate("/share", { state: { name, latitude, longitude, timestamp } })}
            disabled={loading}
          >
            <Share2 className="mr-2 h-4 w-4" />
            {t("Share This Location", "分享此位置")}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
        <div>
          {t("Latitude", "纬度")}: {latitude}
        </div>
        <div>•</div>
        <div>
          {t("Longitude", "经度")}: {longitude}
        </div>
        <div>•</div>
        <div>
          {t("Analysis Date", "分析日期")}: {new Date(timestamp || Date.now()).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default LocationHeader;
