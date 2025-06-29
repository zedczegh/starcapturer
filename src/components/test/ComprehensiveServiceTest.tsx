
import React, { useState, useEffect } from 'react';
import { useServices } from '@/hooks/useServices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe, Cloud, Calculator, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  result?: any;
  error?: string;
  duration?: number;
}

const ComprehensiveServiceTest: React.FC = () => {
  const { 
    userService, 
    weatherService, 
    mapService, 
    siqsService, 
    geocodingService,
    cacheService 
  } = useServices();
  
  const { language, t } = useLanguage();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Test coordinates (Beijing area for Chinese environment, New York for English)
  const getTestCoordinates = () => {
    return language === 'zh' 
      ? { lat: 39.9042, lng: 116.4074, name: 'Beijing' }
      : { lat: 40.7128, lng: -74.0060, name: 'New York' };
  };

  const updateTestResult = (name: string, updates: Partial<TestResult>) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { ...r, ...updates } : r);
      } else {
        return [...prev, { name, status: 'pending', ...updates }];
      }
    });
  };

  const runSingleTest = async (testName: string, testFn: () => Promise<any>) => {
    const startTime = Date.now();
    updateTestResult(testName, { status: 'pending' });
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      updateTestResult(testName, { 
        status: 'success', 
        result, 
        duration 
      });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult(testName, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        duration 
      });
      throw error;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const coords = getTestCoordinates();

    try {
      // Test 1: Map Service Provider Detection
      await runSingleTest('Map Service Provider', async () => {
        const provider = mapService.getProvider();
        return { provider, expectedForLanguage: language === 'zh' ? 'gaode' : 'default' };
      });

      // Test 2: Location Name Resolution
      await runSingleTest('Location Name Resolution', async () => {
        const locationName = await mapService.getLocationName(coords.lat, coords.lng);
        return { locationName, coordinates: `${coords.lat}, ${coords.lng}` };
      });

      // Test 3: Light Pollution Data
      await runSingleTest('Light Pollution Data', async () => {
        const lightData = await mapService.getLightPollutionData(coords.lat, coords.lng);
        return lightData;
      });

      // Test 4: SIQS Calculation
      await runSingleTest('SIQS Calculation', async () => {
        const siqsData = await mapService.calculateSIQS(coords.lat, coords.lng, 4, {
          useSingleHourSampling: true,
          targetHour: 1,
          cacheDurationMins: 5
        });
        return siqsData;
      });

      // Test 5: Weather Service
      await runSingleTest('Weather Service', async () => {
        const weatherData = await weatherService.getCurrentWeather(coords.lat, coords.lng);
        return weatherData;
      });

      // Test 6: Geocoding Service
      await runSingleTest('Geocoding Service', async () => {
        const geocodingResult = await geocodingService.getLocationDetails(coords.lat, coords.lng);
        return geocodingResult;
      });

      // Test 7: SIQS Service Direct
      await runSingleTest('SIQS Service Direct', async () => {
        const siqsResult = await siqsService.calculateSiqs(coords.lat, coords.lng, 4);
        return siqsResult;
      });

      // Test 8: Cache Service
      await runSingleTest('Cache Service', async () => {
        const cacheKey = `test-${Date.now()}`;
        const testData = { test: 'data', timestamp: Date.now() };
        
        await cacheService.set(cacheKey, testData, 60);
        const retrieved = await cacheService.get(cacheKey);
        await cacheService.delete(cacheKey);
        
        return { stored: testData, retrieved, match: JSON.stringify(testData) === JSON.stringify(retrieved) };
      });

    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t('Comprehensive Service Test', '综合服务测试')}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{t('Environment:', '环境：')} {language === 'zh' ? 'Chinese (中文)' : 'English'}</span>
          <span>{t('Map Provider:', '地图提供商：')} {mapService.getProvider()}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('Running Tests...', '正在运行测试...')}
            </>
          ) : (
            t('Run All Tests', '运行所有测试')
          )}
        </Button>

        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">{t('Test Results:', '测试结果：')}</h3>
            
            {testResults.map((test, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    <span className="font-medium">{test.name}</span>
                    {test.duration && (
                      <Badge variant="outline" className="text-xs">
                        {test.duration}ms
                      </Badge>
                    )}
                  </div>
                  <Badge className={getStatusColor(test.status)}>
                    {test.status}
                  </Badge>
                </div>
                
                {test.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Error:</strong> {test.error}
                  </div>
                )}
                
                {test.result && (
                  <div className="mt-2 p-2 bg-gray-50 border rounded text-sm">
                    <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto">
                      {JSON.stringify(test.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComprehensiveServiceTest;
