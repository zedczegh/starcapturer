
/**
 * Optimized cache for SIQS calculation results 
 */

import { SiqsCalculationResult } from '../types';

// LRU cache for calculation results
export class SiqsCache {
  private cache = new Map<string, {result: SiqsCalculationResult, timestamp: number}>();
  private maxSize = 100;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  
  getCached(key: string): SiqsCalculationResult | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.result;
  }
  
  setCached(key: string, result: SiqsCalculationResult): void {
    // Clear old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }
  
  clearCache(): void {
    this.cache.clear();
  }
}

// Global cache instance
export const siqsCalculationCache = new SiqsCache();
