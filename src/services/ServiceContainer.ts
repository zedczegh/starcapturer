
import { IUserService, IAstroSpotService, IReservationService, IMessagingService } from './interfaces/IDatabaseService';
import { IWeatherService } from './interfaces/IWeatherService';
import { IMapService } from './interfaces/IMapService';
import { ISiqsService } from './interfaces/ISiqsService';
import { IGeocodingService } from './interfaces/IGeocodingService';
import { ICacheService } from './interfaces/ICacheService';
import { ConfigManager } from './config/AppConfig';

// Database implementations
import { SupabaseUserService, SupabaseAstroSpotService, SupabaseReservationService, SupabaseMessagingService } from './implementations/SupabaseDatabaseService';
// Weather implementations
import { OpenMeteoWeatherService } from './implementations/OpenMeteoWeatherService';
// Map implementations
import { DefaultMapService } from './implementations/DefaultMapService';
import { GaodeMapService } from './implementations/GaodeMapService';
// SIQS implementations
import { DefaultSiqsService } from './implementations/DefaultSiqsService';
// Geocoding implementations
import { DefaultGeocodingService } from './implementations/DefaultGeocodingService';
// Cache implementations
import { DefaultCacheService } from './implementations/DefaultCacheService';

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
    try {
      const config = this.configManager.getConfig();

      // Initialize database services
      this.initializeDatabaseServices(config.database.provider);
      
      // Initialize weather services
      this.initializeWeatherServices(config.weather.provider);
      
      // Initialize map services
      this.initializeMapServices(config.map.provider);
      
      // Initialize SIQS services (always default for now)
      this.services.set('siqsService', new DefaultSiqsService());
      
      // Initialize geocoding services (always default for now)
      this.services.set('geocodingService', new DefaultGeocodingService());
      
      // Initialize cache services (always default for now)
      this.services.set('cacheService', new DefaultCacheService());
      
    } catch (error) {
      console.error('Error initializing services:', error);
      // Fallback to default services
      this.initializeFallbackServices();
    }
  }

  private initializeDatabaseServices(provider: string): void {
    switch (provider) {
      case 'supabase':
        this.services.set('userService', new SupabaseUserService());
        this.services.set('astroSpotService', new SupabaseAstroSpotService());
        this.services.set('reservationService', new SupabaseReservationService());
        this.services.set('messagingService', new SupabaseMessagingService());
        break;
      default:
        console.warn(`Unknown database provider: ${provider}. Using Supabase as default.`);
        this.services.set('userService', new SupabaseUserService());
        this.services.set('astroSpotService', new SupabaseAstroSpotService());
        this.services.set('reservationService', new SupabaseReservationService());
        this.services.set('messagingService', new SupabaseMessagingService());
    }
  }

  private initializeWeatherServices(provider: string): void {
    switch (provider) {
      case 'openmeteo':
        this.services.set('weatherService', new OpenMeteoWeatherService());
        break;
      default:
        console.warn(`Unknown weather provider: ${provider}. Using OpenMeteo as default.`);
        this.services.set('weatherService', new OpenMeteoWeatherService());
    }
  }

  private initializeMapServices(provider: string): void {
    switch (provider) {
      case 'leaflet':
        this.services.set('mapService', new DefaultMapService());
        break;
      case 'gaode':
        this.services.set('mapService', new GaodeMapService());
        break;
      default:
        console.warn(`Unknown map provider: ${provider}. Using default as fallback.`);
        this.services.set('mapService', new DefaultMapService());
    }
  }

  private initializeFallbackServices(): void {
    console.warn('Initializing fallback services due to configuration error');
    
    // Fallback database services
    this.services.set('userService', new SupabaseUserService());
    this.services.set('astroSpotService', new SupabaseAstroSpotService());
    this.services.set('reservationService', new SupabaseReservationService());
    this.services.set('messagingService', new SupabaseMessagingService());
    
    // Fallback other services
    this.services.set('weatherService', new OpenMeteoWeatherService());
    this.services.set('mapService', new DefaultMapService());
    this.services.set('siqsService', new DefaultSiqsService());
    this.services.set('geocodingService', new DefaultGeocodingService());
    this.services.set('cacheService', new DefaultCacheService());
  }

  // Generic service getter with improved error handling
  get<T>(serviceKey: string): T {
    const service = this.services.get(serviceKey);
    if (!service) {
      console.error(`Service '${serviceKey}' not found`);
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

  getSiqsService(): ISiqsService {
    return this.get<ISiqsService>('siqsService');
  }

  getGeocodingService(): IGeocodingService {
    return this.get<IGeocodingService>('geocodingService');
  }

  getCacheService(): ICacheService {
    return this.get<ICacheService>('cacheService');
  }

  // Method to reinitialize services when configuration changes
  reinitialize(): void {
    console.log('Reinitializing services...');
    this.services.clear();
    this.initializeServices();
  }

  // Method to override a service (useful for testing)
  override<T>(serviceKey: string, service: T): void {
    console.log(`Overriding service: ${serviceKey}`);
    this.services.set(serviceKey, service);
  }

  // Health check method
  healthCheck(): { [key: string]: boolean } {
    const health: { [key: string]: boolean } = {};
    
    const serviceKeys = [
      'userService', 'astroSpotService', 'reservationService', 'messagingService',
      'weatherService', 'mapService', 'siqsService', 'geocodingService', 'cacheService'
    ];
    
    serviceKeys.forEach(key => {
      health[key] = this.services.has(key);
    });
    
    return health;
  }
}

// Convenience function for getting the service container
export const getServices = () => ServiceContainer.getInstance();
