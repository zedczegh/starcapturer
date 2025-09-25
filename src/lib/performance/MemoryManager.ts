/**
 * Memory Management Utilities
 * Monitors and optimizes memory usage during image processing
 */
export class MemoryManager {
  private static readonly MEMORY_WARNING_THRESHOLD = 0.8; // 80% of available memory
  private static readonly MEMORY_CRITICAL_THRESHOLD = 0.9; // 90% of available memory
  
  private static resourceTracker = new Set<any>();
  private static memoryUsageHistory: number[] = [];
  private static readonly MAX_HISTORY_SIZE = 10;

  /**
   * Estimate current memory usage (when available)
   */
  static getCurrentMemoryUsage(): number {
    // @ts-ignore - performance.memory is not in all browsers
    if (typeof window !== 'undefined' && window.performance?.memory) {
      // @ts-ignore
      return window.performance.memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Get estimated memory limit (when available)
   */
  static getMemoryLimit(): number {
    // @ts-ignore - performance.memory is not in all browsers
    if (typeof window !== 'undefined' && window.performance?.memory) {
      // @ts-ignore
      return window.performance.memory.jsHeapSizeLimit;
    }
    return 2 * 1024 * 1024 * 1024; // Assume 2GB default
  }

  /**
   * Track memory usage over time
   */
  static trackMemoryUsage(): void {
    const current = this.getCurrentMemoryUsage();
    if (current > 0) {
      this.memoryUsageHistory.push(current);
      if (this.memoryUsageHistory.length > this.MAX_HISTORY_SIZE) {
        this.memoryUsageHistory.shift();
      }
    }
  }

  /**
   * Get memory usage statistics
   */
  static getMemoryStats(): {
    current: number;
    limit: number;
    percentage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    warning: boolean;
    critical: boolean;
  } {
    const current = this.getCurrentMemoryUsage();
    const limit = this.getMemoryLimit();
    const percentage = current / limit;
    
    // Calculate trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (this.memoryUsageHistory.length >= 3) {
      const recent = this.memoryUsageHistory.slice(-3);
      const isIncreasing = recent[2] > recent[1] && recent[1] > recent[0];
      const isDecreasing = recent[2] < recent[1] && recent[1] < recent[0];
      
      if (isIncreasing) trend = 'increasing';
      else if (isDecreasing) trend = 'decreasing';
    }
    
    return {
      current,
      limit,
      percentage,
      trend,
      warning: percentage > this.MEMORY_WARNING_THRESHOLD,
      critical: percentage > this.MEMORY_CRITICAL_THRESHOLD
    };
  }

  /**
   * Force garbage collection (when available)
   */
  static forceGarbageCollection(): void {
    // @ts-ignore - gc is not standard but available in some environments
    if (typeof window !== 'undefined' && window.gc) {
      // @ts-ignore
      window.gc();
    }
  }

  /**
   * Register a resource for tracking
   */
  static trackResource(resource: any): void {
    this.resourceTracker.add(resource);
  }

  /**
   * Unregister a resource
   */
  static untrackResource(resource: any): void {
    this.resourceTracker.delete(resource);
  }

  /**
   * Clear all tracked resources
   */
  static clearTrackedResources(): void {
    this.resourceTracker.clear();
  }

  /**
   * Get optimal processing parameters based on available memory
   */
  static getOptimalProcessingParams(imageWidth: number, imageHeight: number): {
    chunkSize: number;
    maxConcurrentOperations: number;
    shouldDownscale: boolean;
    recommendedScale: number;
  } {
    const stats = this.getMemoryStats();
    const totalPixels = imageWidth * imageHeight;
    const estimatedImageMemory = totalPixels * 16; // 4 bytes per channel * 4 channels
    
    let chunkSize = totalPixels;
    let maxConcurrentOperations = 1;
    let shouldDownscale = false;
    let recommendedScale = 1.0;
    
    if (stats.percentage > this.MEMORY_WARNING_THRESHOLD || estimatedImageMemory > stats.limit * 0.3) {
      // High memory usage, optimize aggressively
      chunkSize = Math.min(totalPixels, 512 * 512); // 512x512 chunks
      maxConcurrentOperations = 1;
      
      if (estimatedImageMemory > stats.limit * 0.5) {
        shouldDownscale = true;
        recommendedScale = Math.sqrt((stats.limit * 0.3) / estimatedImageMemory);
      }
    } else if (stats.percentage > 0.5) {
      // Moderate memory usage, moderate optimization
      chunkSize = Math.min(totalPixels, 1024 * 1024); // 1024x1024 chunks
      maxConcurrentOperations = 2;
    } else {
      // Low memory usage, minimal optimization
      chunkSize = Math.min(totalPixels, 2048 * 2048); // 2048x2048 chunks
      maxConcurrentOperations = 3;
    }
    
    return {
      chunkSize,
      maxConcurrentOperations,
      shouldDownscale,
      recommendedScale: Math.max(0.25, recommendedScale) // Never scale below 25%
    };
  }

  /**
   * Monitor memory during operation and suggest optimizations
   */
  static async monitorOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<{ result: T; memoryDelta: number; warnings: string[] }> {
    const startStats = this.getMemoryStats();
    const warnings: string[] = [];
    
    console.log(`🔍 Memory Monitor: Starting ${operationName} (${(startStats.current / 1024 / 1024).toFixed(1)}MB used)`);
    
    if (startStats.warning) {
      warnings.push(`High memory usage detected before ${operationName}`);
    }
    
    try {
      const result = await operation();
      
      // Wait a moment for garbage collection to potentially run
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const endStats = this.getMemoryStats();
      const memoryDelta = endStats.current - startStats.current;
      
      console.log(`📊 Memory Monitor: ${operationName} completed, delta: ${(memoryDelta / 1024 / 1024).toFixed(1)}MB`);
      
      if (endStats.critical) {
        warnings.push(`Critical memory usage after ${operationName} - consider reducing image size`);
      } else if (endStats.warning && !startStats.warning) {
        warnings.push(`Memory usage increased significantly during ${operationName}`);
      }
      
      return { result, memoryDelta, warnings };
    } catch (error) {
      const endStats = this.getMemoryStats();
      console.error(`❌ Memory Monitor: ${operationName} failed, memory usage: ${(endStats.current / 1024 / 1024).toFixed(1)}MB`);
      throw error;
    }
  }

  /**
   * Cleanup utility for ImageData and Canvas objects
   */
  static cleanupImageResources(...resources: (HTMLCanvasElement | ImageData | null | undefined)[]): void {
    resources.forEach(resource => {
      if (!resource) return;
      
      if (resource instanceof HTMLCanvasElement) {
        // Clear canvas
        const ctx = resource.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, resource.width, resource.height);
        }
        // Set size to 0 to free memory
        resource.width = 0;
        resource.height = 0;
      }
      
      this.untrackResource(resource);
    });
    
    // Suggest garbage collection
    if (this.getMemoryStats().percentage > this.MEMORY_WARNING_THRESHOLD) {
      setTimeout(() => this.forceGarbageCollection(), 0);
    }
  }

  /**
   * Create a memory-efficient copy of ImageData
   */
  static cloneImageData(imageData: ImageData): ImageData {
    // Use the most efficient method available
    if (ImageData.prototype.constructor.length >= 2) {
      return new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      );
    } else {
      // Fallback for older browsers
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(imageData, 0, 0);
      const cloned = ctx.getImageData(0, 0, imageData.width, imageData.height);
      
      // Cleanup
      this.cleanupImageResources(canvas);
      return cloned;
    }
  }
}