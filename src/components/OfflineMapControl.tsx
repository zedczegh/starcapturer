
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Check, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface OfflineMapControlProps {
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  onDownloadComplete?: () => void;
}

const OfflineMapControl: React.FC<OfflineMapControlProps> = ({ 
  position = 'topright',
  onDownloadComplete 
}) => {
  const { t } = useLanguage();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  
  useEffect(() => {
    // Check if offline maps are already downloaded
    const checkOfflineMaps = async () => {
      try {
        // This would normally check storage or IndexedDB
        const hasOfflineMaps = localStorage.getItem('offline_maps_downloaded') === 'true';
        setIsDownloaded(hasOfflineMaps);
      } catch (error) {
        console.error("Error checking offline map status:", error);
      }
    };
    
    checkOfflineMaps();
  }, []);
  
  const handleDownloadMaps = async () => {
    if (isDownloading || isDownloaded) return;
    
    setIsDownloading(true);
    
    try {
      // Simulate download with a timeout
      toast.info(t("Downloading Offline Maps", "正在下载离线地图"), {
        description: t("This may take a few moments...", "这可能需要一点时间..."),
        duration: 5000,
      });
      
      // Simulate download completion after 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mark as downloaded in local storage
      localStorage.setItem('offline_maps_downloaded', 'true');
      setIsDownloaded(true);
      
      toast.success(t("Offline Maps Downloaded", "离线地图已下载"), {
        description: t("You can now use maps without an internet connection", "现在您可以在没有互联网连接的情况下使用地图"),
      });
      
      if (onDownloadComplete) {
        onDownloadComplete();
      }
    } catch (error) {
      console.error("Error downloading offline maps:", error);
      toast.error(t("Download Failed", "下载失败"), {
        description: t("Could not download offline maps. Please try again later.", "无法下载离线地图。请稍后再试。"),
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <div className={`leaflet-control leaflet-bar ${position}`}>
      <Button
        variant="ghost"
        size="sm"
        className={`bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background ${isDownloaded ? 'text-green-500' : 'text-primary'}`}
        onClick={handleDownloadMaps}
        disabled={isDownloading || isDownloaded}
        title={
          isDownloaded 
            ? t("Offline Maps Downloaded", "离线地图已下载") 
            : t("Download Maps for Offline Use", "下载地图供离线使用")
        }
      >
        {isDownloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isDownloaded ? (
          <Check className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default OfflineMapControl;
