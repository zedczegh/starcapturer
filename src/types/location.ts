
// Define the GeoLocation type used in RecommendationsSection and other components
export interface GeoLocation {
  latitude: number;
  longitude: number;
  name?: string;
  formattedName?: string;
  placeDetails?: string;
}

// LocationDetailsMainProps interface for the LocationDetailsMain component
export interface LocationDetailsMainProps {
  locationData: any;
  setLocationData: (data: any) => void;
  statusMessage: string | null;
  messageType: "info" | "error" | "success" | null;
  setStatusMessage: React.Dispatch<React.SetStateAction<string | null>>;
  handleUpdateLocation: (updatedData: any) => Promise<void>;
}

// Interface for LocationDetailsHeader component
export interface LocationDetailsHeaderProps {
  name: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
}

// Weather data synchronization result interface
export interface WeatherSyncResult {
  isValid: boolean;
  correctedData?: any;
  discrepancies?: string[];
}

// Enhanced location data with forecast information
export interface EnhancedLocationData {
  latitude: number;
  longitude: number;
  name: string;
  weatherData?: any;
  forecastData?: any;
  longRangeForecast?: any;
  weatherAlerts?: any[];
  refreshCount?: number;
  timestamp?: string;
}
