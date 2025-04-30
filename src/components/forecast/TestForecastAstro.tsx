
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { enhancedForecastAstroService } from '@/services/forecast/enhancedForecastAstroService';
import { Loader, RefreshCw, Calendar, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ForecastApiHealth from './ForecastApiHealth';

export default function TestForecastAstro() {
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(5); // Default to day 5
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [bestDays, setBestDays] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // NYC coordinates for demo
  const latitude = 40.7128;
  const longitude = -74.006;
  
  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all forecast days
      const allDays = await enhancedForecastAstroService.getFullForecastAstroData(
        latitude,
        longitude,
        4 // Bortle scale
      );
      
      setForecastData(allDays);
      
      // Get best days for astronomy
      const bestAstroDays = await enhancedForecastAstroService.getBestAstroDays(
        latitude,
        longitude,
        4, // Bortle scale
        5  // Min quality threshold
      );
      
      setBestDays(bestAstroDays);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching forecast data:", err);
      setError("Failed to load forecast data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchForecast();
  }, []);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const renderSiqsScore = (score: number | null) => {
    if (score === null) return 'N/A';
    return score.toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Forecast for New York City
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : (
              <Tabs defaultValue="allDays">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="allDays">All Days</TabsTrigger>
                  <TabsTrigger value="bestDays">Best Days</TabsTrigger>
                </TabsList>
                
                <TabsContent value="allDays" className="space-y-4 mt-4">
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {forecastData.slice(0, 8).map((day, index) => (
                      <Button
                        key={index}
                        variant={selectedDay === index ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDay(index)}
                        className="text-xs"
                      >
                        Day {index + 1}
                      </Button>
                    ))}
                  </div>
                  <div className="space-y-4">
                    {forecastData.length > 0 && selectedDay < forecastData.length ? (
                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          {formatDate(forecastData[selectedDay].date)}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">SIQS Score:</span>
                              <span className="font-medium">
                                {renderSiqsScore(forecastData[selectedDay].siqs)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Viable:</span>
                              <span className="font-medium">
                                {forecastData[selectedDay].isViable ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Reliability:</span>
                              <span className="font-medium">
                                {forecastData[selectedDay].reliability ? 
                                  `${Math.round(forecastData[selectedDay].reliability * 100)}%` : 
                                  'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Cloud Cover:</span>
                              <span className="font-medium">{forecastData[selectedDay].cloudCover}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Temperature:</span>
                              <span className="font-medium">
                                {forecastData[selectedDay].temperature.min}°C - {forecastData[selectedDay].temperature.max}°C
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Precipitation:</span>
                              <span className="font-medium">
                                {forecastData[selectedDay].precipitation.probability}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">No forecast data available</div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="bestDays" className="mt-4">
                  {bestDays.length > 0 ? (
                    <div className="space-y-4">
                      {bestDays.slice(0, 3).map((day, index) => (
                        <div key={index} className="border rounded-md p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">{formatDate(day.date)}</h3>
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="font-semibold">{renderSiqsScore(day.siqs)}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Cloud Cover:</span>
                              <span>{day.cloudCover}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Temp:</span>
                              <span>{day.temperature.min}°C - {day.temperature.max}°C</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">No best days found</div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-xs text-muted-foreground">
              {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
            </div>
            <Button variant="outline" size="sm" onClick={fetchForecast} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardFooter>
        </Card>
        
        <ForecastApiHealth />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Batch Processing Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline"
                onClick={async () => {
                  setLoading(true);
                  
                  try {
                    // Test batch processing with 5 locations
                    const batchLocations = [
                      { latitude: 40.7128, longitude: -74.006, name: "New York" },
                      { latitude: 34.0522, longitude: -118.2437, name: "Los Angeles" },
                      { latitude: 41.8781, longitude: -87.6298, name: "Chicago" },
                      { latitude: 29.7604, longitude: -95.3698, name: "Houston" },
                      { latitude: 33.4484, longitude: -112.0740, name: "Phoenix" }
                    ];
                    
                    await enhancedForecastAstroService.batchProcessLocations(batchLocations, 0);
                    
                    alert("Batch test for specific day completed successfully!");
                  } catch (err) {
                    console.error("Batch test error:", err);
                    alert("Batch test encountered an error. See console for details.");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                Test Single Day Batch
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true);
                  
                  try {
                    // Test batch processing with full forecast
                    const batchLocations = [
                      { latitude: 40.7128, longitude: -74.006, name: "New York" },
                      { latitude: 34.0522, longitude: -118.2437, name: "Los Angeles" },
                    ];
                    
                    await enhancedForecastAstroService.batchProcessLocations(batchLocations);
                    
                    alert("Batch test for full forecast completed successfully!");
                  } catch (err) {
                    console.error("Batch test error:", err);
                    alert("Batch test encountered an error. See console for details.");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                Test Full Forecast Batch
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Note: Batch processing tests write to console logs. Check browser console for detailed results.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
