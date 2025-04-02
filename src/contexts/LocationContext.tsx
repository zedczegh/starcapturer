
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LocationContextProps {
  bortleScale: number;
  seeingConditions: number;
  moonPhase: number;
  updateLocationData: (data: Partial<LocationWithWeather>) => void;
  locationData: LocationWithWeather | null;
}

const defaultContext: LocationContextProps = {
  bortleScale: 4,
  seeingConditions: 3,
  moonPhase: 0.5,
  updateLocationData: () => {},
  locationData: null
};

const LocationContext = createContext<LocationContextProps>(defaultContext);

export const useLocation = () => useContext(LocationContext);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [locationData, setLocationData] = useState<LocationWithWeather | null>(null);
  const [bortleScale, setBortleScale] = useState<number>(4);
  const [seeingConditions, setSeeingConditions] = useState<number>(3);
  const [moonPhase, setMoonPhase] = useState<number>(0.5);

  const updateLocationData = (data: Partial<LocationWithWeather>) => {
    setLocationData(prev => {
      if (!prev) return data as LocationWithWeather;
      return { ...prev, ...data };
    });

    if (data.bortleScale) setBortleScale(data.bortleScale);
    if (data.seeingConditions) setSeeingConditions(data.seeingConditions);
    if (data.moonPhase) setMoonPhase(data.moonPhase);
  };

  return (
    <LocationContext.Provider
      value={{
        bortleScale,
        seeingConditions,
        moonPhase,
        updateLocationData,
        locationData
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};
