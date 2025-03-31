
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';

interface MapDisplayProps {
  locationData: {
    latitude: number;
    longitude: number;
    name: string;
  };
}

const MapDisplay: React.FC<MapDisplayProps> = ({ locationData }) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  // Generate Google Maps embed URL
  const mapUrl = React.useMemo(() => {
    if (!locationData?.latitude || !locationData?.longitude) return '';
    
    const baseUrl = 'https://www.google.com/maps/embed/v1/place';
    const apiKey = 'AIzaSyDJyQKQe05jPZV7oPsddfVbxlOYuwOcIpM'; // Public API key for map embeds
    
    const coordinates = `${locationData.latitude},${locationData.longitude}`;
    return `${baseUrl}?key=${apiKey}&q=${coordinates}&zoom=9&maptype=satellite`;
  }, [locationData?.latitude, locationData?.longitude]);

  // Handle iframe loading
  const handleLoad = () => {
    setIsLoading(false);
  };

  // Handle iframe error
  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  if (!locationData?.latitude || !locationData?.longitude) {
    return (
      <div className="h-64 rounded-lg bg-cosmic-900/50 flex items-center justify-center">
        <p className="text-muted-foreground">{t("No location data available", "无位置数据")}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96">
      {isLoading && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-lg bg-cosmic-700/20" />
      )}
      
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-cosmic-900/50 rounded-lg">
          <p className="text-muted-foreground">{t("Failed to load map", "加载地图失败")}</p>
        </div>
      ) : (
        <iframe
          title={`Map of ${locationData.name}`}
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0, borderRadius: '0.5rem' }}
          src={mapUrl}
          allowFullScreen
          onLoad={handleLoad}
          onError={handleError}
          className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        />
      )}
    </div>
  );
};

export default MapDisplay;
