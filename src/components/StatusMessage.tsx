
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <div className="h-4 w-4 rounded-full bg-green-500/80"></div>;
      case 'error':
        return <div className="h-4 w-4 rounded-full bg-red-500/80"></div>;
      default:
        return <div className="h-4 w-4 rounded-full bg-blue-500/80"></div>;
    }
  };
  
  return (
    <AnimatePresence>
      {message && (
        <motion.div 
          className={`mb-4 p-3 border rounded-md text-sm shadow-lg flex items-start gap-2 ${getTypeClasses()}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mt-0.5 flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-grow">{message}</div>
          {onClear && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 -mt-1 -mr-1 text-cosmic-200 hover:text-cosmic-50 hover:bg-cosmic-800/50"
              onClick={onClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatusMessage;
