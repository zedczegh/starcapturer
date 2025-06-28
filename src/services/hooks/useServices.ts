
import { useMemo } from 'react';
import { ServiceContainer } from '@/services/ServiceContainer';

/**
 * React hook to access application services
 * This provides a clean way to access services in React components
 */
export const useServices = () => {
  const services = useMemo(() => ServiceContainer.getInstance(), []);

  return {
    userService: services.getUserService(),
    astroSpotService: services.getAstroSpotService(),
    reservationService: services.getReservationService(),
    messagingService: services.getMessagingService(),
    weatherService: services.getWeatherService(),
    mapService: services.getMapService(),
    siqsService: services.getSiqsService(),
    geocodingService: services.getGeocodingService(),
    cacheService: services.getCacheService()
  };
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
