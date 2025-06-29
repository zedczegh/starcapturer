import { useMemo, useEffect, useState } from 'react';
import { ServiceContainer } from '@/services/ServiceContainer';

/**
 * React hook to access application services
 * This provides a clean way to access services in React components
 */
export const useServices = () => {
  const [serviceVersion, setServiceVersion] = useState(0);
  
  // Listen for service updates to refresh the services
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleServiceUpdate = () => {
      console.log('Service updated, refreshing services...');
      setServiceVersion(prev => prev + 1);
    };
    
    window.addEventListener('service-updated', handleServiceUpdate);
    
    return () => {
      window.removeEventListener('service-updated', handleServiceUpdate);
    };
  }, []);

  const services = useMemo(() => {
    const container = ServiceContainer.getInstance();
    return {
      userService: container.getUserService(),
      astroSpotService: container.getAstroSpotService(),
      reservationService: container.getReservationService(),
      messagingService: container.getMessagingService(),
      weatherService: container.getWeatherService(),
      mapService: container.getMapService(),
      siqsService: container.getSiqsService(),
      geocodingService: container.getGeocodingService(),
      cacheService: container.getCacheService()
    };
  }, [serviceVersion]); // Re-memoize when serviceVersion changes

  return services;
};

/**
 * Hook to access individual services
 */
export const useUserService = () => {
  return ServiceContainer.getInstance().getUserService();
};

export const useAstroSpotService = () => {
  return ServiceContainer.getInstance().getAstroSpotService();
};

export const useReservationService = () => {
  return ServiceContainer.getInstance().getReservationService();
};

export const useMessagingService = () => {
  return ServiceContainer.getInstance().getMessagingService();
};

export const useWeatherService = () => {
  return ServiceContainer.getInstance().getWeatherService();
};

export const useMapService = () => {
  return ServiceContainer.getInstance().getMapService();
};

export const useSiqsService = () => {
  return ServiceContainer.getInstance().getSiqsService();
};

export const useGeocodingService = () => {
  return ServiceContainer.getInstance().getGeocodingService();
};

export const useCacheService = () => {
  return ServiceContainer.getInstance().getCacheService();
};

/**
 * Hook to check service health
 */
export const useServiceHealth = () => {
  const services = useMemo(() => ServiceContainer.getInstance(), []);
  
  return {
    healthCheck: () => services.healthCheck(),
    reinitialize: () => services.reinitialize()
  };
};
