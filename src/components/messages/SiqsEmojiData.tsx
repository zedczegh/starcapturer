
import React from 'react';
import { Star, CloudSun, Moon, Smile, Frown, Triangle } from "lucide-react";

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
  }
];
