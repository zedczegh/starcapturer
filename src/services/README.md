
# Service Abstraction Layer

This directory contains the abstraction layer for external services, making it easy to migrate from current providers (Supabase, OpenMeteo) to other services in the future.

## Structure

- `interfaces/` - Service interface definitions
- `implementations/` - Current service implementations
- `config/` - Configuration management
- `ServiceContainer.ts` - Dependency injection container

## How to Use

### In React Components

```typescript
import { useServices } from '@/hooks/useServices';

function MyComponent() {
  const { weatherService, userService } = useServices();
  
  // Use the services without knowing the implementation
  const weather = await weatherService.getCurrentWeather(lat, lng);
  const user = await userService.getCurrentUser();
}
```

### Configuration Changes

```typescript
import { ConfigManager } from '@/services/config/AppConfig';

// Change weather provider
ConfigManager.getInstance().updateConfig({
  weather: {
    provider: 'weatherapi',
    apiKey: 'your-api-key'
  }
});
```

## Migration Benefits

1. **Easy Provider Switching** - Change configuration to switch providers
2. **Testing** - Mock services easily for unit tests
3. **Gradual Migration** - Migrate one service at a time
4. **No Breaking Changes** - Existing code continues to work

## Adding New Providers

1. Create new implementation in `implementations/`
2. Update `ServiceContainer.ts` to register the new service
3. Update configuration options in `AppConfig.ts`
4. No changes needed in existing components!

## Current Implementations

- **Database**: Supabase (ready for Firebase, custom backends)
- **Weather**: OpenMeteo (ready for WeatherAPI, AccuWeather)
- **Maps**: Default/Leaflet (ready for Mapbox, Google Maps)
