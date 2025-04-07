
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface RealTimeLocationUpdaterProps {
  userLocation: { latitude: number; longitude: number } | null;
  onLocationUpdate?: (latitude: number, longitude: number) => void;
}

// This component manages real-time location updates
const RealTimeLocationUpdater: React.FC<RealTimeLocationUpdaterProps> = ({ 
  userLocation,
  onLocationUpdate 
}) => {
  return null; // This component doesn't render anything visible
};

export default RealTimeLocationUpdater;
