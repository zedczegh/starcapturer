
import React, { useEffect, useState } from "react";
import { useParams, useLocation as useRouterLocation } from "react-router-dom";
import { RotateCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import PhotoPointsLayout from "@/components/photoPoints/PhotoPointsLayout";
import LocationDetailsContent from "@/components/location/LocationDetailsContent";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { useWeatherDataIntegration } from "@/hooks/useWeatherDataIntegration";
import ClimateDataContributor from "@/components/location/ClimateDataContributor";

// Create a hook for location data since useLocationDetails doesn't exist
const useLocationDetails = (id: string | undefined) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchLocationData = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }
      
      try {
        // For now we'll simulate fetching location data
        // In a real app, this would make an API call
        setTimeout(() => {
          // Parse location ID to get coordinates
          // Format: loc-latitude-longitude
          if (id.startsWith('loc-')) {
            const parts = id.split('-');
            if (parts.length >= 3) {
              const latitude = parseFloat(parts[1]);
              const longitude = parseFloat(parts[2]);
              
              setData({
                id,
                name: `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                latitude,
                longitude
              });
            }
          }
          setIsLoading(false);
        }, 500);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      }
    };
    
    fetchLocationData();
  }, [id]);
  
  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    // Implement actual refresh logic here
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };
  
  return { data, isLoading, error, refetch };
};

const LocationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { toast } = useToast();
  const routerLocation = useRouterLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locationData, setLocationData] = useState<any>(null);

  // Use location data hook
  const { data: location, isLoading, error, refetch: refreshLocation } = useLocationDetails(id);

  // Define isCertifiedLocation first to fix the error
  const isCertifiedLocation = locationData?.certification || locationData?.isDarkSkyReserve;

  const {
    clearSkyData,
    weatherData,
    historicalData,
    loading: weatherLoading,
    fetching: weatherFetching,
    refresh,
  } = useWeatherDataIntegration(locationData?.latitude, locationData?.longitude, {
    refreshInterval: isCertifiedLocation ? 1000 * 60 * 10 : 0,
    includeHistoricalData: true
  });

  // Update local state when location data is received
  useEffect(() => {
    if (location && !isLoading) {
      setLocationData(location);
    }
  }, [location, isLoading]);

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
    <PhotoPointsLayout pageTitle={locationData?.name || t("Loading...", "加载中...")}>
      <div className="max-w-5xl mx-auto px-4 pb-10">
        <div className="pt-10 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent text-3xl md:text-4xl text-left drop-shadow tracking-tight">
              {locationData?.name || t("Loading...", "加载中...")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {locationData?.latitude}, {locationData?.longitude}
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
          locationData={locationData}
          setLocationData={setLocationData}
          onLocationUpdate={async () => {}}
          clearSkyRate={clearSkyRate}
          monthlyRates={monthlyRates}
          clearestMonths={clearestMonths}
        />
        
        {locationData && (
          <div className="mt-8">
            <ClimateDataContributor
              latitude={locationData.latitude}
              longitude={locationData.longitude}
              locationName={locationData.name}
            />
          </div>
        )}
        
      </div>
    </PhotoPointsLayout>
  );
};

export default LocationDetails;
