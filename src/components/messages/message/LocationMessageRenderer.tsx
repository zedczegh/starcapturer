
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import LocationShareCard from '../LocationShareCard';

interface LocationMessageRendererProps {
  location: {
    name: string;
    latitude: number;
    longitude: number;
    timestamp?: string;
    siqs?: number | null;
    spotId?: string;
  };
}

const LocationMessageRenderer: React.FC<LocationMessageRendererProps> = ({ location }) => {
  const navigate = useNavigate();
  
  const handleLocationCardClick = () => {
    if (location.spotId) {
      navigate(`/astro-spot/${location.spotId}`);
    } else {
      // Navigate to a generic location view based on coordinates
      navigate(`/location?lat=${location.latitude}&lng=${location.longitude}`);
    }
  };
  
  return (
    <div onClick={handleLocationCardClick} className="cursor-pointer">
      <LocationShareCard 
        name={location.name}
        latitude={location.latitude}
        longitude={location.longitude}
        timestamp={location.timestamp}
        siqs={location.siqs}
      />
    </div>
  );
};

export default LocationMessageRenderer;
