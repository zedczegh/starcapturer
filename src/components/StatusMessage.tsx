
import React, { useEffect } from "react";

interface StatusMessageProps {
  message: string | null;
  type?: 'info' | 'success' | 'error';
  onClear?: () => void;
  autoHideDuration?: number;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ 
  message, 
  type = 'info',
  onClear,
  autoHideDuration = 0
}) => {
  useEffect(() => {
    if (message && onClear && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onClear();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [message, onClear, autoHideDuration]);
  
  if (!message) return null;
  
  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-950/40 border-green-500/30 text-green-100';
      case 'error':
        return 'bg-red-950/40 border-red-500/30 text-red-100';
      default:
        return 'bg-cosmic-800/50 border-primary/20 text-primary-foreground/90';
    }
  };
  
  return (
    <div className={`mb-4 p-3 border rounded-md text-sm shadow-lg animate-fade-in ${getTypeClasses()}`}>
      {message}
    </div>
  );
};

export default StatusMessage;
