/**
 * Canvas Pool for Memory Optimization
 * Reuses canvas instances to reduce garbage collection and memory allocation overhead
 */
export class CanvasPool {
  private static instance: CanvasPool;
  private pool: Map<string, HTMLCanvasElement[]> = new Map();
  private inUse: Set<HTMLCanvasElement> = new Set();
  private maxPoolSize = 20; // Prevent memory leaks

  static getInstance(): CanvasPool {
    if (!CanvasPool.instance) {
      CanvasPool.instance = new CanvasPool();
    }
    return CanvasPool.instance;
  }

  /**
   * Get a canvas from the pool or create new one
   */
  acquire(width: number, height: number): HTMLCanvasElement {
    const key = `${width}x${height}`;
    const poolForSize = this.pool.get(key) || [];
    
    let canvas: HTMLCanvasElement;
    
    if (poolForSize.length > 0) {
      canvas = poolForSize.pop()!;
    } else {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
    }
    
    // Clear the canvas
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    
    this.inUse.add(canvas);
    return canvas;
  }

  /**
   * Return a canvas to the pool
   */
  release(canvas: HTMLCanvasElement): void {
    if (!this.inUse.has(canvas)) {
      return; // Not from our pool
    }
    
    this.inUse.delete(canvas);
    
    const key = `${canvas.width}x${canvas.height}`;
    const poolForSize = this.pool.get(key) || [];
    
    if (poolForSize.length < this.maxPoolSize) {
      poolForSize.push(canvas);
      this.pool.set(key, poolForSize);
    }
  }

  /**
   * Clear all pools to free memory
   */
  clear(): void {
    this.pool.clear();
    this.inUse.clear();
  }

  /**
   * Get pool statistics for debugging
   */
  getStats(): { totalPooled: number; inUse: number; poolSizes: Record<string, number> } {
    let totalPooled = 0;
    const poolSizes: Record<string, number> = {};
    
    for (const [key, canvases] of this.pool.entries()) {
      totalPooled += canvases.length;
      poolSizes[key] = canvases.length;
    }
    
    return {
      totalPooled,
      inUse: this.inUse.size,
      poolSizes
    };
  }
}