
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDate } from "@/utils/dateUtils";
import HourlyForecast from "./HourlyForecast";
import DailyForecast from "./DailyForecast";
import LongRangeForecast from "./LongRangeForecast";

interface ForecastTabsProps {
  forecastData: any;
  longRangeForecast: any;
  forecastLoading?: boolean;
  longRangeLoading?: boolean;
  onRefreshForecast?: () => void;
  onRefreshLongRange?: () => void;
}

const ForecastTabs: React.FC<ForecastTabsProps> = ({
  forecastData,
  longRangeForecast,
  forecastLoading = false,
  longRangeLoading = false,
  onRefreshForecast,
  onRefreshLongRange
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("hourly");

  return (
    <Card className="shadow-md overflow-hidden border-cosmic-700/30 backdrop-blur-sm">
      <CardContent className="p-0">
        <Tabs 
          defaultValue="hourly" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 rounded-none bg-cosmic-900/50 border-b border-cosmic-700/30">
            <TabsTrigger value="hourly" className="data-[state=active]:bg-cosmic-700/20">
              <Clock className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{t("Hourly", "小时")}</span>
            </TabsTrigger>
            <TabsTrigger value="daily" className="data-[state=active]:bg-cosmic-700/20">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{t("Daily", "每日")}</span>
            </TabsTrigger>
            <TabsTrigger value="longrange" className="data-[state=active]:bg-cosmic-700/20">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{t("15-Day", "15天")}</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="hourly" className="m-0 animate-in fade-in-50 duration-200">
            <HourlyForecast 
              forecastData={forecastData}
              isLoading={forecastLoading}
              onRefresh={onRefreshForecast}
            />
          </TabsContent>
          
          <TabsContent value="daily" className="m-0 animate-in fade-in-50 duration-200">
            <DailyForecast 
              forecastData={forecastData}
              isLoading={forecastLoading}
              onRefresh={onRefreshForecast}
            />
          </TabsContent>
          
          <TabsContent value="longrange" className="m-0 animate-in fade-in-50 duration-200">
            <LongRangeForecast 
              forecastData={longRangeForecast}
              isLoading={longRangeLoading}
              onRefresh={onRefreshLongRange}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ForecastTabs;
