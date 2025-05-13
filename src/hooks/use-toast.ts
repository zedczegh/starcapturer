
import { useEffect, useState } from "react";
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
};

type UseToastReturn = {
  toast: (props: ToastProps) => void;
  dismiss: (toastId?: string) => void;
};

export function useToast(): UseToastReturn {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  function toast(props: ToastProps) {
    if (!isMounted) return;
    
    const { title, description, variant, duration = 5000 } = props;
    
    sonnerToast(title || "", {
      description,
      duration,
      className: variant === "destructive" ? "bg-destructive text-destructive-foreground" : "",
    });
  }

  return {
    toast,
    dismiss: sonnerToast.dismiss,
  };
}

export const toast = {
  success: (message: string, opts = {}) => sonnerToast.success(message, opts),
  error: (message: string, opts = {}) => sonnerToast.error(message, opts),
  warning: (message: string, opts = {}) => sonnerToast.warning(message, opts),
  info: (message: string, opts = {}) => sonnerToast.info(message, opts),
  dismiss: sonnerToast.dismiss,
};
