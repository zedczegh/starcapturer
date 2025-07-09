/**
 * Enhanced performance optimization utilities
 */

// Preload critical resources
export function preloadCriticalResources(): void {
  if (typeof window === 'undefined') return;
  
  // Preload critical CSS
  const criticalCSS = [
    '/assets/index.css'
  ];
  
  criticalCSS.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
  });
  
  // Preconnect to external APIs with priority
  const externalDomains = [
    { url: 'https://api.open-meteo.com', priority: 'high' },
    { url: 'https://restapi.amap.com', priority: 'medium' }
  ];
  
  externalDomains.forEach(({ url, priority }) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    if (priority === 'high') {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  });

  // Prefetch DNS lookups for critical domains
  const dnsPrefetch = [
    'https://nominatim.openstreetmap.org',
    'https://tile.openstreetmap.org'
  ];
  
  dnsPrefetch.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
}

// Optimize images loading with intersection observer
export function optimizeImageLoading(): void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px 0px', // Load images 50px before they come into view
    threshold: 0.01
  });
  
  // Observe all lazy images
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// Enhanced debounce function with immediate execution option
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => ReturnType<T> {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null as any;
      if (!immediate) return func.apply(null, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) return func.apply(null, args);
  };
}

// Enhanced throttle function with trailing edge option  
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
  options: { leading?: boolean; trailing?: boolean } = { leading: true, trailing: true }
): (...args: Parameters<T>) => ReturnType<T> | void {
  let inThrottle: boolean;
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      if (options.leading !== false) {
        return func.apply(null, args);
      }
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
      lastRan = Date.now();
    } else {
      if (options.trailing !== false) {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(() => {
          if (Date.now() - lastRan >= limit) {
            func.apply(null, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    }
  };
}

// Batch API calls to reduce network overhead
export class APIBatcher {
  private batches = new Map<string, Array<{ args: any[]; resolve: Function; reject: Function }>>();
  private timers = new Map<string, NodeJS.Timeout>();
  private batchDelay: number;

  constructor(batchDelay: number = 50) {
    this.batchDelay = batchDelay;
  }

  batch<T>(
    key: string,
    apiCall: (...args: any[]) => Promise<T>,
    ...args: any[]
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batches.has(key)) {
        this.batches.set(key, []);
      }

      this.batches.get(key)!.push({ args, resolve, reject });

      // Clear existing timer
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key)!);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        const batch = this.batches.get(key) || [];
        this.batches.delete(key);
        this.timers.delete(key);

        if (batch.length === 1) {
          // Single call, no batching needed
          try {
            const result = await apiCall(...batch[0].args);
            batch[0].resolve(result);
          } catch (error) {
            batch[0].reject(error);
          }
        } else {
          // Multiple calls, process in parallel but limit concurrency
          const concurrencyLimit = 3;
          const chunks = [];
          for (let i = 0; i < batch.length; i += concurrencyLimit) {
            chunks.push(batch.slice(i, i + concurrencyLimit));
          }

          for (const chunk of chunks) {
            await Promise.all(
              chunk.map(async ({ args, resolve, reject }) => {
                try {
                  const result = await apiCall(...args);
                  resolve(result);
                } catch (error) {
                  reject(error);
                }
              })
            );
          }
        }
      }, this.batchDelay);

      this.timers.set(key, timer);
    });
  }
}

// Global API batcher instance
export const globalAPIBatcher = new APIBatcher(100);

// Memory optimization for large lists
export function optimizeListRendering<T>(
  items: T[],
  maxVisible: number = 50
): { visibleItems: T[]; hasMore: boolean } {
  if (items.length <= maxVisible) {
    return { visibleItems: items, hasMore: false };
  }
  
  return {
    visibleItems: items.slice(0, maxVisible),
    hasMore: true
  };
}

// Lazy evaluation for expensive computations
export function createLazyEvaluator<T>(computation: () => T): () => T {
  let cached: T;
  let computed = false;
  
  return () => {
    if (!computed) {
      cached = computation();
      computed = true;
    }
    return cached;
  };
}

// Resource prioritization
export function prioritizeResource(priority: 'high' | 'medium' | 'low' = 'medium') {
  if (typeof window === 'undefined' || !('scheduler' in window)) return;
  
  const priorityMap = {
    high: 'user-blocking',
    medium: 'user-visible', 
    low: 'background'
  } as const;
  
  // @ts-ignore - scheduler API is experimental
  if (window.scheduler?.postTask) {
    // @ts-ignore
    return window.scheduler.postTask(() => {}, { priority: priorityMap[priority] });
  }
}

// Component update optimization
export function shouldComponentUpdate<T extends Record<string, any>>(
  prevProps: T,
  nextProps: T,
  dependencies: (keyof T)[]
): boolean {
  return dependencies.some(key => prevProps[key] !== nextProps[key]);
}