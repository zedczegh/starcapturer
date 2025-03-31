
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CloudRain, Wind, Thermometer } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface WeatherAlertsProps {
  alerts: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    timeRange?: string;
  }>;
}

const WeatherAlerts: React.FC<WeatherAlertsProps> = ({ alerts }) => {
  const { t } = useLanguage();
  
  if (!alerts || alerts.length === 0) {
    return null;
  }

  const getAlertIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'rain':
      case 'precipitation':
        return <CloudRain className="h-5 w-5" />;
      case 'wind':
        return <Wind className="h-5 w-5" />;
      case 'temperature':
        return <Thermometer className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };
  
  const getAlertColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low':
        return 'border-yellow-500/30 bg-yellow-900/20 text-yellow-300';
      case 'medium':
        return 'border-orange-500/30 bg-orange-900/20 text-orange-300';
      case 'high':
        return 'border-red-500/30 bg-red-900/20 text-red-300';
      default:
        return 'border-amber-500/30 bg-amber-900/20 text-amber-300';
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
        <CardTitle className="text-lg text-gradient-yellow">
          {t('Weather Alerts', '天气警报')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {alerts.map((alert, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg border ${getAlertColor(alert.severity)} flex gap-3 items-start`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getAlertIcon(alert.type)}
            </div>
            <div>
              <p className="text-sm">{alert.message}</p>
              {alert.timeRange && (
                <p className="text-xs mt-1 opacity-80">{alert.timeRange}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default WeatherAlerts;
