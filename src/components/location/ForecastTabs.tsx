
import React, { useCallback, useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarRange, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import ForecastTable from "@/components/ForecastTable";
import LongRangeForecast from "@/components/LongRangeForecast";
import { useIsMobile } from "@/hooks/use-mobile";

interface ForecastTabsProps {
  forecastData: any;
  longRangeForecast: any;
  forecastLoading: boolean;
  longRangeLoading: boolean;
  onRefreshForecast: () => void;
  onRefreshLongRange: () => void;
}

const ForecastTabs: React.FC<ForecastTabsProps> = ({
  forecastData,
  longRangeForecast,
  forecastLoading,
  longRangeLoading,
  onRefreshForecast,
  onRefreshLongRange
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("hourly");
  
  // Memoize tab labels to prevent unnecessary re-renders
  const tabLabels = useMemo(() => ({
    hourly: isMobile ? t("Hourly", "小时") : t("Hourly Forecast", "小时预报"),
    extended: isMobile ? t("15-Day", "15天") : t("15-Day Forecast", "15天预报")
  }), [isMobile, t]);
  
  const handleRefreshForecast = useCallback(() => {
    onRefreshForecast();
  }, [onRefreshForecast]);
  
  const handleRefreshLongRange = useCallback(() => {
    onRefreshLongRange();
  }, [onRefreshLongRange]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);
  
  // Only respond to device size changes
  useEffect(() => {
    setActiveTab(activeTab);
  }, [isMobile, activeTab]);
  
  return (
    <Tabs 
      defaultValue="hourly" 
      value={activeTab}
      onValueChange={handleTabChange}
      className="w-full"
    >
      <TabsList className={`grid grid-cols-2 mb-4 bg-cosmic-800/60 border border-cosmic-700/40 ${isMobile ? 'w-full' : ''}`}>
        <TabsTrigger 
          value="hourly" 
          className="flex items-center gap-2 data-[state=active]:bg-primary/20"
        >
          <Calendar className="h-4 w-4" />
          {tabLabels.hourly}
        </TabsTrigger>
        <TabsTrigger 
          value="extended" 
          className="flex items-center gap-2 data-[state=active]:bg-primary/20"
        >
          <CalendarRange className="h-4 w-4" />
          {tabLabels.extended}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="hourly" className="mt-0 animate-none">
        <ForecastTable 
          forecastData={forecastData}
          isLoading={forecastLoading}
          onRefresh={handleRefreshForecast}
        />
      </TabsContent>
      
      <TabsContent value="extended" className="mt-0 animate-none">
        <LongRangeForecast
          forecastData={longRangeForecast}
          isLoading={longRangeLoading}
          onRefresh={handleRefreshLongRange}
        />
      </TabsContent>
    </Tabs>
  );
};

export default React.memo(ForecastTabs);
