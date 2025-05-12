
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

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
      
      // Add SIQS validation - display a message based on the SIQS value
      if ((siqs || 0) < 5.0) {
        toast.warning(
          language === 'en' 
            ? 'Locations with low SIQS values are not recommended!' 
            : 'SIQS值较低的位置不推荐分享！',
          { 
            duration: 5000,
            description: language === 'en' 
              ? `Current SIQS: ${siqs?.toFixed(1) || '0.0'}/10.0` 
              : `当前SIQS: ${siqs?.toFixed(1) || '0.0'}/10.0`
          }
        );
      }
      
      // Share to the database
      const response = await shareAstroSpot(locationData);
      
      if (response.success) {
        // Display success message based on SIQS value
        if ((siqs || 0) >= 5.0) {
          toast.success(
            language === 'en' 
              ? 'Thanks for sharing your Astro Spot, we will show your current location to other astronomers!' 
              : '感谢分享您的观星点，我们将向其他天文爱好者展示您的当前位置！',
            { 
              description: language === 'en' 
                ? 'This location has been added to our recommendations database'
                : '此位置已添加到我们的推荐数据库中' 
            }
          );
        } else {
          toast.success(
            language === 'en' ? 'Location shared successfully!' : '位置共享成功！',
            { 
              description: language === 'en' 
                ? 'This location has been added to our database'
                : '此位置已添加到我们的数据库中' 
            }
          );
        }
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
  
  // Handle copying the current URL to clipboard
  const handleCopyLink = () => {
    const locationUrl = window.location.href;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(locationUrl)
        .then(() => {
          toast.success(t("Link copied to clipboard!", "链接已复制到剪贴板！"));
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
          // Fallback method
          try {
            const tempInput = document.createElement("input");
            tempInput.style.position = "absolute";
            tempInput.style.left = "-9999px";
            tempInput.value = locationUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand("copy");
            document.body.removeChild(tempInput);
            toast.success(t("Link copied to clipboard!", "链接已复制到剪贴板！"));
          } catch (err) {
            toast.error(t("Failed to copy link", "复制链接失败"));
          }
        });
    } else {
      // Fallback for browsers without clipboard API
      try {
        const tempInput = document.createElement("input");
        tempInput.style.position = "absolute";
        tempInput.style.left = "-9999px";
        tempInput.value = locationUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        toast.success(t("Link copied to clipboard!", "链接已复制到剪贴板！"));
      } catch (err) {
        toast.error(t("Failed to copy link", "复制链接失败"));
      }
    }
  };

  return (
    <div className="mb-8 pt-20 mt-4"> {/* Increased pt-20 for more space from navbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-center md:text-left">{name || t("Unnamed Location", "未命名位置")}</h1>
        
        <div className="flex flex-wrap gap-2 justify-center md:justify-end">
          <Button 
            onClick={handleCopyLink}
            variant="outline"
            className="z-20 relative"
          >
            <Share2 className="mr-2 h-4 w-4" />
            {t("Copy Link", "复制链接")}
          </Button>
          
          <Button 
            onClick={handleShareLocation}
            disabled={loading}
            className="z-20 relative" /* Increased z-index and added relative positioning */
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
