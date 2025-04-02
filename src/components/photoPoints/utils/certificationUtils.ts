
import React from 'react';
import { Award, Globe, ShieldCheck, Trees } from 'lucide-react';

/**
 * Custom hook to determine certification info for display
 */
export function useCertificationInfo(certification: string | undefined, isDarkSkyReserve: boolean | undefined) {
  if (isDarkSkyReserve) {
    return {
      text: "Dark Sky Reserve",
      color: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      icon: <Globe className="h-3 w-3 mr-1 text-blue-400" />
    };
  }
  
  if (!certification) return null;
  
  if (certification.includes("IDA")) {
    return {
      text: "IDA Certified",
      color: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      icon: <ShieldCheck className="h-3 w-3 mr-1 text-blue-400" />
    };
  }
  
  if (certification.includes("Nature")) {
    return {
      text: "Nature Reserve",
      color: "bg-green-500/20 text-green-300 border-green-500/40",
      icon: <Trees className="h-3 w-3 mr-1 text-green-400" />
    };
  }
  
  if (certification.includes("Park")) {
    return {
      text: "National Park",
      color: "bg-green-500/20 text-green-300 border-green-500/40",
      icon: <Trees className="h-3 w-3 mr-1 text-green-400" />
    };
  }
  
  if (certification.includes("Certified")) {
    return {
      text: "Certified Site",
      color: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      icon: <Award className="h-3 w-3 mr-1 text-purple-400" />
    };
  }
  
  return null;
}
