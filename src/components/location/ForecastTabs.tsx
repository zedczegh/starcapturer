
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarRange, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import ForecastTable from "@/components/ForecastTable";
import LongRangeForecast from "@/components/LongRangeForecast";

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
  
  return (
    <Tabs defaultValue="hourly" className="w-full">
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="hourly" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {t("Hourly Forecast", "小时预报")}
        </TabsTrigger>
        <TabsTrigger value="extended" className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4" />
          {t("15-Day Forecast", "15天预报")}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="hourly" className="mt-0">
        <ForecastTable 
          forecastData={forecastData}
          isLoading={forecastLoading}
          onRefresh={onRefreshForecast}
        />
      </TabsContent>
      
      <TabsContent value="extended" className="mt-0">
        <LongRangeForecast
          forecastData={longRangeForecast}
          isLoading={longRangeLoading}
          onRefresh={onRefreshLongRange}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ForecastTabs;
