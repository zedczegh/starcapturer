
import React, { useState, useEffect } from 'react';
import { forecastAstroService, ForecastDayAstroData } from '@/services/forecast/forecastAstroService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import { getSiqsColorClass, formatSiqs, getSiqsQuality } from '@/utils/forecast/forecastSiqsUtils';
import { Button } from '../ui/button';

// NYC coordinates
const NYC_LAT = 40.7128;
const NYC_LNG = -74.0060;
const NYC_NAME = "New York City";

export default function TestForecastAstro() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecastData, setForecastData] = useState<ForecastDayAstroData[]>([]);
  const [selectedDay, setSelectedDay] = useState(5); // 5 days from now

  // Function to fetch the forecast data
  const fetchForecastData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await forecastAstroService.getFullForecastAstroData(
        NYC_LAT,
        NYC_LNG,
        4 // Default Bortle scale for urban area
      );
      
      setForecastData(data);
      console.log("Fetched forecast data:", data);
    } catch (err) {
      console.error("Error fetching forecast data:", err);
      setError("Failed to fetch forecast data. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchForecastData();
  }, []);

  const selectedForecast = forecastData[selectedDay];
  
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">
        Astronomical Forecast Test for {NYC_NAME}
      </h2>
      
      <div className="mb-6">
        <div className="flex gap-2 mb-2">
          <Button variant="outline" onClick={fetchForecastData}>
            Refresh Data
          </Button>
          <div className="flex items-center gap-2">
            <label htmlFor="daySelect" className="text-sm">Day:</label>
            <select 
              id="daySelect"
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              {forecastData.map((day, index) => (
                <option key={index} value={index}>
                  Day {index}: {new Date(day.date).toLocaleDateString()}
                </option>
              ))}
            </select>
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
          {error}
        </div>
      ) : forecastData.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
          No forecast data available.
        </div>
      ) : selectedForecast ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Forecast for {new Date(selectedForecast.date).toLocaleDateString()}
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
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
          Selected day not available. Please select a different day.
        </div>
      )}

      {/* Show all days data for debugging */}
      {forecastData.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-2">All Days Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forecastData.map((day, index) => (
              <Card 
                key={index}
                className={`cursor-pointer ${selectedDay === index ? 'border-2 border-primary' : ''}`}
                onClick={() => setSelectedDay(index)}
              >
                <CardContent className="p-4">
                  <p className="font-bold">{new Date(day.date).toLocaleDateString()}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span>SIQS:</span>
                    <span className={`font-medium px-2 py-1 rounded ${getSiqsColorClass(day.siqs).replace('bg-', 'text-')}`}>
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
      )}
    </div>
  );
}
