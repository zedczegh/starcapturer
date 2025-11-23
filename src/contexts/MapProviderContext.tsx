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
    // Load from localStorage or default to leaflet
    const stored = localStorage.getItem(MAP_PROVIDER_KEY);
    return (stored === 'amap' ? 'amap' : 'leaflet') as MapProvider;
  });
  
  const [isAMapReady, setIsAMapReady] = useState(false);

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
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            console.error('No session found, cannot load AMap');
            setProvider('leaflet');
            return;
          }

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
          // Fallback to Leaflet if AMap fails
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
