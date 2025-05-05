
import React, { useEffect, useState } from "react";

interface StatusMessageProps {
  message: string | null;
  onClear?: () => void;
  autoHideDuration?: number;
  type?: 'info' | 'error' | 'success' | 'warning';
}

const StatusMessage: React.FC<StatusMessageProps> = ({ 
  message, 
  onClear,
  autoHideDuration = 3000,
  type = 'info'
}) => {
  const [visible, setVisible] = useState(false);
  
  // Handle message display with proper animation timing
  useEffect(() => {
    if (message) {
      setVisible(true);
      
      if (onClear && autoHideDuration > 0) {
        const timer = setTimeout(() => {
          // First fade out
          setVisible(false);
          
          // Then clear the message after animation completes
          const clearTimer = setTimeout(() => {
            onClear();
          }, 300); // Match the transition duration
          
          return () => clearTimeout(clearTimer);
        }, autoHideDuration);
        
        return () => clearTimeout(timer);
      }
    } else {
      setVisible(false);
    }
  }, [message, onClear, autoHideDuration]);
  
  if (!message) return null;
  
  // Determine background color based on type
  const getBgColor = () => {
    switch (type) {
      case 'error': return 'bg-red-950/50 border-red-600/30 text-red-200';
      case 'success': return 'bg-green-950/50 border-green-600/30 text-green-200';
      case 'warning': return 'bg-amber-950/50 border-amber-600/30 text-amber-100';
      default: return 'bg-cosmic-800/50 border-primary/20 text-primary-foreground/90';
    }
  };
  
  return (
    <div 
      className={`mb-4 p-3 ${getBgColor()} border rounded-md text-sm shadow-lg transition-all duration-300 ease-in-out ${
        visible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'
      }`}
      role="alert"
    >
      {message}
    </div>
  );
};

export default StatusMessage;
