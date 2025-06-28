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

export interface AppConfig {
  database: DatabaseConfig;
  weather: WeatherConfig;
  map: MapConfig;
}

// Default configuration - easily changeable for different environments
export const defaultConfig: AppConfig = {
  database: {
    provider: 'supabase',
    url: process.env.SUPABASE_URL || '',
    apiKey: process.env.SUPABASE_ANON_KEY || ''
  },
  weather: {
    provider: 'openmeteo',
    baseUrl: 'https://api.open-meteo.com'
  },
  map: {
    provider: 'gaode' // Changed to test Gaode Maps
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
}
