
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { 
  Cloud, 
  CloudDrizzle, 
  CloudFog, 
  CloudRain, 
  CloudLightning, 
  CloudSnow,
  Moon, 
  MoonStar, 
  Star, 
  Sun, 
  Umbrella,
  Thermometer 
} from "lucide-react";

interface ForecastItem {
  time: string;
  temperature: number;
  cloudCover: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  condition: string;
  seeingCondition: string;
}

interface ForecastTableProps {
  forecastData: ForecastItem[] | null;
  isLoading?: boolean;
}

const ForecastTable: React.FC<ForecastTableProps> = ({ forecastData, isLoading = false }) => {
  const getWeatherIcon = (condition: string, time: string) => {
    const hour = new Date(time).getHours();
    const isNight = hour < 6 || hour > 18;
    
    switch (condition.toLowerCase()) {
      case "clear":
        return isNight ? <MoonStar className="h-5 w-5 text-indigo-300" /> : <Sun className="h-5 w-5 text-yellow-400" />;
      case "partly cloudy":
        return isNight ? <Moon className="h-5 w-5 text-gray-300" /> : <Cloud className="h-5 w-5 text-gray-400" />;
      case "cloudy":
        return <Cloud className="h-5 w-5 text-gray-500" />;
      case "overcast":
        return <Cloud className="h-5 w-5 text-gray-600" />;
      case "rain":
        return <CloudRain className="h-5 w-5 text-blue-400" />;
      case "drizzle":
        return <CloudDrizzle className="h-5 w-5 text-blue-300" />;
      case "thunderstorm":
        return <CloudLightning className="h-5 w-5 text-purple-400" />;
      case "snow":
        return <CloudSnow className="h-5 w-5 text-blue-200" />;
      case "fog":
        return <CloudFog className="h-5 w-5 text-gray-400" />;
      default:
        return <Sun className="h-5 w-5 text-yellow-400" />;
    }
  };

  const getSeeingConditionIcon = (condition: string) => {
    switch (condition) {
      case "Excellent":
        return <Star className="h-4 w-4 text-green-500" />;
      case "Good":
        return <Star className="h-4 w-4 text-emerald-400" />;
      case "Average":
        return <Star className="h-4 w-4 text-yellow-500" />;
      case "Poor":
        return <Star className="h-4 w-4 text-orange-500" />;
      case "Very Poor":
        return <Star className="h-4 w-4 text-red-500" />;
      default:
        return <Star className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSeeingConditionColor = (condition: string) => {
    switch (condition) {
      case "Excellent": return "text-green-500 font-medium";
      case "Good": return "text-emerald-400 font-medium";
      case "Average": return "text-yellow-500 font-medium";
      case "Poor": return "text-orange-500 font-medium";
      case "Very Poor": return "text-red-500 font-medium";
      default: return "text-gray-400";
    }
  };
  
  const getCloudCoverClass = (cloudCover: number) => {
    if (cloudCover < 10) return "text-green-500";
    if (cloudCover < 30) return "text-emerald-400";
    if (cloudCover < 60) return "text-yellow-500";
    if (cloudCover < 80) return "text-orange-500";
    return "text-red-500";
  };

  const getTimeClass = (time: string) => {
    const hour = new Date(time).getHours();
    const isNight = hour < 6 || hour > 18;
    return isNight ? "bg-indigo-950/30" : "";
  };

  if (isLoading) {
    return (
      <Card className="border-cosmic-600/20 bg-cosmic-800/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <Cloud className="h-5 w-5 text-cosmic-100" />
            24-Hour Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecastData || forecastData.length === 0) {
    return (
      <Card className="border-cosmic-600/20 bg-cosmic-800/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <Cloud className="h-5 w-5 text-cosmic-100" />
            24-Hour Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No forecast data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-cosmic-600/20 bg-cosmic-800/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Cloud className="h-5 w-5 text-cosmic-100" />
          24-Hour Forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px]">Time</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Cloud className="h-4 w-4 text-cosmic-100" />
                    <span>Cloud Cover</span>
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Star className="h-4 w-4 text-cosmic-100" />
                    <span>Seeing</span>
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Thermometer className="h-4 w-4 text-cosmic-100" />
                    <span>Temp</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forecastData.map((item, index) => (
                <TableRow 
                  key={index} 
                  className={`${index % 2 === 0 ? "bg-muted/20" : ""} ${getTimeClass(item.time)} transition-colors`}
                >
                  <TableCell className="font-medium">
                    {format(parseISO(item.time), "h:mm a")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getWeatherIcon(item.condition, item.time)}
                      <span className="capitalize">{item.condition}</span>
                    </div>
                  </TableCell>
                  <TableCell className={`text-right ${getCloudCoverClass(item.cloudCover)}`}>
                    {item.cloudCover}%
                  </TableCell>
                  <TableCell className={`text-right ${getSeeingConditionColor(item.seeingCondition)}`}>
                    <div className="flex items-center justify-end gap-1">
                      {getSeeingConditionIcon(item.seeingCondition)}
                      <span>{item.seeingCondition}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {item.temperature}°C
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-cosmic-600/20 bg-muted/10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-green-500" />
              <span>Excellent</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-emerald-400" />
              <span>Good</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span>Average</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-orange-500" />
              <span>Poor</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-red-500" />
              <span>Very Poor</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <Star className="h-3 w-3 inline-block mr-1 text-yellow-400" />
            Seeing conditions affect image stability and detail visibility when stargazing
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastTable;
