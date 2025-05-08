
import React from 'react';
import { 
  Star, 
  CloudSun, 
  Moon, 
  Smile, 
  Frown, 
  Triangle,
  MapPin,
  Globe,
  Compass,
  Cloud,
  Navigation,
  Sun,
  Route,
  Building,
  Landmark
} from "lucide-react";

export interface SiqsEmoji {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

export const siqsEmojis: SiqsEmoji[] = [
  {
    id: "stellar-star",
    name: "Stellar Star",
    icon: <Star className="h-6 w-6 text-green-400 fill-green-300" />,
    description: "Excellent SIQS conditions"
  },
  {
    id: "happy-moon",
    name: "Happy Moon",
    icon: <Moon className="h-6 w-6 text-blue-400 fill-blue-200" />,
    description: "Good SIQS conditions"
  },
  {
    id: "curious-cloud",
    name: "Curious Cloud",
    icon: <CloudSun className="h-6 w-6 text-yellow-500 fill-yellow-100" />,
    description: "Above average SIQS conditions"
  },
  {
    id: "content-observer",
    name: "Content Observer",
    icon: <Smile className="h-6 w-6 text-orange-400 fill-orange-100" />,
    description: "Average SIQS conditions"
  },
  {
    id: "worried-weather",
    name: "Worried Weather",
    icon: <Frown className="h-6 w-6 text-orange-600 fill-orange-200" />,
    description: "Poor SIQS conditions"
  },
  {
    id: "sad-satellite",
    name: "Sad Satellite",
    icon: <Triangle className="h-6 w-6 text-red-500 fill-red-200" />,
    description: "Bad SIQS conditions"
  },
  // New location-related emojis
  {
    id: "location-pin",
    name: "Location Pin",
    icon: <MapPin className="h-6 w-6 text-red-500 fill-red-100" />,
    description: "Current location"
  },
  {
    id: "earth-globe",
    name: "Earth Globe",
    icon: <Globe className="h-6 w-6 text-blue-500 fill-blue-100" />,
    description: "Global view"
  },
  {
    id: "astro-compass",
    name: "Astro Compass",
    icon: <Compass className="h-6 w-6 text-indigo-500 fill-indigo-100" />,
    description: "Navigation tool"
  },
  {
    id: "clear-night",
    name: "Clear Night",
    icon: <Moon className="h-6 w-6 text-purple-500 fill-purple-200" />,
    description: "Perfect viewing conditions"
  },
  {
    id: "cloudy-sky",
    name: "Cloudy Sky",
    icon: <Cloud className="h-6 w-6 text-gray-500 fill-gray-200" />,
    description: "Cloudy conditions"
  },
  {
    id: "navigation-point",
    name: "Navigation Point",
    icon: <Navigation className="h-6 w-6 text-green-600 fill-green-100" />,
    description: "Direction indicator"
  },
  {
    id: "bright-sun",
    name: "Bright Sun",
    icon: <Sun className="h-6 w-6 text-yellow-500 fill-yellow-300" />,
    description: "Daytime viewing"
  },
  {
    id: "stargazing-route",
    name: "Stargazing Route",
    icon: <Route className="h-6 w-6 text-purple-600 fill-purple-100" />,
    description: "Path to good viewing"
  },
  {
    id: "observatory",
    name: "Observatory",
    icon: <Building className="h-6 w-6 text-blue-600 fill-blue-100" />,
    description: "Observation facility"
  },
  {
    id: "dark-site",
    name: "Dark Site",
    icon: <Landmark className="h-6 w-6 text-indigo-600 fill-indigo-100" />,
    description: "Official dark sky site"
  }
];
