/**
 * Star Pattern Caching System
 * Caches detected star patterns to avoid recomputation and improve performance
 */
export interface CachedStarPattern {
  id: string;
  x: number;
  y: number;
  brightness: number;
  pattern: 'point' | 'newtonian' | 'jwst' | 'complex';
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  hash: string; // Hash of the star region for validation
  timestamp: number;
}

export class StarPatternCache {
  private static instance: StarPatternCache;
  private cache: Map<string, CachedStarPattern[]> = new Map();
  private readonly MAX_CACHE_SIZE = 50; // Maximum number of cached image analyses
  private readonly CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

  static getInstance(): StarPatternCache {
    if (!StarPatternCache.instance) {
      StarPatternCache.instance = new StarPatternCache();
    }
    return StarPatternCache.instance;
  }

  /**
   * Generate a cache key for an image
   */
  private generateImageKey(imageData: ImageData, profile: any): string {
    // Create a hash based on image dimensions and a sample of pixels
    const { width, height, data } = imageData;
    const sampleStep = Math.max(1, Math.floor(data.length / 1000)); // Sample ~1000 pixels
    
    let hash = `${width}x${height}`;
    for (let i = 0; i < data.length; i += sampleStep * 4) {
      hash += `${data[i]}${data[i + 1]}${data[i + 2]}`;
    }
    
    // Include profile parameters that affect detection
    hash += `_${profile.maxStarsToProcess}_${profile.spikeDetectionSensitivity}`;
    
    return this.simpleHash(hash);
  }

  /**
   * Simple string hashing function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Generate hash for a star region to validate cache validity
   */
  private generateStarHash(imageData: ImageData, x: number, y: number, width: number, height: number): string {
    const { data, width: imgWidth } = imageData;
    let hash = '';
    
    const endX = Math.min(x + width, imgWidth);
    const endY = Math.min(y + height, imageData.height);
    
    // Sample the star region
    for (let py = y; py < endY; py += 2) {
      for (let px = x; px < endX; px += 2) {
        const idx = (py * imgWidth + px) * 4;
        if (idx < data.length) {
          hash += `${data[idx]}${data[idx + 1]}${data[idx + 2]}`;
        }
      }
    }
    
    return this.simpleHash(hash);
  }

  /**
   * Get cached star patterns if available and valid
   */
  getCachedPatterns(imageData: ImageData, profile: any): CachedStarPattern[] | null {
    const key = this.generateImageKey(imageData, profile);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    const now = Date.now();
    if (now - cached[0]?.timestamp > this.CACHE_EXPIRY_MS) {
      this.cache.delete(key);
      return null;
    }

    // Validate a few star regions to ensure image hasn't changed
    let validationCount = 0;
    for (const star of cached.slice(0, 3)) { // Validate first 3 stars
      const currentHash = this.generateStarHash(
        imageData, 
        star.boundingBox.x, 
        star.boundingBox.y, 
        star.boundingBox.width, 
        star.boundingBox.height
      );
      
      if (currentHash === star.hash) {
        validationCount++;
      }
    }

    // If most validations pass, consider cache valid
    const validationThreshold = Math.min(3, cached.length);
    if (validationCount >= validationThreshold * 0.7) {
      console.log(`🎯 Cache hit: Using cached ${cached.length} star patterns`);
      return cached;
    } else {
      // Cache invalid, remove it
      this.cache.delete(key);
      return null;
    }
  }

  /**
   * Cache detected star patterns
   */
  cachePatterns(imageData: ImageData, profile: any, patterns: any[]): void {
    const key = this.generateImageKey(imageData, profile);
    const timestamp = Date.now();
    
    const cachedPatterns: CachedStarPattern[] = patterns.map(pattern => ({
      id: `${pattern.x}_${pattern.y}`,
      x: pattern.x,
      y: pattern.y,
      brightness: pattern.brightness,
      pattern: pattern.pattern,
      boundingBox: pattern.boundingBox,
      hash: this.generateStarHash(
        imageData,
        pattern.boundingBox.x,
        pattern.boundingBox.y,
        pattern.boundingBox.width,
        pattern.boundingBox.height
      ),
      timestamp
    }));

    this.cache.set(key, cachedPatterns);
    
    // Cleanup old cache entries if we exceed max size
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      this.cleanup();
    }

    console.log(`💾 Cached ${cachedPatterns.length} star patterns for future use`);
  }

  /**
   * Convert cached patterns back to original format
   */
  convertCachedPatterns(cached: CachedStarPattern[]): any[] {
    return cached.map(pattern => ({
      x: pattern.x,
      y: pattern.y,
      brightness: pattern.brightness,
      pattern: pattern.pattern,
      boundingBox: pattern.boundingBox
    }));
  }

  /**
   * Clean up expired and excess cache entries
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => (a[1][0]?.timestamp || 0) - (b[1][0]?.timestamp || 0));
    
    // Remove expired entries and excess entries
    let removedCount = 0;
    for (const [key, patterns] of entries) {
      const isExpired = now - (patterns[0]?.timestamp || 0) > this.CACHE_EXPIRY_MS;
      const shouldRemoveForSize = this.cache.size > this.MAX_CACHE_SIZE;
      
      if (isExpired || shouldRemoveForSize) {
        this.cache.delete(key);
        removedCount++;
        
        if (!shouldRemoveForSize) break; // Only remove expired if not over size limit
      }
    }
    
    if (removedCount > 0) {
      console.log(`🗑️ Cleaned up ${removedCount} cached star pattern entries`);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    console.log('🗑️ Star pattern cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): { 
    entries: number; 
    totalPatterns: number; 
    averagePatternsPerEntry: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    let totalPatterns = 0;
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;
    
    for (const patterns of this.cache.values()) {
      totalPatterns += patterns.length;
      const timestamp = patterns[0]?.timestamp || 0;
      oldestTimestamp = Math.min(oldestTimestamp, timestamp);
      newestTimestamp = Math.max(newestTimestamp, timestamp);
    }
    
    return {
      entries: this.cache.size,
      totalPatterns,
      averagePatternsPerEntry: this.cache.size > 0 ? totalPatterns / this.cache.size : 0,
      oldestEntry: oldestTimestamp,
      newestEntry: newestTimestamp
    };
  }
}