
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, HelpCircle, AlertTriangle } from 'lucide-react';
import { getForecastServicesHealth, HealthStatus, ServiceHealth } from '@/services/forecast/forecastHealthMonitor';

export default function ForecastApiHealth() {
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial health status
    setHealth(getForecastServicesHealth());
    setLoading(false);

    // Update health status every minute
    const interval = setInterval(() => {
      setHealth(getForecastServicesHealth());
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5" />
            Checking API Health...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              Checking forecast API status...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <HelpCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Healthy</Badge>;
      case 'degraded':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Degraded</Badge>;
      case 'critical':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {health ? getStatusIcon(health.status) : <HelpCircle className="h-5 w-5" />}
          Forecast API Status
          <div className="ml-auto">
            {health ? getStatusBadge(health.status) : null}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {health ? (
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Overall reliability:</span>
              <span className="font-medium">{health.reliability}%</span>
            </div>
            
            {health.issues.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-1">Current issues:</h4>
                <ul className="text-sm text-muted-foreground">
                  {health.issues.map((issue, index) => (
                    <li key={index} className="mb-1 text-red-600">
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {Object.keys(health.endpoints).length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-1">Endpoint health:</h4>
                <div className="space-y-2">
                  {Object.entries(health.endpoints).map(([endpoint, data]) => (
                    <div key={endpoint} className="flex justify-between text-sm">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(data.status)}
                        <span className="truncate w-32">{endpoint.split('/')[1]}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {data.reliability}% ({data.calls} calls)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              Last updated: {health.lastChecked.toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            No API health data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
