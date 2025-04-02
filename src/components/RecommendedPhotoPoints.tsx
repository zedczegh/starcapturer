
import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Map, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocationSync } from '@/hooks/useLocationSync';

interface RecommendedPhotoPointsProps {
  className?: string;
  siqs?: number | null;
  onSelectPoint?: (point: { name: string; latitude: number; longitude: number }) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  hideEmptyMessage?: boolean;
}

const RecommendedPhotoPoints: React.FC<RecommendedPhotoPointsProps> = ({ 
  className = "",
  siqs = null,
  onSelectPoint,
  userLocation = null,
  hideEmptyMessage = false
}) => {
  const { t } = useLanguage();
  const { syncedLocation } = useLocationSync();
  
  // Use provided userLocation or fall back to syncedLocation
  const currentLocation = userLocation || (syncedLocation ? {
    latitude: syncedLocation.latitude,
    longitude: syncedLocation.longitude
  } : null);
  
  // Only show if we have a location and SIQS score
  if (!currentLocation && !syncedLocation) {
    if (hideEmptyMessage) return null;
    
    return (
      <div className={`mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4 ${className}`}>
        <p className="text-sm text-center text-muted-foreground">
          {t("Set a location to see recommended photo points", "设置位置以查看推荐的拍摄点")}
        </p>
      </div>
    );
  }
  
  // Handle point selection if provided
  const handleSelectPoint = useCallback((point: any) => {
    if (onSelectPoint) {
      onSelectPoint(point);
    }
  }, [onSelectPoint]);
  
  // Use CSS classes based on SIQS score
  const getScoreClasses = () => {
    if (siqs >= 7) return "text-emerald-500";
    if (siqs >= 5) return "text-cyan-400";
    if (siqs >= 3) return "text-blue-500";
    return "text-amber-500";
  };
  
  // Prepare location coordinates for the link
  const locationCoords = currentLocation || (syncedLocation ? {
    latitude: syncedLocation.latitude,
    longitude: syncedLocation.longitude
  } : { latitude: 0, longitude: 0 });
  
  return (
    <div className={`mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary/80" />
          <h3 className="font-medium">
            {t("Find Photo Points", "寻找拍摄点")}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Navigation className="h-4 w-4 text-primary/70" />
          <span className="text-xs text-primary/70">
            {locationCoords.latitude.toFixed(4)}, {locationCoords.longitude.toFixed(4)}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">
        {t(
          "Discover photography spots near your current location. Current SIQS: ",
          "发现您当前位置附近的摄影地点。当前SIQS评分："
        )}
        <span className={`font-medium ${siqs ? getScoreClasses() : ''}`}>
          {siqs ? siqs.toFixed(1) : "N/A"}
        </span>
      </p>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full justify-center hover:bg-primary/10 transition-colors"
        asChild
      >
        <Link 
          to="/photo-points" 
          state={{ 
            fromCalculator: true, 
            latitude: locationCoords.latitude, 
            longitude: locationCoords.longitude 
          }}
        >
          <Map className="mr-2 h-4 w-4" />
          {t("View Nearby Photo Points", "查看附近的拍摄点")}
        </Link>
      </Button>
    </div>
  );
};

export default RecommendedPhotoPoints;
