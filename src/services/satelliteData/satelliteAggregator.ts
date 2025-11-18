/**
 * Satellite Data Aggregator
 * Combines multiple satellite sources with intelligent weighting
 */

import { BortleDataSource, fuseBortleScales, filterOutliers } from "@/utils/bortleCalculation/dataFusion";
import { fetchVIIRSData, fetchWorldAtlasData } from "./viirsService";
import { fetchGlobalRadianceData } from "./globalRadianceService";

export interface SatelliteDataResult {
  bortleScale: number;
  confidence: number;
  sources: string[];
  radianceValue?: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  metadata?: Record<string, any>;
}

/**
 * Aggregate satellite data from multiple sources
 * Returns the best possible Bortle scale estimate from satellite data
 */
export async function getSatelliteBasedBortleScale(
  latitude: number,
  longitude: number
): Promise<SatelliteDataResult | null> {
  const satelliteSources: BortleDataSource[] = [];
  
  // Fetch from all available satellite sources in parallel
  const [viirsData, worldAtlasData, globalRadianceData] = await Promise.allSettled([
    fetchVIIRSData(latitude, longitude),
    fetchWorldAtlasData(latitude, longitude),
    fetchGlobalRadianceData(latitude, longitude)
  ]);
  
  // Collect successful results
  if (viirsData.status === 'fulfilled' && viirsData.value) {
    satelliteSources.push(viirsData.value);
  }
  
  if (worldAtlasData.status === 'fulfilled' && worldAtlasData.value) {
    satelliteSources.push(worldAtlasData.value);
  }
  
  if (globalRadianceData.status === 'fulfilled' && globalRadianceData.value) {
    satelliteSources.push(globalRadianceData.value);
  }
  
  // If we have no satellite data, return null
  if (satelliteSources.length === 0) {
    console.log('No satellite data available for this location');
    return null;
  }
  
  console.log(`Collected ${satelliteSources.length} satellite data sources`);
  
  // Filter outliers if we have multiple sources
  const filteredSources = satelliteSources.length >= 2
    ? filterOutliers(satelliteSources, 3.0)
    : satelliteSources;
  
  // Fuse the satellite data
  const fusedResult = fuseBortleScales(filteredSources, {
    useTemporalDecay: true,
    minConfidence: 0.7 // Higher minimum for satellite data
  });
  
  if (!fusedResult) {
    return null;
  }
  
  // Determine data quality based on confidence and number of sources
  let dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  if (fusedResult.confidence >= 0.9 && satelliteSources.length >= 2) {
    dataQuality = 'excellent';
  } else if (fusedResult.confidence >= 0.8) {
    dataQuality = 'good';
  } else if (fusedResult.confidence >= 0.7) {
    dataQuality = 'fair';
  } else {
    dataQuality = 'poor';
  }
  
  // Extract metadata from sources
  const metadata: Record<string, any> = {
    sourceCount: satelliteSources.length,
    filteredSourceCount: filteredSources.length,
    timestamp: new Date().toISOString()
  };
  
  // Include radiance if available from VIIRS
  const viirsSource = satelliteSources.find(s => s.source === 'viirs_satellite');
  if (viirsSource?.metadata?.radiance) {
    metadata.radiance = viirsSource.metadata.radiance;
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
