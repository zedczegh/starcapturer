
/**
 * Batch processing utilities for SIQS calculations
 */
import { SiqsResult } from './siqsTypes';
import { isSiqsGreaterThan } from '@/utils/siqsHelpers';

/**
 * Filter and sort SIQS results based on score threshold
 */
export function filterAndSortSiqsResults(
  results: SiqsResult[],
  threshold: number = 0
): SiqsResult[] {
  // Filter by threshold
  const filtered = results.filter(result => 
    result && isSiqsGreaterThan(result.siqs, threshold)
  );
  
  // Sort by score (highest first)
  return filtered.sort((a, b) => b.siqs - a.siqs);
}

/**
 * Group SIQS results by quality tier
 */
export function groupSiqsResultsByTier(results: SiqsResult[]): {
  excellent: SiqsResult[];
  good: SiqsResult[];
  fair: SiqsResult[];
  poor: SiqsResult[];
} {
  return {
    excellent: results.filter(r => r.siqs >= 8),
    good: results.filter(r => r.siqs >= 5 && r.siqs < 8),
    fair: results.filter(r => r.siqs >= 3 && r.siqs < 5),
    poor: results.filter(r => r.siqs > 0 && r.siqs < 3)
  };
}

/**
 * Create summary statistics for a batch of SIQS results
 */
export function createSiqsResultsSummary(results: SiqsResult[]): {
  count: number;
  averageScore: number;
  viableCount: number;
  viablePercent: number;
  highestScore: number;
  lowestScore: number;
} {
  if (!results || results.length === 0) {
    return {
      count: 0,
      averageScore: 0,
      viableCount: 0,
      viablePercent: 0,
      highestScore: 0,
      lowestScore: 0
    };
  }
  
  const validResults = results.filter(r => r && typeof r.siqs === 'number');
  
  if (validResults.length === 0) {
    return {
      count: 0,
      averageScore: 0,
      viableCount: 0,
      viablePercent: 0,
      highestScore: 0,
      lowestScore: 0
    };
  }
  
  const count = validResults.length;
  const sum = validResults.reduce((acc, r) => acc + r.siqs, 0);
  const viableCount = validResults.filter(r => r.isViable).length;
  const scores = validResults.map(r => r.siqs);
  
  return {
    count,
    averageScore: sum / count,
    viableCount,
    viablePercent: (viableCount / count) * 100,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores)
  };
}
