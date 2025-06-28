
import { IUserService, IAstroSpotService, IReservationService, IMessagingService } from './interfaces/IDatabaseService';
import { IWeatherService } from './interfaces/IWeatherService';
import { IMapService } from './interfaces/IMapService';
import { ConfigManager } from './config/AppConfig';

// Implementations
import { SupabaseUserService, SupabaseAstroSpotService, SupabaseReservationService, SupabaseMessagingService } from './implementations/SupabaseDatabaseService';
import { OpenMeteoWeatherService } from './implementations/OpenMeteoWeatherService';
import { DefaultMapService } from './implementations/DefaultMapService';
import { GaodeMapService } from './implementations/GaodeMapService';

export class ServiceContainer {
  private static instance: ServiceContainer;
  private services = new Map<string, any>();
  private configManager = ConfigManager.getInstance();

  private constructor() {
    this.initializeServices();
  }

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  private initializeServices(): void {
    const config = this.configManager.getConfig();

    // Initialize database services based on configuration
    switch (config.database.provider) {
      case 'supabase':
        this.services.set('userService', new SupabaseUserService());
        this.services.set('astroSpotService', new SupabaseAstroSpotService());
        this.services.set('reservationService', new SupabaseReservationService());
        this.services.set('messagingService', new SupabaseMessagingService());
        break;
      // Future: Add Firebase, custom implementations
    }

    // Initialize weather service based on configuration
    switch (config.weather.provider) {
      case 'openmeteo':
        this.services.set('weatherService', new OpenMeteoWeatherService());
        break;
      // Future: Add WeatherAPI, custom implementations
    }

    // Initialize map service based on configuration
    switch (config.map.provider) {
      case 'leaflet':
        this.services.set('mapService', new DefaultMapService());
        break;
      case 'gaode':
        this.services.set('mapService', new GaodeMapService());
        break;
      // Future: Add Mapbox, Google Maps implementations
    }
  }

  // Generic service getter
  get<T>(serviceKey: string): T {
    const service = this.services.get(serviceKey);
    if (!service) {
      throw new Error(`Service '${serviceKey}' not found`);
    }
    return service;
  }

  // Typed service getters for better developer experience
  getUserService(): IUserService {
    return this.get<IUserService>('userService');
  }

  getAstroSpotService(): IAstroSpotService {
    return this.get<IAstroSpotService>('astroSpotService');
  }

  getReservationService(): IReservationService {
    return this.get<IReservationService>('reservationService');
  }

  getMessagingService(): IMessagingService {
    return this.get<IMessagingService>('messagingService');
  }

  getWeatherService(): IWeatherService {
    return this.get<IWeatherService>('weatherService');
  }

  getMapService(): IMapService {
    return this.get<IMapService>('mapService');
  }

  // Method to reinitialize services when configuration changes
  reinitialize(): void {
    this.services.clear();
    this.initializeServices();
  }

  // Method to override a service (useful for testing)
  override<T>(serviceKey: string, service: T): void {
    this.services.set(serviceKey, service);
  }
}

// Convenience function for getting the service container
export const getServices = () => ServiceContainer.getInstance();
