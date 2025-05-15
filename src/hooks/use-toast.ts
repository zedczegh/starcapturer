
import * as React from 'react';
import { toast as sonnerToast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ExternalToast } from 'sonner';

type ToastProps = React.ComponentPropsWithoutRef<typeof sonnerToast>;

const useToast = () => {
  const isMobile = useIsMobile();

  // Create a wrapped version of toast that handles mobile-specific behaviors
  return {
    toast: {
      // Use the error method with mobile considerations
      error: (title: string, data?: any) => {
        const options = {
          position: isMobile ? 'top-center' as const : 'bottom-right' as const,
          duration: isMobile ? 6000 : 5000, // Longer duration on mobile
          ...(typeof data === 'object' ? data : { description: data })
        };
        return sonnerToast.error(title, options);
      },
      success: (title: string, data?: any) => {
        const options = {
          position: isMobile ? 'top-center' as const : 'bottom-right' as const,
          duration: isMobile ? 6000 : 5000,
          ...(typeof data === 'object' ? data : { description: data })
        };
        return sonnerToast.success(title, options);
      },
      info: (title: string, data?: any) => {
        const options = {
          position: isMobile ? 'top-center' as const : 'bottom-right' as const,
          duration: isMobile ? 6000 : 5000,
          ...(typeof data === 'object' ? data : { description: data })
        };
        return sonnerToast.info(title, options);
      },
      warning: (title: string, data?: any) => {
        const options = {
          position: isMobile ? 'top-center' as const : 'bottom-right' as const,
          duration: isMobile ? 6000 : 5000,
          ...(typeof data === 'object' ? data : { description: data })
        };
        return sonnerToast.warning(title, options);
      },
      // Forward other methods directly to sonnerToast
      promise: sonnerToast.promise,
      loading: sonnerToast.loading,
      dismiss: sonnerToast.dismiss,
      custom: sonnerToast.custom
    }
  };
};

// Default export for use in non-hook contexts with simplified signature
const toast = {
  error: (title: string, description?: string | Record<string, any>) => {
    if (typeof description === 'string') {
      return sonnerToast.error(title, { description });
    }
    return sonnerToast.error(title, description);
  },
  success: (title: string, description?: string | Record<string, any>) => {
    if (typeof description === 'string') {
      return sonnerToast.success(title, { description });
    }
    return sonnerToast.success(title, description);
  },
  info: (title: string, description?: string | Record<string, any>) => {
    if (typeof description === 'string') {
      return sonnerToast.info(title, { description });
    }
    return sonnerToast.info(title, description);
  },
  warning: (title: string, description?: string | Record<string, any>) => {
    if (typeof description === 'string') {
      return sonnerToast.warning(title, { description });
    }
    return sonnerToast.warning(title, description);
  },
  promise: sonnerToast.promise,
  loading: sonnerToast.loading,
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom
};

export { useToast, toast };
