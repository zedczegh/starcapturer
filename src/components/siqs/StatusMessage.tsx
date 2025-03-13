
import React from "react";

interface StatusMessageProps {
  message: string | null;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="mb-4 p-3 bg-cosmic-800/50 border border-primary/20 rounded-md text-sm shadow-lg animate-fade-in text-primary-foreground/90">
      {message}
    </div>
  );
};

export default StatusMessage;
