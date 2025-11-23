import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type MapProvider = 'leaflet' | 'amap';

interface MapProviderContextType {
  provider: MapProvider;
  setProvider: (provider: MapProvider) => void;
  isAMapReady: boolean;
}

const MapProviderContext = createContext<MapProviderContextType | undefined>(undefined);

const MAP_PROVIDER_KEY = 'map_provider_preference';

export const MapProviderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [provider, setProviderState] = useState<MapProvider>(() => {
    // Load from localStorage or default based on location
    const stored = localStorage.getItem(MAP_PROVIDER_KEY);
    if (stored) {
      return (stored === 'amap' ? 'amap' : 'leaflet') as MapProvider;
    }
    // Auto-detect will happen in useEffect
    return 'leaflet';
  });
  
  const [isAMapReady, setIsAMapReady] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);

  // Auto-detect location and set provider on first load
  useEffect(() => {
    const stored = localStorage.getItem(MAP_PROVIDER_KEY);
    if (stored || autoDetected) return; // Skip if user has manually set preference or already detected

    // Try to get user location and auto-detect
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Import the isInChina function
          const { isInChina } = await import('@/utils/chinaBortleData');
          const inChina = isInChina(latitude, longitude);
          
          const autoProvider: MapProvider = inChina ? 'amap' : 'leaflet';
          setProviderState(autoProvider);
          setAutoDetected(true);
          console.log(`Auto-detected location: ${inChina ? 'China' : 'Outside China'}, using ${autoProvider}`);
        },
        (error) => {
          console.log('Geolocation permission denied or unavailable, defaulting to leaflet');
          setAutoDetected(true);
        }
      );
    } else {
      setAutoDetected(true);
    }
  }, [autoDetected]);

  // Persist to localStorage when changed
  const setProvider = (newProvider: MapProvider) => {
    setProviderState(newProvider);
    localStorage.setItem(MAP_PROVIDER_KEY, newProvider);
    console.log(`Map provider switched to: ${newProvider}`);
  };

  // Pre-load AMap script if selected
  useEffect(() => {
    if (provider === 'amap') {
      // Fetch AMap key from edge function
      const loadAMap = async () => {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          
          const { data, error } = await supabase.functions.invoke('get-amap-key');

          if (error || !data?.hasKey) {
            console.error('Failed to get AMap key:', error);
            setProvider('leaflet');
            return;
          }

          const AMapLoader = await import('@amap/amap-jsapi-loader');
          await AMapLoader.default.load({
            key: data.key,
            version: '2.0',
            plugins: ['AMap.Marker', 'AMap.InfoWindow', 'AMap.Scale', 'AMap.ToolBar']
          });
          
          setIsAMapReady(true);
          console.log('AMap loaded successfully');
        } catch (error) {
          console.error('Failed to load AMap:', error);
          setProvider('leaflet');
        }
      };

      loadAMap();
    } else {
      setIsAMapReady(false);
    }
  }, [provider]);

  return (
    <MapProviderContext.Provider value={{ provider, setProvider, isAMapReady }}>
      {children}
    </MapProviderContext.Provider>
  );
};

export const useMapProvider = () => {
  const context = useContext(MapProviderContext);
  if (!context) {
    throw new Error('useMapProvider must be used within MapProviderProvider');
  }
  return context;
};
