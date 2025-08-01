
export interface DatabaseConfig {
  provider: 'supabase' | 'firebase' | 'custom';
  url: string;
  apiKey: string;
}

export interface WeatherConfig {
  provider: 'openmeteo' | 'weatherapi' | 'custom';
  apiKey?: string;
  baseUrl?: string;
}

export interface MapConfig {
  provider: 'leaflet' | 'mapbox' | 'google' | 'gaode';
  apiKey?: string;
  baseUrl?: string;
}

export interface SiqsConfig {
  provider: 'default' | 'custom';
  apiKey?: string;
  baseUrl?: string;
}

export interface GeocodingConfig {
  provider: 'default' | 'mapbox' | 'google' | 'custom';
  apiKey?: string;
  baseUrl?: string;
}

export interface CacheConfig {
  provider: 'default' | 'redis' | 'custom';
  url?: string;
  ttl?: number;
}

export interface AppConfig {
  database: DatabaseConfig;
  weather: WeatherConfig;
  map: MapConfig;
  siqs: SiqsConfig;
  geocoding: GeocodingConfig;
  cache: CacheConfig;
}

// Default configuration - easily changeable for different environments
export const defaultConfig: AppConfig = {
  database: {
    provider: 'supabase',
    url: 'https://fmnivvwpyriufxaebbzi.supabase.co',
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbml2dndweXJpdWZ4YWViYnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3ODU3NTAsImV4cCI6MjA2MDM2MTc1MH0.HZX_hS0A1nUB3iO7wDmTjMBoYk3hQz6lqmyBEYvoQ9Y'
  },
  weather: {
    provider: 'openmeteo',
    baseUrl: 'https://api.open-meteo.com'
  },
  map: {
    provider: 'gaode',
    // Note: Gaode API key should be moved to environment variables in production
    apiKey: undefined // Remove hardcoded key for security
  },
  siqs: {
    provider: 'default'
  },
  geocoding: {
    provider: 'default'
  },
  cache: {
    provider: 'default',
    ttl: 300000 // 5 minutes default TTL
  }
};

export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    this.config = { ...defaultConfig };
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  getConfig(): AppConfig {
    return this.config;
  }

  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getDatabaseConfig(): DatabaseConfig {
    return this.config.database;
  }

  getWeatherConfig(): WeatherConfig {
    return this.config.weather;
  }

  getMapConfig(): MapConfig {
    return this.config.map;
  }

  getSiqsConfig(): SiqsConfig {
    return this.config.siqs;
  }

  getGeocodingConfig(): GeocodingConfig {
    return this.config.geocoding;
  }

  getCacheConfig(): CacheConfig {
    return this.config.cache;
  }
}
