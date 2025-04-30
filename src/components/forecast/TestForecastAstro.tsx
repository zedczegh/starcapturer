
import React, { useState, useEffect, useMemo } from 'react';
import { forecastAstroService, ForecastDayAstroData } from '@/services/forecast/forecastAstroService';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader, RefreshCw, AlertTriangle, Star } from 'lucide-react';
import { getSiqsColorClass, formatSiqs, getSiqsQuality } from '@/utils/forecast/forecastSiqsUtils';
import { Button } from '../ui/button';
import { toast } from 'sonner';

// Demo locations
const LOCATIONS = [
  { name: "New York City", lat: 40.7128, lng: -74.0060, bortle: 8 },
  { name: "Death Valley", lat: 36.2333, lng: -116.8833, bortle: 2 },
  { name: "Tokyo", lat: 35.6895, lng: 139.6917, bortle: 9 },
  { name: "Namibian Desert", lat: -24.7255, lng: 15.2799, bortle: 1 }
];

export default function TestForecastAstro() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecastData, setForecastData] = useState<ForecastDayAstroData[]>([]);
  const [selectedDay, setSelectedDay] = useState(5); // Default to 5 days from now
  const [selectedLocation, setSelectedLocation] = useState(0); // Default to NYC
  
  // Batch processing state
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // Function to fetch the forecast data
  const fetchForecastData = async (locationIndex = 0) => {
    setLoading(true);
    setError(null);
    
    const location = LOCATIONS[locationIndex];
    
    try {
      const data = await forecastAstroService.getFullForecastAstroData(
        location.lat,
        location.lng,
        location.bortle
      );
      
      setForecastData(data);
      console.log(`Fetched forecast data for ${location.name}:`, data);
      toast.success(`Forecast data loaded for ${location.name}`, {
        description: `Retrieved ${data.length} days of astronomical forecast data`
      });
    } catch (err) {
      console.error("Error fetching forecast data:", err);
      setError(`Failed to fetch forecast data for ${location.name}. See console for details.`);
      toast.error(`Failed to load forecast for ${location.name}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch batch forecast data for all locations
  const fetchBatchForecast = async () => {
    setBatchLoading(true);
    
    try {
      const batchLocations = LOCATIONS.map(loc => ({ 
        latitude: loc.lat, 
        longitude: loc.lng,
        bortleScale: loc.bortle
      }));
      
      // Use the new batch processing capability
      const results = await forecastAstroService.batchProcessLocations(batchLocations, selectedDay);
      
      setBatchResults(results);
      console.log("Batch results:", results);
      toast.success("Batch processing complete", {
        description: `Processed ${results.length} locations for day ${selectedDay}`
      });
    } catch (err) {
      console.error("Error in batch processing:", err);
      toast.error("Batch processing failed", {
        description: "See console for details"
      });
    } finally {
      setBatchLoading(false);
    }
  };

  // Load data when component mounts or location changes
  useEffect(() => {
    fetchForecastData(selectedLocation);
  }, [selectedLocation]);

  const selectedForecast = useMemo(() => forecastData[selectedDay], [forecastData, selectedDay]);
  
  // Best day calculation
  const bestDay = useMemo(() => {
    if (!forecastData.length) return null;
    
    const viableDays = forecastData.filter(day => day.isViable && day.siqs !== null);
    if (!viableDays.length) return null;
    
    return viableDays.reduce((best, current) => 
      (current.siqs || 0) > (best.siqs || 0) ? current : best
    );
  }, [forecastData]);
  
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Location:</label>
            <select 
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(Number(e.target.value))}
              className="border rounded px-3 py-2"
              disabled={loading}
            >
              {LOCATIONS.map((loc, idx) => (
                <option key={idx} value={idx}>
                  {loc.name} (Bortle: {loc.bortle})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Day:</label>
            <select 
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              className="border rounded px-3 py-2"
              disabled={loading || forecastData.length === 0}
            >
              {forecastData.map((day, index) => (
                <option key={index} value={index}>
                  Day {index}: {new Date(day.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => fetchForecastData(selectedLocation)}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              <RefreshCw size={16} />
              Refresh Data
            </Button>
          </div>
          
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={fetchBatchForecast}
              disabled={batchLoading || forecastData.length === 0}
              className="flex items-center gap-2"
            >
              {batchLoading && <Loader size={16} className="animate-spin" />}
              Test Batch Processing
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader className="animate-spin h-8 w-8" />
          <span className="ml-2">Loading forecast data...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} />
            <p>{error}</p>
          </div>
        </div>
      ) : forecastData.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
          No forecast data available.
        </div>
      ) : selectedForecast ? (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {LOCATIONS[selectedLocation].name} - {new Date(selectedForecast.date).toLocaleDateString()}
                </span>
                {bestDay && selectedForecast.date === bestDay.date && (
                  <span className="flex items-center text-amber-500 text-sm">
                    <Star size={16} className="mr-1" fill="currentColor" />
                    Best Day
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <div className="text-center p-3 rounded-lg mb-4" style={{ 
                    backgroundColor: getSiqsColorClass(selectedForecast.siqs).replace('bg-', 'rgb(var(--')
                    .replace('500', '500))')
                    .replace('400', '400))') 
                  }}>
                    <span className="text-3xl font-bold text-white">
                      {formatSiqs(selectedForecast.siqs)}
                    </span>
                    <p className="text-white mt-1">
                      {getSiqsQuality(selectedForecast.siqs)} Conditions
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Cloud Cover:</span>
                    <span className="font-medium">{selectedForecast.cloudCover}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temperature:</span>
                    <span className="font-medium">
                      {selectedForecast.temperature.min}° - {selectedForecast.temperature.max}°C
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Humidity:</span>
                    <span className="font-medium">{selectedForecast.humidity}%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Precipitation:</span>
                    <span className="font-medium">{selectedForecast.precipitation.probability}% chance</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wind Speed:</span>
                    <span className="font-medium">{selectedForecast.windSpeed} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Viable for Astronomy:</span>
                    <span className={`font-medium ${selectedForecast.isViable ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedForecast.isViable ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                
                <div className="col-span-2 mt-4 pt-4 border-t">
                  <h3 className="font-bold mb-2">Technical Details:</h3>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedForecast.siqsResult, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Show batch processing results if available */}
          {batchResults.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Batch Processing Results - Day {selectedDay}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {batchResults.map((result, index) => (
                    <Card key={index} className="h-full">
                      <CardContent className="p-4">
                        <h3 className="font-bold">{LOCATIONS[index].name}</h3>
                        {result.forecast ? (
                          <div className="mt-2">
                            <div className={`inline-block px-3 py-1 rounded-full text-white ${
                              getSiqsColorClass(result.forecast.siqs)
                            }`}>
                              SIQS: {formatSiqs(result.forecast.siqs)}
                            </div>
                            <div className="mt-2 space-y-1 text-sm">
                              <div>Cloud Cover: {result.forecast.cloudCover}%</div>
                              <div>Viable: {result.forecast.isViable ? 'Yes' : 'No'}</div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-red-500 text-sm mt-2">
                            Failed to process
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Days Summary */}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-2">15-Day Forecast Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {forecastData.map((day, index) => (
                <Card 
                  key={index}
                  className={`cursor-pointer ${selectedDay === index ? 'border-2 border-primary' : ''} ${
                    bestDay && day.date === bestDay.date ? 'bg-amber-50' : ''
                  }`}
                  onClick={() => setSelectedDay(index)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <p className="font-bold">{new Date(day.date).toLocaleDateString()}</p>
                      {bestDay && day.date === bestDay.date && (
                        <Star size={16} fill="gold" stroke="gold" />
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span>SIQS:</span>
                      <span className={`font-medium px-2 py-1 rounded ${getSiqsColorClass(day.siqs)} text-white`}>
                        {formatSiqs(day.siqs)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span>Cloud Cover:</span>
                      <span>{day.cloudCover}%</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span>Viable:</span>
                      <span className={day.isViable ? 'text-green-600' : 'text-red-600'}>
                        {day.isViable ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
          Selected day not available. Please select a different day.
        </div>
      )}
    </div>
  );
}
