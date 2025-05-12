
import React, { useEffect } from "react";

interface StatusMessageProps {
  message: string | null;
  onClear?: () => void;
  autoHideDuration?: number;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ 
  message, 
  onClear,
  autoHideDuration = 3000
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
  
  return (
    <div className="mb-4 p-3 bg-cosmic-800/50 border border-primary/20 rounded-md text-sm shadow-lg animate-fade-in text-primary-foreground/90">
      {message}
    </div>
  );
};

export default StatusMessage;
