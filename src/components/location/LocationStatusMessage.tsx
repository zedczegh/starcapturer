
import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from "@/lib/utils";

interface LocationStatusMessageProps {
  message: string | null;
  type: "info" | "error" | "success" | null;
}

const LocationStatusMessage: React.FC<LocationStatusMessageProps> = ({
  message,
  type
}) => {
  if (!message) return null;
  
  const getIcon = () => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "info":
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };
  
  const getClassName = () => {
    const baseClasses = "container mx-auto px-4 mb-6 py-3 rounded-lg text-sm flex items-center gap-2";
    
    switch (type) {
      case "error":
        return cn(baseClasses, "bg-destructive/10 text-destructive border border-destructive/20");
      case "success":
        return cn(baseClasses, "bg-success/10 text-success border border-success/20");
      case "info":
      default:
        return cn(baseClasses, "bg-primary/10 text-primary border border-primary/20");
    }
  };
  
  return (
    <div className={getClassName()}>
      {getIcon()}
      <p>{message}</p>
    </div>
  );
};

export default LocationStatusMessage;
