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
  private currentLanguage: string = 'en';
  private eventListenerAdded: boolean = false;

  private constructor() {
    // Initialize current language from localStorage first
    this.initializeCurrentLanguage();
    this.initializeServices();
    this.setupLanguageListener();
  }

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  private initializeCurrentLanguage(): void {
    if (typeof window === 'undefined') return;
    
    const storedLanguage = localStorage.getItem('app-language-preference');
    if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'zh')) {
      this.currentLanguage = storedLanguage;
      console.log(`Initialized with stored language: ${this.currentLanguage}`);
    }
  }

  private setupLanguageListener(): void {
    if (typeof window === 'undefined' || this.eventListenerAdded) return;
    
    // Listen for language changes to automatically switch map service
    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newLanguage = customEvent.detail?.language;
      if (newLanguage && newLanguage !== this.currentLanguage) {
        console.log(`Language changed from ${this.currentLanguage} to ${newLanguage}, updating map service`);
        this.currentLanguage = newLanguage;
        this.updateMapServiceForLanguage(newLanguage);
        
        // Dispatch a service update event so components can refresh
        window.dispatchEvent(new CustomEvent('service-updated', { 
          detail: { service: 'mapService', language: newLanguage } 
        }));
      }
    };

    window.addEventListener('language-changed', handleLanguageChange);
    this.eventListenerAdded = true;
  }

  private updateMapServiceForLanguage(language: string): void {
    // Switch to Gaode maps for Chinese users, default for others
    const newMapService = language === 'zh' ? new GaodeMapService() : new DefaultMapService();
    this.services.set('mapService', newMapService);
    
    console.log(`Map service switched to: ${newMapService.getProvider()} for language: ${language}`);
  }

  private initializeServices(): void {
    try {
      const config = this.configManager.getConfig();

      // Initialize database services
      this.initializeDatabaseServices(config.database.provider);
      
      // Initialize weather services
      this.initializeWeatherServices(config.weather.provider);
      
      // Initialize map services with language-aware logic
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
    // Auto-detect based on current language if provider is 'gaode' or language-based switching is needed
    if (this.currentLanguage === 'zh') {
      console.log('Initializing Gaode maps for Chinese language');
      this.services.set('mapService', new GaodeMapService());
    } else {
      switch (provider) {
        case 'leaflet':
          this.services.set('mapService', new DefaultMapService());
          break;
        case 'gaode':
          // Only use Gaode if explicitly configured or if Chinese language
          this.services.set('mapService', new GaodeMapService());
          break;
        default:
          console.log('Using default map service for English language');
          this.services.set('mapService', new DefaultMapService());
      }
    }
  }

  private initializeFallbackServices(): void {
    console.warn('Initializing fallback services due to configuration error');
    
    // Fallback database services
    this.services.set('userService', new SupabaseUserService());
    this.services.set('astroSpotService', new SupabaseAstroSpotService());
    this.services.set('reservationService', new SupabaseReservationService());
    this.services.set('messagingService', new SupabaseMessagingService());
    
    // Fallback other services with language awareness
    this.services.set('weatherService', new OpenMeteoWeatherService());
    this.services.set('mapService', this.currentLanguage === 'zh' ? new GaodeMapService() : new DefaultMapService());
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

  // Method to manually switch map service based on language
  switchMapServiceForLanguage(language: string): void {
    this.updateMapServiceForLanguage(language);
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

  // Get current language for debugging
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }
}

// Convenience function for getting the service container
export const getServices = () => ServiceContainer.getInstance();
