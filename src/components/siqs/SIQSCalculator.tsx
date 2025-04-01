
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useSIQSCalculation } from '@/hooks/useSIQSCalculation';
import { SIQSResult } from '@/lib/calculateSIQS';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

export interface SIQSCalculatorProps {
  onCalculate?: (result: SIQSResult) => void;
  onUpdateSiqs?: (score: number, isViable: boolean) => void;
  noAutoLocationRequest?: boolean;
  compact?: boolean;
  className?: string;
  location?: any; // Add the location prop for compatibility
}

const SIQSCalculator: React.FC<SIQSCalculatorProps> = ({
  onCalculate,
  onUpdateSiqs,
  noAutoLocationRequest = false,
  compact = false,
  className = '',
  location // Add the location prop handling
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [useLocation, setUseLocation] = useState(location ? true : false);
  
  const { 
    siqs, 
    calculating, 
    handleCalculate,
    locationData
  } = useSIQSCalculation({
    onResult: (result) => {
      if (onCalculate) onCalculate(result);
      if (onUpdateSiqs) onUpdateSiqs(result.score, result.isViable);
    },
    requestLocationOnMount: !noAutoLocationRequest,
    initialLocation: location // Pass the location if provided
  });
  
  // Handle view details button click
  const handleViewDetails = () => {
    if (locationData) {
      navigate(`/location/${locationData.id}`, { state: locationData });
    }
  };
  
  // Watch for location prop changes
  useEffect(() => {
    if (location) {
      setUseLocation(true);
    }
  }, [location]);
  
  return (
    <Card className={`border-cosmic-700 bg-cosmic-800/40 backdrop-blur-sm ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-gradient-blue">
          {t("Calculate SIQS", "计算SIQS")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Display if there's a location */}
          {useLocation && locationData && (
            <div className="rounded-md bg-cosmic-800/80 border border-cosmic-700/50 p-3">
              <p className="text-sm font-medium">{locationData.name}</p>
              <p className="text-xs text-muted-foreground">
                {locationData.latitude.toFixed(5)}, {locationData.longitude.toFixed(5)}
              </p>
            </div>
          )}
          
          <div className="flex justify-between gap-2">
            <Button
              onClick={handleCalculate}
              className="flex-1"
              disabled={calculating}
            >
              {calculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("Calculating...", "计算中...")}
                </>
              ) : (
                t("Calculate SIQS", "计算SIQS")
              )}
            </Button>
            
            {siqs && (
              <Button
                onClick={handleViewDetails}
                variant="outline"
                className="bg-cosmic-800/60 border-cosmic-700/50"
              >
                {t("View Details", "查看详情")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SIQSCalculator;
