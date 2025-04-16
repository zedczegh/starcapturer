
import React from 'react';
import { Star, Moon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { fetchClearSkyRate } from '@/lib/api/clearSkyRate';
import { useLanguage } from '@/contexts/LanguageContext';

interface ClearSkyRateDisplayProps {
  latitude: number;
  longitude: number;
}

const ClearSkyRateDisplay: React.FC<ClearSkyRateDisplayProps> = ({ latitude, longitude }) => {
  const { language } = useLanguage();
  
  const { data: clearSkyData, isLoading } = useQuery({
    queryKey: ['clearSkyRate', latitude, longitude],
    queryFn: () => fetchClearSkyRate(latitude, longitude),
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
  });

  const annualRate = clearSkyData?.annualRate || 0;
  const clearNightsPerYear = Math.round((annualRate / 100) * 365);

  return (
    <Card className="p-4 bg-cosmic-900/50 border-cosmic-800">
      <div className="flex items-center space-x-3">
        <div className="bg-cosmic-800/50 p-2 rounded-full">
          <Moon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-medium mb-1">
            {language === 'en' ? 'Clear Nights Per Year' : '年度晴朗夜晚'}
          </h3>
          {isLoading ? (
            <div className="animate-pulse bg-cosmic-800/50 h-6 w-24 rounded" />
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-xl font-semibold">{clearNightsPerYear}</span>
              <Star className="w-4 h-4 text-yellow-500" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ClearSkyRateDisplay;
