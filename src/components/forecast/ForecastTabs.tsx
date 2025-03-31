
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Cloud, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/dateUtils";
import HourlyForecast from "./HourlyForecast";
import DailyForecast from "./DailyForecast";
import LongRangeForecast from "./LongRangeForecast";

interface ForecastTabsProps {
  forecastData: any;
  longRangeForecast: any;
  isLoading: boolean;
  onRefreshForecast: () => void;
  onRefreshLongRange: () => void;
}

const ForecastTabs: React.FC<ForecastTabsProps> = ({
  forecastData,
  longRangeForecast,
  isLoading,
  onRefreshForecast,
  onRefreshLongRange
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("hourly");
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Refresh long range data when switching to that tab
    if (value === "longRange" && !longRangeForecast) {
      onRefreshLongRange();
    }
  };
  
  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            {t("Loading forecast data...", "正在加载天气预报...")}
          </p>
        </div>
      </div>
    );
  }
  
  if (!forecastData?.hourly) {
    return (
      <div className="h-[200px] flex items-center justify-center">
        <div className="text-center">
          <Cloud className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-2 mb-4">
            {t("No forecast data available", "没有可用的天气预报数据")}
          </p>
          <Button onClick={onRefreshForecast} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("Refresh Forecast", "刷新天气预报")}
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <Tabs 
      value={activeTab} 
      onValueChange={handleTabChange}
      className="w-full"
    >
      <div className="flex justify-between items-center mb-3">
        <TabsList>
          <TabsTrigger value="hourly">
            {t("Hourly", "每小时")}
          </TabsTrigger>
          <TabsTrigger value="daily">
            {t("Daily", "每天")}
          </TabsTrigger>
          <TabsTrigger value="longRange">
            {t("Long Range", "长期")}
          </TabsTrigger>
        </TabsList>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={activeTab === "longRange" ? onRefreshLongRange : onRefreshForecast}
          className="h-8 px-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      <TabsContent value="hourly" className="mt-0">
        <HourlyForecast 
          hourlyData={forecastData.hourly}
          currentTime={forecastData.current_time || new Date().toISOString()}
        />
      </TabsContent>
      
      <TabsContent value="daily" className="mt-0">
        <DailyForecast 
          dailyData={forecastData.daily || []}
          currentDate={formatDate(new Date())}
        />
      </TabsContent>
      
      <TabsContent value="longRange" className="mt-0">
        <LongRangeForecast 
          longRangeData={longRangeForecast || {}}
          isLoading={!longRangeForecast && activeTab === "longRange"}
          onRefresh={onRefreshLongRange}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ForecastTabs;
