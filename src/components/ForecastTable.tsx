
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { Cloud, CloudDrizzle, CloudFog, CloudRain, Moon, MoonStar, Star, Sun } from "lucide-react";

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
        return isNight ? <MoonStar className="h-4 w-4 text-indigo-300" /> : <Sun className="h-4 w-4 text-yellow-400" />;
      case "partly cloudy":
        return isNight ? <Moon className="h-4 w-4 text-gray-300" /> : <Cloud className="h-4 w-4 text-gray-400" />;
      case "cloudy":
        return <Cloud className="h-4 w-4 text-gray-500" />;
      case "overcast":
        return <Cloud className="h-4 w-4 text-gray-600" />;
      case "rain":
        return <CloudRain className="h-4 w-4 text-blue-400" />;
      case "drizzle":
        return <CloudDrizzle className="h-4 w-4 text-blue-300" />;
      default:
        return <Sun className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getSeeingConditionColor = (condition: string) => {
    switch (condition) {
      case "Excellent": return "text-green-500";
      case "Good": return "text-emerald-400";
      case "Average": return "text-yellow-500";
      case "Poor": return "text-orange-500";
      case "Very Poor": return "text-red-500";
      default: return "text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">24-Hour Forecast</CardTitle>
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">24-Hour Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No forecast data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">24-Hour Forecast</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Time</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead className="text-right">Cloud Cover</TableHead>
                <TableHead className="text-right">Seeing</TableHead>
                <TableHead className="text-right">Temp (°C)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forecastData.map((item, index) => (
                <TableRow key={index} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                  <TableCell className="font-medium">
                    {format(parseISO(item.time), "h:mm a")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getWeatherIcon(item.condition, item.time)}
                      <span className="capitalize">{item.condition}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.cloudCover}%</TableCell>
                  <TableCell className={`text-right ${getSeeingConditionColor(item.seeingCondition)}`}>
                    {item.seeingCondition}
                  </TableCell>
                  <TableCell className="text-right">{item.temperature}°</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t">
          <p className="text-xs text-muted-foreground">
            <Star className="h-3 w-3 inline-block mr-1 text-yellow-400" />
            Seeing conditions affect image stability and detail visibility
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastTable;
