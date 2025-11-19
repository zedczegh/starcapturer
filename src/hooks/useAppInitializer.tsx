import { useEffect } from 'react';

const useAppInitializer = () => {
  useEffect(() => {
    // Preload critical resources
    const preloadCriticalResources = () => {
      // Preload fonts
      const fontPreloads = [
        'Inter',
        'ui-sans-serif',
        'system-ui'
      ];

      fontPreloads.forEach(font => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      });

      // Prefetch common API endpoints
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          // Prefetch user data if authenticated
          const token = localStorage.getItem('supabase.auth.token');
          if (token) {
            fetch('/api/user/profile', { 
              method: 'GET',
              headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => {}); // Silent fail for prefetch
          }
        });
      }
    };

    // Optimize images with lazy loading and WebP support
    const optimizeImages = () => {
      // Check WebP support
      const supportsWebP = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      };

      if (supportsWebP()) {
        document.documentElement.classList.add('webp-support');
      }

      // Implement progressive image loading
      const images = document.querySelectorAll('img[data-src]');
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            img.classList.remove('loading');
            observer.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    };

    // Performance monitoring
    const initializePerformanceMonitoring = () => {
      // Monitor Core Web Vitals
      if ('web-vitals' in window) {
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          getCLS(console.log);
          getFID(console.log);
          getFCP(console.log);
          getLCP(console.log);
          getTTFB(console.log);
        });
      }

      // Monitor long tasks
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) {
              console.warn('Long task detected:', entry);
            }
          });
        });
        
        try {
          observer.observe({ entryTypes: ['longtask'] });
        } catch (e) {
          // Longtask API not supported
        }
      }
    };

    // Optimize DOM operations
    const optimizeDOM = () => {
      // Use document fragments for batch DOM updates
      window.requestAnimationFrame(() => {
        // Batch any initial DOM manipulations here
        document.body.classList.add('app-initialized');
      });
    };

    // Memory management
    const initializeMemoryManagement = () => {
      // Clean up unused resources on visibility change
      const handleVisibilityChange = () => {
        if (document.hidden) {
          // Clean up heavy resources when tab is not visible
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
              // Clear unnecessary caches
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => {
                    if (name.includes('old-') || name.includes('temp-')) {
                      caches.delete(name);
                    }
                  });
                });
              }
            });
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    };

    // Initialize service worker for caching
    const initializeServiceWorker = async () => {
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('SW registered:', registration);
        } catch (error) {
          console.log('SW registration failed:', error);
        }
      }
    };

    // Run optimizations
    preloadCriticalResources();
    optimizeImages();
    initializePerformanceMonitoring();
    optimizeDOM();
    const cleanupMemoryManagement = initializeMemoryManagement();
    initializeServiceWorker();

    // Cleanup function
    return () => {
      cleanupMemoryManagement?.();
    };
  }, []);
};

export default useAppInitializer;