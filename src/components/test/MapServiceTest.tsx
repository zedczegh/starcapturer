
import React, { useState, useEffect } from 'react';
import { useMapService } from '@/hooks/useServices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';

const MapServiceTest: React.FC = () => {
  const mapService = useMapService();
  const [testResults, setTestResults] = useState<{
    provider: string;
    locationName: string | null;
    lightPollution: number | null;
    siqs: number | null;
    loading: boolean;
    error: string | null;
  }>({
    provider: '',
    locationName: null,
    lightPollution: null,
    siqs: null,
    loading: false,
    error: null
  });

  // Test coordinates (Beijing area)
  const testLat = 39.9042;
  const testLng = 116.4074;

  useEffect(() => {
    if (mapService) {
      setTestResults(prev => ({
        ...prev,
        provider: mapService.getProvider()
      }));
    }
  }, [mapService]);

  const runTest = async () => {
    if (!mapService) return;

    setTestResults(prev => ({
      ...prev,
      loading: true,
      error: null,
      locationName: null,
      lightPollution: null,
      siqs: null
    }));

    try {
      // Test 1: Get location name
      const locationName = await mapService.getLocationName(testLat, testLng);
      setTestResults(prev => ({ ...prev, locationName }));

      // Test 2: Get light pollution data
      const lightData = await mapService.getLightPollutionData(testLat, testLng);
      setTestResults(prev => ({ ...prev, lightPollution: lightData.bortleScale }));

      // Test 3: Calculate SIQS
      const siqsData = await mapService.calculateSIQS(testLat, testLng, lightData.bortleScale);
      setTestResults(prev => ({ ...prev, siqs: siqsData.siqs }));

    } catch (error) {
      console.error('Map service test error:', error);
      setTestResults(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    } finally {
      setTestResults(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Map Service Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Current Provider:</p>
          <p className="font-medium">{testResults.provider || 'Loading...'}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Test Coordinates:</p>
          <p className="font-mono text-sm">{testLat}, {testLng}</p>
        </div>

        <Button 
          onClick={runTest} 
          disabled={testResults.loading}
          className="w-full"
        >
          {testResults.loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            'Run Test'
          )}
        </Button>

        {testResults.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{testResults.error}</p>
          </div>
        )}

        {(testResults.locationName || testResults.lightPollution || testResults.siqs) && (
          <div className="space-y-2">
            <h4 className="font-medium">Test Results:</h4>
            
            {testResults.locationName && (
              <div>
                <p className="text-sm text-muted-foreground">Location Name:</p>
                <p className="text-sm">{testResults.locationName}</p>
              </div>
            )}
            
            {testResults.lightPollution && (
              <div>
                <p className="text-sm text-muted-foreground">Bortle Scale:</p>
                <p className="text-sm">{testResults.lightPollution}</p>
              </div>
            )}
            
            {testResults.siqs && (
              <div>
                <p className="text-sm text-muted-foreground">SIQS Score:</p>
                <p className="text-sm">{testResults.siqs.toFixed(2)}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MapServiceTest;
