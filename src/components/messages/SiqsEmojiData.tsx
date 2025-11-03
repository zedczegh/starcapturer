
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
  category: "siqs" | "location"; // Added category for organization
}

export const siqsEmojis: SiqsEmoji[] = [
  // SIQS Condition Emojis - Enhanced with 3D effects
  {
    id: "stellar-star",
    name: "Stellar Star",
    icon: <Star className="h-6 w-6 text-yellow-400 fill-yellow-300 drop-shadow-[0_0_3px_rgba(250,204,21,0.7)]" />,
    description: "Excellent SIQS conditions",
    category: "siqs"
  },
  {
    id: "happy-moon",
    name: "Happy Moon",
    icon: <Moon className="h-6 w-6 text-blue-400 fill-blue-200 drop-shadow-[0_0_3px_rgba(96,165,250,0.7)]" />,
    description: "Good SIQS conditions",
    category: "siqs"
  },
  {
    id: "curious-cloud",
    name: "Curious Cloud",
    icon: <CloudSun className="h-6 w-6 text-yellow-500 fill-yellow-100 drop-shadow-[0_0_3px_rgba(234,179,8,0.7)]" />,
    description: "Above average SIQS conditions",
    category: "siqs"
  },
  {
    id: "content-observer",
    name: "Content Observer",
    icon: <Smile className="h-6 w-6 text-orange-400 fill-orange-100 drop-shadow-[0_0_3px_rgba(251,146,60,0.7)]" />,
    description: "Average SIQS conditions",
    category: "siqs"
  },
  {
    id: "worried-weather",
    name: "Worried Weather",
    icon: <Frown className="h-6 w-6 text-orange-600 fill-orange-200 drop-shadow-[0_0_3px_rgba(234,88,12,0.7)]" />,
    description: "Poor SIQS conditions",
    category: "siqs"
  },
  {
    id: "sad-satellite",
    name: "Sad Satellite",
    icon: <Triangle className="h-6 w-6 text-red-500 fill-red-200 drop-shadow-[0_0_3px_rgba(239,68,68,0.7)]" />,
    description: "Bad SIQS conditions",
    category: "siqs"
  },
  
  // Location-related emojis - Enhanced with 3D effects
  {
    id: "location-pin",
    name: "Location Pin",
    icon: <MapPin className="h-6 w-6 text-red-500 fill-red-100 drop-shadow-[0_0_3px_rgba(239,68,68,0.7)] animate-pulse" />,
    description: "Current location",
    category: "location"
  },
  {
    id: "earth-globe",
    name: "Earth Globe",
    icon: <Globe className="h-6 w-6 text-blue-600 fill-blue-100 drop-shadow-[0_0_3px_rgba(37,99,235,0.7)] animate-spin-slow" />,
    description: "Global view",
    category: "location"
  },
  {
    id: "astro-compass",
    name: "Astro Compass",
    icon: <Compass className="h-6 w-6 text-indigo-600 fill-indigo-100 drop-shadow-[0_0_3px_rgba(79,70,229,0.7)]" />,
    description: "Navigation tool",
    category: "location"
  },
  {
    id: "clear-night",
    name: "Clear Night",
    icon: <Moon className="h-6 w-6 text-primary fill-primary/20 drop-shadow-[0_0_3px_hsl(var(--primary)/0.7)]" />,
    description: "Perfect viewing conditions",
    category: "location"
  },
  {
    id: "cloudy-sky",
    name: "Cloudy Sky",
    icon: <Cloud className="h-6 w-6 text-gray-500 fill-gray-200 drop-shadow-[0_0_3px_rgba(107,114,128,0.7)]" />,
    description: "Cloudy conditions",
    category: "location"
  },
  {
    id: "navigation-point",
    name: "Navigation Point",
    icon: <Navigation className="h-6 w-6 text-green-600 fill-green-100 drop-shadow-[0_0_3px_rgba(22,163,74,0.7)]" />,
    description: "Direction indicator",
    category: "location"
  },
  {
    id: "bright-sun",
    name: "Bright Sun",
    icon: <Sun className="h-6 w-6 text-amber-500 fill-amber-300 drop-shadow-[0_0_5px_rgba(245,158,11,0.9)]" />,
    description: "Daytime viewing",
    category: "location"
  },
  {
    id: "stargazing-route",
    name: "Stargazing Route",
    icon: <Route className="h-6 w-6 text-primary fill-primary/20 drop-shadow-[0_0_3px_hsl(var(--primary)/0.7)]" />,
    description: "Path to good viewing",
    category: "location"
  },
  {
    id: "observatory",
    name: "Observatory",
    icon: <Building className="h-6 w-6 text-blue-600 fill-blue-100 drop-shadow-[0_0_3px_rgba(37,99,235,0.7)]" />,
    description: "Observation facility",
    category: "location"
  },
  {
    id: "dark-site",
    name: "Dark Site",
    icon: <Landmark className="h-6 w-6 text-indigo-600 fill-indigo-100 drop-shadow-[0_0_3px_rgba(79,70,229,0.7)]" />,
    description: "Official dark sky site",
    category: "location"
  }
];
