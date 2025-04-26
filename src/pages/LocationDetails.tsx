import React, { useEffect, useState } from "react";
import { useParams, useLocation as useRouterLocation } from "react-router-dom";
import { RotateCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import PhotoPointsLayout from "@/components/photoPoints/PhotoPointsLayout";
import LocationDetailsContent from "@/components/location/LocationDetailsContent";
import { useLocationDetails } from "@/hooks/useLocationDetails";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { useWeatherDataIntegration } from "@/hooks/useWeatherDataIntegration";
import ClimateDataContributor from "@/components/location/ClimateDataContributor";

const LocationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { toast } = useToast();
  const routerLocation = useRouterLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { location, isLoading, error, refreshLocation } = useLocationDetails(id);

  const {
    clearSkyData,
    weatherData,
    historicalData,
    loading: weatherLoading,
    fetching: weatherFetching,
    refresh,
    isCertifiedLocation
  } = useWeatherDataIntegration(location?.latitude, location?.longitude, {
    refreshInterval: isCertifiedLocation ? 1000 * 60 * 10 : 0,
    includeHistoricalData: true
  });

  const clearSkyRate = clearSkyData?.annualRate || 0;
  const monthlyRates = clearSkyData?.monthlyRates || {};
  const clearestMonths = clearSkyData?.clearestMonths || [];

  useEffect(() => {
    if (error) {
      toast({
        title: t("Error fetching location", "获取位置错误"),
        description: t(
          "Failed to retrieve location details. Please try again.",
          "无法检索位置详细信息。请重试。"
        ),
        variant: "destructive",
      });
    }
  }, [error, t, toast]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshLocation(),
        refresh()
      ]);
      toast({
        title: t("Location Refreshed", "位置已刷新"),
        description: t(
          "The location details have been updated.",
          "位置详细信息已更新。"
        ),
      });
    } catch (err) {
      console.error("Error refreshing location:", err);
      toast({
        title: t("Refresh Failed", "刷新失败"),
        description: t(
          "Failed to refresh location details. Please try again.",
          "无法刷新位置详细信息。请重试。"
        ),
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <PhotoPointsLayout pageTitle={location?.name || t("Loading...", "加载中...")}>
      <div className="max-w-5xl mx-auto px-4 pb-10">
        <div className="pt-10 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent text-3xl md:text-4xl text-left drop-shadow tracking-tight">
              {location?.name || t("Loading...", "加载中...")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {location?.latitude}, {location?.longitude}
            </p>
          </div>

          <Button
            variant="outline"
            className="gap-2"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            {(isLoading || isRefreshing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <RotateCw className="h-4 w-4" />
            {t("Refresh", "刷新")}
          </Button>
        </div>
        
        <LocationDetailsContent
          location={location}
          clearSkyRate={clearSkyRate}
          monthlyRates={monthlyRates}
          clearestMonths={clearestMonths}
        />
        
        {location && (
          <div className="mt-8">
            <ClimateDataContributor
              latitude={location.latitude}
              longitude={location.longitude}
              locationName={location.name}
            />
          </div>
        )}
        
      </div>
    </PhotoPointsLayout>
  );
};

export default LocationDetails;
