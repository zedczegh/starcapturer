
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
    mapService: services.getMapService()
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
