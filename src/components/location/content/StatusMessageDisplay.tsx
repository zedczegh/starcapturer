
import React from "react";
import StatusMessage from "@/components/location/StatusMessage";

interface StatusMessageDisplayProps {
  message: string | null;
  onClear: () => void;
}

const StatusMessageDisplay: React.FC<StatusMessageDisplayProps> = ({ 
  message, 
  onClear 
}) => {
  if (!message) return null;
  
  return (
    <StatusMessage 
      message={message} 
      onClear={onClear} 
      autoHideDuration={2000} 
    />
  );
};

export default StatusMessageDisplay;
