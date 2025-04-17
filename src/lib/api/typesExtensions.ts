
import { SharedAstroSpot } from '@/lib/api/astroSpots';

// Extend the SharedAstroSpot interface to include metadata
declare module '@/lib/api/astroSpots' {
  interface SharedAstroSpot {
    metadata?: {
      astronomicalNight?: {
        start: string;
        end: string;
        formattedTime: string;
      };
      [key: string]: any;
    };
  }
}
