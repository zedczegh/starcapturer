
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { WifiOff, Download, Map, Trash } from "lucide-react";
import offlineMapService from "@/services/OfflineMapService";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OfflineMapControlProps {
  mapRef?: React.RefObject<L.Map>;
}

const OfflineMapControl: React.FC<OfflineMapControlProps> = ({ mapRef }) => {
  const { t } = useLanguage();
  const [isOfflineMode, setIsOfflineMode] = useState(offlineMapService.isInOfflineMode());
  const [cacheSize, setCacheSize] = useState(offlineMapService.getCacheSize());
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [selectedZoomLevel, setSelectedZoomLevel] = useState("12");
  const [savedRegions, setSavedRegions] = useState(offlineMapService.getSavedRegions());
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Update cache size periodically
    const intervalId = setInterval(() => {
      setCacheSize(offlineMapService.getCacheSize());
      setSavedRegions(offlineMapService.getSavedRegions());
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const handleToggleOfflineMode = () => {
    const newMode = offlineMapService.toggleOfflineMode();
    setIsOfflineMode(newMode);

    if (newMode) {
      toast.success(t("Offline Mode Enabled", "离线模式已启用"), {
        description: t(
          "Using cached map tiles. Some areas may not be available if not downloaded.",
          "使用缓存的地图瓦片。如果未下载，某些区域可能不可用。"
        ),
      });
    } else {
      toast.success(t("Online Mode Enabled", "在线模式已启用"), {
        description: t("Using live map data from servers.", "使用服务器的实时地图数据。"),
      });
    }

    // Force map refresh if we have a reference to it
    if (mapRef?.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  };

  const handleDownloadCurrentView = () => {
    if (!mapRef?.current) {
      toast.error(t("Map Not Available", "地图不可用"), {
        description: t("Cannot access the map view.", "无法访问地图视图。"),
      });
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(10);

    try {
      const bounds = mapRef.current.getBounds();
      const zoom = mapRef.current.getZoom();
      const minZoom = Math.max(zoom - 2, 0);
      const maxZoom = Math.min(zoom + parseInt(selectedZoomLevel) - zoom, 18);

      // Simulate progress
      let progress = 10;
      const progressInterval = setInterval(() => {
        progress += 5;
        if (progress >= 95) {
          clearInterval(progressInterval);
        }
        setDownloadProgress(progress);
      }, 300);

      // Save the region
      offlineMapService.saveRegionForOffline(bounds, minZoom, maxZoom);

      // Complete the download after a delay
      setTimeout(() => {
        clearInterval(progressInterval);
        setDownloadProgress(100);
        
        toast.success(t("Area Downloaded", "区域已下载"), {
          description: t(
            "Map data for this area has been saved for offline use.",
            "该区域的地图数据已保存以供离线使用。"
          ),
        });
        
        setTimeout(() => {
          setIsDownloading(false);
          setDownloadProgress(0);
          setCacheSize(offlineMapService.getCacheSize());
          setSavedRegions(offlineMapService.getSavedRegions());
          setShowDialog(false);
        }, 1000);
      }, 4000);
    } catch (error) {
      console.error("Error downloading map area:", error);
      toast.error(t("Download Failed", "下载失败"), {
        description: t(
          "Failed to download map data. Please try again.",
          "下载地图数据失败。请重试。"
        ),
      });
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleClearCache = () => {
    offlineMapService.clearOfflineCache();
    setCacheSize(0);
    setSavedRegions([]);
    toast.success(t("Cache Cleared", "缓存已清除"), {
      description: t(
        "All offline map data has been removed.",
        "所有离线地图数据已被删除。"
      ),
    });
    setShowDialog(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={`rounded-full p-2 ${isOfflineMode ? 'bg-primary text-primary-foreground' : ''}`}
        onClick={handleToggleOfflineMode}
        title={t("Toggle Offline Mode", "切换离线模式")}
      >
        <WifiOff className="h-4 w-4" />
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full p-2 ml-2"
            title={t("Download Map Area", "下载地图区域")}
          >
            <Download className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("Download Map Area", "下载地图区域")}</DialogTitle>
            <DialogDescription>
              {t(
                "Download the current map view for offline use.",
                "下载当前地图视图以供离线使用。"
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isDownloading ? (
              <div className="space-y-2">
                <p className="text-sm">{t("Downloading...", "正在下载...")}</p>
                <Progress value={downloadProgress} className="w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("Zoom Level Detail", "缩放级别详细程度")}
                  </label>
                  <Select
                    value={selectedZoomLevel}
                    onValueChange={setSelectedZoomLevel}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("Select zoom level", "选择缩放级别")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">{t("Low - Faster download", "低 - 更快下载")}</SelectItem>
                      <SelectItem value="12">{t("Medium - Balanced", "中 - 平衡")}</SelectItem>
                      <SelectItem value="14">{t("High - Larger download", "高 - 更大下载")}</SelectItem>
                      <SelectItem value="16">{t("Very High - Much larger download", "很高 - 更大下载量")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">{t("Current Cache Size", "当前缓存大小")}</label>
                    <span className="text-sm">{cacheSize.toFixed(2)} MB</span>
                  </div>
                </div>

                {savedRegions.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("Saved Regions", "已保存区域")}</label>
                    <div className="text-sm text-muted-foreground">
                      {t("Number of regions", "区域数量")}: {savedRegions.length}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            {!isDownloading && (
              <>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  {t("Cancel", "取消")}
                </Button>
                <Button variant="destructive" onClick={handleClearCache} disabled={cacheSize === 0}>
                  <Trash className="h-4 w-4 mr-2" />
                  {t("Clear Cache", "清除缓存")}
                </Button>
                <Button onClick={handleDownloadCurrentView}>
                  <Map className="h-4 w-4 mr-2" />
                  {t("Download Current View", "下载当前视图")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OfflineMapControl;
