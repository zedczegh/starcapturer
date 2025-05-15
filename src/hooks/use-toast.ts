
import * as React from 'react';
import { toast as sonnerToast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

type ToastProps = React.ComponentPropsWithoutRef<typeof sonnerToast>;

const useToast = () => {
  const isMobile = useIsMobile();

  // Create a wrapped version of toast that handles mobile-specific behaviors
  const toast = {
    ...sonnerToast,
    // Override specific methods for mobile-specific handling
    error: (title: string, data?: any) => {
      const options = {
        position: isMobile ? 'top-center' as const : 'bottom-right' as const,
        duration: isMobile ? 6000 : 5000, // Longer duration on mobile
        ...(typeof data === 'object' ? data : { description: data })
      };
      return sonnerToast.error(title, options);
    }
  };

  return { toast };
};

const toast = {
  ...sonnerToast,
  // Default method for non-hook contexts
  custom: (props: ToastProps) => {
    return sonnerToast(props);
  }
};

export { useToast, toast };
