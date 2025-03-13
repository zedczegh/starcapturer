
import React from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

interface LocationStatusMessageProps {
  message: string | null;
  type?: 'info' | 'success' | 'error';
  onClear?: () => void;
}

const LocationStatusMessage: React.FC<LocationStatusMessageProps> = ({ 
  message, 
  type = 'info',
  onClear
}) => {
  if (!message) return null;
  
  const bgClass = type === 'error' 
    ? 'bg-destructive/15 text-destructive' 
    : type === 'success'
      ? 'bg-green-500/15 text-green-600'
      : 'bg-primary/15 text-primary';
  
  const Icon = type === 'error' 
    ? AlertCircle 
    : type === 'success'
      ? CheckCircle
      : AlertCircle;
  
  return (
    <div className={`mb-4 p-3 rounded-md flex items-start ${bgClass} animate-fade-in`}>
      <Icon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
      <div className="flex-1">{message}</div>
      {onClear && (
        <button 
          onClick={onClear} 
          className="ml-2 text-current opacity-70 hover:opacity-100"
          aria-label="Clear message"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default LocationStatusMessage;
