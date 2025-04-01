import React, { useState, useEffect } from "react";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, LocateFixed } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGeolocation } from '@/hooks/location/useGeolocation';

interface LocationPickerProps {
  coordinates: { latitude: number; longitude: number } | null;
  setCoordinates: (coords: { latitude: number; longitude: number }) => void;
  className?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  coordinates,
  setCoordinates,
  className
}) => {
  const { t, language } = useLanguage();
  const { getPosition, loading: geoLoading } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    language: language
  });

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const handleGetLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationLoading(false);
      },
      (error) => {
        setLocationError(error);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleUseCurrentLocation = async () => {
    getPosition();
  };

  const formatCoordinate = (value: number, isLatitude: boolean) => {
    return `${value.toFixed(6)}° ${isLatitude ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W')}`;
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-4">
        <div className="flex gap-2 items-center">
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">{t("Latitude", "纬度")}</div>
              <Input
                type="text"
                value={coordinates ? formatCoordinate(coordinates.latitude, true) : ''}
                readOnly
                className="bg-cosmic-800/30 border-cosmic-700/40 cursor-default"
              />
            </div>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">{t("Longitude", "经度")}</div>
              <Input
                type="text"
                value={coordinates ? formatCoordinate(coordinates.longitude, false) : ''}
                readOnly
                className="bg-cosmic-800/30 border-cosmic-700/40 cursor-default"
              />
            </div>
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-5"
          >
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleUseCurrentLocation}
              disabled={geoLoading}
              className="h-10 w-10 bg-cosmic-800 hover:bg-cosmic-700 border border-cosmic-600/30"
            >
              {geoLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <LocateFixed className="h-4 w-4" />
                </motion.div>
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
