
import React from 'react';
import { motion } from 'framer-motion';
import LocationSelector from '../LocationSelector';
import RecommendationsSection from './RecommendationsSection';
import { GeoLocation } from '@/types/location';
import { animationVariants } from './utils/animationUtils';

interface LocationInputSectionProps {
  locationName: string | null;
  loading: boolean;
  calculationInProgress: boolean;
  handleUseCurrentLocation: () => void;
  handleLocationSelect: (location: any) => void;
  handleRecommendedPointSelect: (location: GeoLocation) => void;
  userLocation: GeoLocation | null;
  showRecommendations: boolean;
  noAutoLocationRequest?: boolean;
}

const LocationInputSection: React.FC<LocationInputSectionProps> = ({
  locationName,
  loading,
  calculationInProgress,
  handleUseCurrentLocation,
  handleLocationSelect,
  handleRecommendedPointSelect,
  userLocation,
  showRecommendations,
  noAutoLocationRequest
}) => {
  return (
    <motion.div 
      className="space-y-4" 
      variants={animationVariants} 
      transition={{ delay: 0.3 }}
    >
      <LocationSelector 
        locationName={locationName}
        loading={loading || calculationInProgress}
        handleUseCurrentLocation={handleUseCurrentLocation}
        onSelectLocation={handleLocationSelect}
        noAutoLocationRequest={noAutoLocationRequest}
      />
      
      <RecommendationsSection 
        onSelectPoint={handleRecommendedPointSelect}
        userLocation={userLocation}
        showRecommendations={showRecommendations}
      />
    </motion.div>
  );
};

export default LocationInputSection;
