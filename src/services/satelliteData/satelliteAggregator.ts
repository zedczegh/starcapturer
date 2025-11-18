/**
 * Satellite Data Aggregator
 * Combines multiple data sources with intelligent weighting
 * Uses population density as primary method with fallbacks
 */

import { BortleDataSource, fuseBortleScales, filterOutliers } from "@/utils/bortleCalculation/dataFusion";
import { getPopulationBasedBortle, getRemoteAreaBortle } from "./populationDensityService";

export interface SatelliteDataResult {
  bortleScale: number;
  confidence: number;
  sources: string[];
  radianceValue?: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  metadata?: Record<string, any>;
}

/**
 * Aggregate data from multiple sources with population density as primary
 * Returns the best possible Bortle scale estimate
 */
export async function getSatelliteBasedBortleScale(
  latitude: number,
  longitude: number,
  locationName?: string
): Promise<SatelliteDataResult | null> {
  const dataSources: BortleDataSource[] = [];
  
  // Primary: Population density-based calculation (most reliable)
  try {
    const populationBortle = await getPopulationBasedBortle(latitude, longitude);
    if (populationBortle) {
      dataSources.push(populationBortle);
      console.log(`Population-based data: Bortle ${populationBortle.bortleScale} (${(populationBortle.confidence * 100).toFixed(0)}% confidence)`);
    }
  } catch (error) {
    console.warn('Population-based calculation failed:', error);
  }
  
  // Fallback: Remote area estimation
  if (dataSources.length === 0) {
    const remoteEstimate = getRemoteAreaBortle(latitude, longitude, locationName);
    dataSources.push(remoteEstimate);
    console.log(`Using remote area estimation: Bortle ${remoteEstimate.bortleScale}`);
  }
  
  // If we still have no data, return null
  if (dataSources.length === 0) {
    console.log('No data sources available for this location');
    return null;
  }
  
  console.log(`Collected ${dataSources.length} data sources`);
  
  // Filter outliers if we have multiple sources
  const filteredSources = dataSources.length >= 2
    ? filterOutliers(dataSources, 3.0)
    : dataSources;
  
  // Fuse the data
  const fusedResult = fuseBortleScales(filteredSources, {
    useTemporalDecay: true,
    minConfidence: 0.7 // Higher minimum for satellite data
  });
  
  if (!fusedResult) {
    return null;
  }
  
  // Determine data quality based on confidence and number of sources
  let dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  if (fusedResult.confidence >= 0.85 && dataSources.length >= 2) {
    dataQuality = 'excellent';
  } else if (fusedResult.confidence >= 0.75) {
    dataQuality = 'good';
  } else if (fusedResult.confidence >= 0.60) {
    dataQuality = 'fair';
  } else {
    dataQuality = 'poor';
  }
  
  // Extract metadata from sources
  const metadata: Record<string, any> = {
    sourceCount: dataSources.length,
    filteredSourceCount: filteredSources.length,
    timestamp: new Date().toISOString()
  };
  
  // Include population data if available
  const popSource = dataSources.find(s => s.source === 'population_density');
  if (popSource?.metadata) {
    metadata.nearestCity = popSource.metadata.nearestCity;
    metadata.distance = popSource.metadata.distance;
  }
  
  return {
    bortleScale: fusedResult.bortleScale,
    confidence: fusedResult.confidence,
    sources: fusedResult.sources,
    radianceValue: metadata.radiance,
    dataQuality,
    metadata
  };
}

/**
 * Validate satellite data against known calibration points
 * Used for quality assurance
 */
export function validateSatelliteData(
  satelliteResult: SatelliteDataResult,
  groundTruthBortle?: number
): { isValid: boolean; discrepancy?: number; notes?: string } {
  if (!groundTruthBortle) {
    return { isValid: true };
  }
  
  const discrepancy = Math.abs(satelliteResult.bortleScale - groundTruthBortle);
  
  // Acceptable discrepancy based on confidence
  const threshold = satelliteResult.confidence >= 0.9 ? 0.5 : 1.0;
  
  return {
    isValid: discrepancy <= threshold,
    discrepancy,
    notes: discrepancy > threshold 
      ? `Satellite data differs from ground truth by ${discrepancy.toFixed(1)} Bortle classes`
      : 'Satellite data validated successfully'
  };
}
