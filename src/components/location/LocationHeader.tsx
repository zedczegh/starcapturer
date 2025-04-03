
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import BackButton from "@/components/navigation/BackButton";
import { shareAstroSpot } from "@/lib/api/astroSpots";

interface LocationHeaderProps {
  name: string;
  latitude: number;
  longitude: number;
  timestamp?: number;
  loading?: boolean;
  bortleScale?: number;
  siqs?: number;
}

const LocationHeader = ({ 
  name, 
  latitude, 
  longitude, 
  timestamp,
  loading,
  bortleScale,
  siqs
}: LocationHeaderProps) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  // Handle sharing location to the recommended locations database
  const handleShareLocation = async () => {
    if (loading) return;
    
    try {
      toast.info(
        language === 'en' ? 'Sharing location...' : '正在共享位置...',
        { 
          duration: 2000,
          icon: <Share2 className="h-4 w-4" />
        }
      );
      
      // Create the location data to share
      const locationData = {
        name,
        latitude,
        longitude,
        bortleScale: bortleScale || 5,
        timestamp: new Date().toISOString(),
        siqs: siqs || 0,
        isViable: (siqs || 0) >= 5.0
      };
      
      // Share to the database
      const response = await shareAstroSpot(locationData);
      
      if (response.success) {
        toast.success(
          language === 'en' ? 'Location shared successfully!' : '位置共享成功！',
          { 
            description: language === 'en' 
              ? 'This location has been added to our recommendations database'
              : '此位置已添加到我们的推荐数据库中' 
          }
        );
      } else {
        throw new Error(response.message || 'Unknown error');
      }
    } catch (error) {
      console.error("Error sharing location:", error);
      toast.error(
        language === 'en' ? 'Failed to share location' : '共享位置失败',
        { description: (error as Error).message }
      );
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-start mb-4">
        <BackButton 
          destination="/"
          className="ml-0 mr-auto" 
          variant="secondary"
          size="sm"
        />
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-center md:text-left">{name || t("Unnamed Location", "未命名位置")}</h1>
        
        <div className="flex flex-wrap gap-2 justify-center md:justify-end">
          <Button 
            onClick={handleShareLocation}
            disabled={loading}
          >
            <Share2 className="mr-2 h-4 w-4" />
            {t("Share This Location", "分享此位置")}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4 justify-center md:justify-start">
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
