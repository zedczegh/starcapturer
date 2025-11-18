/**
 * Enhanced Data Integration Service
 * Uses population density and geographic analysis for maximum accuracy
 */

export { getPopulationBasedBortle, getRemoteAreaBortle } from './populationDensityService';
export { 
  getSatelliteBasedBortleScale, 
  type SatelliteDataResult 
} from './satelliteAggregator';
