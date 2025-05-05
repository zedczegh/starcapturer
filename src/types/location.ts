
// Define the GeoLocation type used in RecommendationsSection and other components
export interface GeoLocation {
  latitude: number;
  longitude: number;
  name?: string;
  formattedName?: string;
  placeDetails?: string;
}

// Define the LocationDetailsMainProps interface for the LocationDetailsMain component
export interface LocationDetailsMainProps {
  locationData: {
    latitude: number;
    longitude: number;
    name?: string;
    timestamp?: string;
    [key: string]: any;
  };
  setLocationData: (data: any) => void;
  statusMessage: string | null;
  messageType?: 'success' | 'error' | 'info' | 'warning';
  setStatusMessage: (message: string | null) => void;
  handleUpdateLocation: (location: { name: string; latitude: number; longitude: number }) => Promise<void>;
}

// Define props for the LocationDetailsHeader component
export interface LocationDetailsHeaderProps {
  name: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
}
