/**
 * Satellite Data Integration Service
 * Aggregates multiple satellite data sources for maximum accuracy
 */

export { fetchVIIRSData, fetchWorldAtlasData, skyQualityToBortle } from './viirsService';
export { fetchGlobalRadianceData } from './globalRadianceService';
export { 
  getSatelliteBasedBortleScale, 
  type SatelliteDataResult 
} from './satelliteAggregator';
